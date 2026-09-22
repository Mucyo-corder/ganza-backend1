# WoodApp Backend - Rwanda Timber & Carpentry Business Platform

WoodApp ni porogaramu yubatswe by’umwihariko ifasha abantu bakora ubucuruzi bw’imbaho, ibiti, carpentry, furniture, timber yard na workshops mu Rwanda.

---

## 1. Ikinyarwanda cyakoreshejwe (Glossary & Terminology)

Backend yose ya WoodApp yakozwe hifashishijwe Ikinyarwanda gisanzwe kandi cyumvikana neza ku mucuruzi wo mu Rwanda:

| Ijambo rya Accounting / IT | Icyo rikoreshwa muri WoodApp | Ubusobanuro |
| :--- | :--- | :--- |
| **Inventory / Stock** | **Imbaho mfite** | Umubare w'imbaho n'agaciro kazo mu bubiko |
| **Low Stock Alert** | **Imbaho zisigaye nke** | Iyo imbaho ziri munsi ya minimum stock |
| **Out of Stock** | **Imbaho zarashize** | Iyo nta mbaho zigihari (0 cyangwa munsi) |
| **Sales Revenue** | **Amafaranga nagurishije** | Igiteranyo cy'ibyo nagurishije byose |
| **Cash Received** | **Amafaranga nakiriye** | Amafaranga yinjijwe kuri konti cyangwa mu ntoki |
| **Accounts Receivable** | **Amafaranga abakiriya batarishyura** | Ibirarane by'abakiriya babereyemo business |
| **Accounts Payable** | **Abo ngomba kwishyura / Abo nsize amafaranga** | Umwenda business ibereyemo abagemura imbaho |
| **Expenses** | **Amafaranga nakoresheje** | Ibikoresho, lisansi, inguzanyo, umuriro |
| **Profit** | **Inyungu** | Inyungu isigaye nyuma yo gukuramo ikiguzi |
| **Estimated Tax** | **Umusoro ugereranyijwe** | Igipimo cy'umusoro (TVA 18%, WHT 3%) |
| **Declared Tax** | **Umusoro watangajwe** | Umusoro wemejwe muri RRA |
| **Audit Logs** | **Amateka y’ibyakozwe** | Urutonde rw'ibyakozwe byose bitazasibwa |

---

## 2. Imiterere ya Backend (Architecture)

1. **Language & Runtime:** TypeScript (Strict), Node.js, Express
2. **Database Engine:** Google Cloud Firestore (Multi-tenant database with strict `businessId` isolation)
3. **Double-Entry Accounting Engine:** Buri kintu kigurishijwe cyangwa kiguze cyandika muri `financial_transactions` ku buryo debit na credit bihora bingana neza.
4. **Tax Calculation Engine:** Ibarwa ry'imisoro mu Rwanda (TVA 18%, Withholding Tax 3%, regime ya Micro na Small Business) ifite itandukaniro ryumvikana hagati y'**Umusoro ugereranyijwe** n'**Umusoro watanzwe**.
5. **Security & Data Integrity:**
   - Helmet security headers
   - Rate limiting (Auth & General API)
   - RBAC (`owner`, `boss`, `manager`, `accountant`, `cashier`, `stock_keeper`, `carpenter`)
   - Zod schema validation
   - Atomic Firestore batches & transactions
   - Immutable audit logs

---

## 3. Endpoints Z’ingenzi (API Reference)

### A. Ubuzima bwa Server (Health Check)
- `GET /health` - Reba niba server, database na microservices zikora neza.

### B. Kwinjira no Kurema Business (Auth & Business)
- `POST /api/auth/register` - Kwiyandikisha
- `POST /api/auth/login` - Kwinjira no guhabwa JWT token
- `POST /api/business` - Kurema business nshya y'imbaho
- `GET /api/business/me` - Amakuru ya business ukoreramo

### C. Imbaho Mfite (Inventory & Stock)
- `GET /api/inventory` - Urutonde rw'imbaho zose muri stock
- `POST /api/inventory` - Kwandika imbaho nshya
- `PATCH /api/inventory/:id/adjust` - Guhindura umubare w'imbaho (Stock adjustment)
- `GET /api/inventory/low-stock` - Imbaho zisigaye nke cyangwa zarashize

### D. Kugurisha (Sales & Invoicing)
- `POST /api/sales` - Kwandika ibyo wagurishije (bigabanya stock mu buryo bwikora, byongera amafaranga cyangwa umwenda w'umukiriya, bikandika debit/credit muri accounting)
- `GET /api/sales` - Amateka y'ibyo wagurishije
- `GET /api/sales/:id` - Ibisobanuro by'ifatire runaka

### E. Kugura Imbaho (Purchases)
- `POST /api/purchases` - Kwandika imbaho ziguwe (byongera stock, byandika umwenda w'umugemuzi)
- `GET /api/purchases` - Urutonde rw'ibyo waguze

### F. Kwishyura n'Imyenda (Payments)
- `POST /api/payments` - Kwishyura ideni (ry'umukiriya cyangwa ry'umugemuzi). Sisitemu ibuza kwishyura arenze umwenda!

### G. Abakiriya n'Abagemura (Customers & Suppliers)
- `GET /api/customers` - Urutonde rw'abakiriya n'imyenda yabo
- `GET /api/suppliers` - Urutonde rw'abagemuzi n'imyenda tubagomba

### H. Amafaranga Yakoreshejwe (Expenses)
- `POST /api/expenses` - Kwandika ayasohotse (umuriro, imishahara, ubwikorezi...)
- `GET /api/expenses` - Urutonde rw'amafaranga yakoreshejwe

### I. Imisoro ya Rwanda (Tax Estimation)
- `GET /api/tax/estimate` - Kubara umusoro ugereranyijwe (TVA 18% & WHT)

### J. Dashboard & Raporo (Reporting)
- `GET /api/dashboard` - Incamake ya business
- `GET /api/reports/daily` - Raporo y'umunsi yiteguye koherezwa kuri WhatsApp
- `GET /api/reports/monthly` - Raporo y'ukwezi n'inyungu nyakuri

### K. Kamera z'Ububiko & AI Vision
- `POST /api/cameras` - Kwandika kamera nshya y'ububiko
- `POST /api/cameras/events` - Kwakira ibyakozwe na kamera (motion, vehicle loading...)

---

## 4. Ibipimo by'Igerageza (Automated Tests)

Muri uyu mushinga harimo tests 8 zuzuye zemeza:
1. Double-entry accounting consistency (Debits = Credits)
2. Rwanda tax estimation logic (TVA 18% & WHT)
3. Inventory status threshold calculations
4. Full sales, stock decrement, and credit settlement lifecycle
5. Zod request validation and Kinyarwanda error messages

Gukora tests:
\`\`\`bash
npm test
\`\`\`

---

## 5. Gushyira kuri Render (Deployment on Render)

Fayilo ya `render.yaml` yateguwe neza:
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Port: `3000`
- Region: `frankfurt` (Ihuza vuba na Kigali/Rwanda)
- Auto-deploy: `true`

---
© 2026 WoodApp Rwanda. Backend Architecture for Timber & Carpentry Enterprises.
