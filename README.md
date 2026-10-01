# Sale Planner

A bilingual, private workspace for token-sale research, checklists, deadlines and payment records.

**[Open the app](https://irb888.github.io/token-sale-checklist/)** · [Report a bug](https://github.com/IRB888/token-sale-checklist/issues)

## Version 2.0

- Up to 50 projects with search, active/archive views and reversible archiving.
- Ten readiness checks per project, notes, official HTTPS link, network and manually selected stage.
- Planned budget, deposit, allocation and completed refund records in USDC, USDT, USD or EUR. No cross-currency aggregation or assumed stablecoin exchange rate.
- Application/refund deadlines shown in the device timezone, overdue/24-hour indicators and UTC `.ics` calendar export.
- JSON backup export and validated import that **adds copies, never replaces current projects**.
- Russian/English UI, mobile layout, local persistence, dirty-form prompts and cross-tab conflict protection.
- Migration of the original `token-sale-checklist:v1` data when available on the same origin.

## Payment accounting

Amounts use exact integer cents, supporting up to two decimal places. All four amounts belong to the selected currency; changing its label does not convert them.

- Deposit less refunds = deposited − refunded
- Excess over allocation = max(0, deposited − refunded − allocation)
- Allocation still unfunded = max(0, allocation − deposited + refunded)

An excess is a bookkeeping result, **not a guarantee of a refund**. Allocation, payment timing, gas, vesting, eligibility and refund entitlement must be checked on the official platform. Records and stages are manual; nothing is read from a wallet or submitted to a sale.

## Backups and privacy

Everything stays in this browser. No external requests, accounts, analytics or wallet access. Storage key: `sale-planner:v2`. Download backups regularly: clearing site data or moving to a different device removes access to locally saved projects. Backups contain notes and payment records, so keep them private. Do not enter private keys, passwords or identity documents.

Import accepts version 2 JSON, at most 1 MB and 50 total projects including archived ones. Validation rejects invalid amounts/dates, unknown enums, duplicate IDs within the imported file, unsafe URLs, excessive sizes and refunds above deposits. Imported project IDs are regenerated to avoid collisions. Unknown object properties are discarded. User text is escaped when displayed. If saved browser data is unreadable, it is retained and is not silently overwritten.

Calendar files use UTC to preserve the entered instant when imported in another timezone. The app shows deadline warnings only while open; it does not run background notifications. Your calendar app may offer reminders after you import the file.

## Tested

Cent-based accounting, partial funding, schema validation, import rejection, dangerous URLs, date boundaries, calendar escaping/UTF-8 folding and v1 migration.

## Run locally

Download `index.html` and open it in a modern browser, or serve this folder with `python3 -m http.server 8000`. No installation or build required. Local browser storage works best on a stable HTTP(S) origin. Moving between file://, localhost and the hosted site does not migrate browser data automatically.

## Development & tests

Requires Node.js 22+ only for tests. Run `node --test test.cjs`. No npm packages or runtime dependencies. The tests execute the same pure domain functions embedded in `index.html`, and check syntax of both scripts. GitHub Actions runs these tests on pushes and pull requests.

The single-file app has two clearly separated scripts: `domain` (validation and calculations) and `app` (UI, persistence and interactions). CSS is embedded so the app can be downloaded and used without a build. Contributions should include tests for changed accounting/validation behavior.

Built with AI assistance. This is an independent planning tool, not an official Legion or Jumper integration. It does not submit applications, connect a wallet or promise an allocation or a higher reputation score.

## License

MIT License

Copyright (c) 2026 IRB888

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
