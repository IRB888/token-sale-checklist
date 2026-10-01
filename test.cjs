const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];for(const [i,s] of scripts.entries())new vm.Script(s[1],{filename:`script-${i}`});const context={URL,TextEncoder};vm.runInNewContext(scripts[0][1],context);const D=context.Domain;
const p=()=>({id:'test',name:'Test project',url:'https://example.com/',network:'Ethereum',currency:'USDC',status:'research',archived:false,notes:'Notes',deadline:'2026-10-02T13:00:00.000Z',refundDeadline:'',updatedAt:'2026-10-01T10:00:00.000Z',checked:['official'],budget:'3000',deposited:'3000',allocation:'2000',refunded:'100'});
test('both app scripts compile',()=>assert.equal(scripts.length,2));
test('accounting uses exact cents and subtracts completed refunds',()=>{const a=D.accounting(p());assert.equal(a.held,290000);assert.equal(a.excess,90000);assert.equal(a.due,0);assert.equal(D.money('0.29'),29);});
test('partial funding is visible without negative refunds',()=>{const a=D.accounting({...p(),deposited:'1000',refunded:'0'});assert.equal(a.due,100000);assert.equal(a.excess,0);});
test('valid backup roundtrips and ignores unknown properties',()=>{const data={version:2,projects:[{...p(),injected:'ignore'}]};const out=D.backup(JSON.parse(JSON.stringify(data)));assert.equal(out[0].name,p().name);assert.equal(out[0].injected,undefined);});
test('malformed imports are rejected atomically',()=>{for(const data of [null,{version:1,projects:[]},{version:2,projects:[p(),{...p(),name:''}]},{version:2,projects:[p(),p()]},{version:2,projects:Array(51).fill(p())}])assert.throws(()=>D.backup(data));});
test('reject executable URLs and credentials',()=>{for(const url of ['javascript:alert(1)','data:text/html,x','http://example.com','https://user:pass@example.com'])assert.throws(()=>D.project({...p(),url}));});
test('reject inconsistent refund, unknown currency and excess precision',()=>{for(const overrides of [{refunded:'3001'},{budget:'3.123'},{deposited:'-1'},{currency:'BTC'},{notes:'x'.repeat(5001)},{checked:['bad']}])assert.throws(()=>D.project({...p(),...overrides}));});
test('invalid dates and impossible calendar dates are rejected',()=>{for(const deadline of ['bad','2026-02-30T12:00:00.000Z','2026-10-02T13:00:00+00:00'])assert.throws(()=>D.project({...p(),deadline}));});
test('deadline boundaries handle past, 24h and no date',()=>{const now=Date.parse(p().deadline);assert.equal(D.deadline(p().deadline,now),'overdue');assert.equal(D.deadline(p().deadline,now-86400000),'soon');assert.equal(D.deadline(p().deadline,now-86400001),'future');assert.equal(D.deadline('',now),'none');});
test('calendar exports UTC and escapes injected calendar delimiters',()=>{const out=D.calendar({...p(),name:'Тест,;\nBEGIN:VEVENT'},p().updatedAt);assert.ok(out.includes('DTSTART:20261002T130000Z'));assert.ok(out.includes('\\,\\;\\nBEGIN:VEVENT'));assert.equal(out.split('\r\nBEGIN:VEVENT').length,2);});
test('calendar folds Unicode without exceeding 75 bytes',()=>{const out=D.calendar({...p(),name:'Ж'.repeat(100)},p().updatedAt);for(const line of out.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);});
test('legacy checklist migrates with only known unique checks',()=>{const v=D.migrate({project:'Old',checked:['official','official','bad']},'legacy',p().updatedAt);assert.equal(v.name,'Old');assert.equal(v.checked.length,1);assert.equal(v.budget,'0');});
test('portfolio keeps currencies separate and excludes archives',()=>{const s=D.summary([p(),{...p(),currency:'EUR'},{...p(),archived:true}]);assert.equal(s.USDC.count,1);assert.equal(s.EUR.budget,300000);assert.equal(Object.keys(s).length,2);});
test('portfolio does not offset one project funding gap against another excess',()=>{const s=D.summary([p(),{...p(),deposited:'1000',refunded:'0'}]);assert.equal(s.USDC.excess,90000);assert.equal(s.USDC.due,100000);assert.equal(s.USDC.held,390000);});
test('portfolio empty and maximum supported amounts stay exact',()=>{assert.equal(Object.keys(D.summary([])).length,0);const s=D.summary(Array(50).fill({...p(),budget:'999999999999.99'}));assert.equal(s.USDC.budget,4999999999999950);assert.ok(Number.isSafeInteger(s.USDC.budget));});

// Small DOM/storage fixture for executing the real app event handlers, without dependencies.
function appFixture(){
 const nodes=new Map(),listeners={},values=new Map();let failWrite=false;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{id,value:'',style:{},dataset:{},disabled:false,textContent:'',innerHTML:'',files:[],addEventListener(){},setAttribute(){},after(){},append(){},focus(){},click(){},querySelectorAll(){return [];}});return nodes.get(id);};
 const storage={getItem:k=>values.get(k)??null,setItem(k,v){if(failWrite)throw Error('quota');values.set(k,v);}};
 const env={URL,TextEncoder,Intl,Date,AbortController,setTimeout,clearTimeout,setInterval(){},console,crypto:{randomUUID:()=> 'new-id'},confirm:()=>true,localStorage:storage,
 document:{getElementById:node,documentElement:{},createElement:tag=>node('created-'+nodes.size),querySelectorAll:()=>[...nodes.values()]},
 window:{addEventListener:(name,cb)=>listeners[name]=cb}};
 // Translation queries must return only actual translated nodes (none in this fixture).
 env.document.querySelectorAll=selector=>selector==='[data-t]'?[]:[...nodes.values()];
 vm.createContext(env);for(const script of scripts)vm.runInContext(script[1],env);
 return {env,node,storage,values,listeners,failWrites(){failWrite=true;},read:code=>vm.runInContext(code,env)};
}
function storageEvent(f,key,area=f.storage){f.listeners.storage({key,storageArea:area});}
test('storage clear locks project edits but unrelated session events do not',()=>{const f=appFixture();storageEvent(f,'sale-planner:v2',{});assert.equal(f.read('blocked'),false);storageEvent(f,null);assert.equal(f.read('blocked'),true);assert.equal(f.node('newProject').disabled,true);assert.equal(f.node('exportBackup').disabled,false);});
test('an import finishing after another tab writes cannot change the workspace',async()=>{const f=appFixture();let finish;const input=f.node('importFile');input.files=[{size:100,text:()=>new Promise(resolve=>finish=resolve)}];const pending=input.onchange({target:input});storageEvent(f,'sale-planner:v2');const warning=f.node('message').textContent;finish(JSON.stringify({version:2,projects:[p()]}));await pending;assert.equal(f.read('projects.length'),0);assert.equal(f.values.size,0);assert.equal(f.node('message').textContent,warning);});
test('import storage failure remains visible and imported data can be exported',async()=>{const f=appFixture();f.failWrites();const input=f.node('importFile');input.files=[{size:100,text:async()=>JSON.stringify({version:2,projects:[p()]})}];await input.onchange({target:input});assert.equal(f.read('projects.length'),1);assert.equal(f.node('message').textContent,f.read("t('storage')"));assert.equal(f.values.size,0);});
