# CLAUDE.md - Klientská datová platforma

## Přehled projektu

SaaS datová platforma pro správu a vizualizaci dat pro klienty. Hostováno na racek.digital.

---

## Technologický stack

### Frontend
- **Next.js 14+** (App Router)
- **TypeScript** (striktní mód, žádné `any`)
- **Tailwind CSS** pro styling
- **shadcn/ui** pro UI komponenty
- **Recharts** pro grafy
- **TanStack Table** pro pokročilé tabulky s virtualizací
- **React Query** pro data fetching a caching

### Backend
- **Next.js API Routes**
- **Prisma ORM** pro typově bezpečnou práci s DB
- **PostgreSQL** databáze
- **Redis** pro caching (volitelně)

### Autentizace
- **NextAuth.js** (Auth.js)
- Session-based autentizace
- Role-based access control (RBAC)

### Import dat
- **Papa Parse** pro CSV
- **xlsx** (SheetJS) pro Excel
- **fast-xml-parser** pro XML

### Fakturace & Export
- **QR platba** - generování QR kódů pro platby
- **Pohoda XML** - export faktur do účetního systému
- **Nodemailer** / **Resend** - rozesílka emailů

---

## Rychlé příkazy

```bash
# Instalace závislostí
npm install

# Vývojový server
npm run dev

# Build produkce
npm run build

# Spuštění produkce
npm start

# Prisma příkazy
npx prisma generate      # Generování klienta
npx prisma migrate dev   # Vývojové migrace
npx prisma studio        # DB GUI
npx prisma db push       # Push schema bez migrací

# Linting a formátování
npm run lint
npm run lint:fix

# Testy
npm run test
npm run test:watch
```

---

## Struktura projektu

```
/app
├── (auth)/                         # Autentizace
│   ├── login/page.tsx
│   └── logout/page.tsx
│
├── (admin)/                        # Admin sekce (role: admin)
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── clients/                    # Správa klientů platformy
│   ├── import/                     # Import dat
│   └── settings/                   # Globální nastavení
│
├── (client)/                       # Klientská sekce (role: client)
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── revenue/                    # Modul obraty
│   ├── inventory/                  # Modul sklad
│   ├── leads/                      # Modul leads
│   └── telephony/                  # Modul telefonie
│       ├── customers/              # Správa zákazníků a čísel
│       ├── billing/                # Vyúčtování
│       ├── invoices/               # Faktury
│       └── payments/               # Platby a účetnictví
│
├── api/
│   ├── auth/[...nextauth]/route.ts
│   ├── admin/                      # Admin API
│   ├── client/                     # Klientské API
│   ├── webhooks/                   # Webhook příjem (auth v header)
│   └── health/route.ts             # Health check endpoint
│
├── components/
│   ├── ui/                         # shadcn komponenty
│   ├── charts/                     # Grafové komponenty
│   ├── tables/                     # Tabulkové komponenty
│   ├── import/                     # Import komponenty
│   ├── invoices/                   # Fakturační komponenty
│   └── layout/                     # Layout komponenty
│
├── lib/
│   ├── db.ts                       # Prisma client
│   ├── auth.ts                     # Auth konfigurace
│   ├── utils.ts
│   ├── qr-payment.ts               # Generování QR plateb
│   ├── pohoda-export.ts            # Export do Pohoda XML
│   ├── email/                      # Email service
│   │   ├── templates/              # Email šablony
│   │   └── sender.ts               # Odesílání s rate limiting
│   └── validators/                 # Zod schémata
│
├── hooks/
│   ├── useClientData.ts
│   ├── useExport.ts
│   └── useInvoice.ts
│
├── types/
│   ├── index.ts
│   └── enums.ts                    # Všechny enumy na jednom místě
│
└── jobs/                           # Background jobs (cron)
    ├── xml-feed-sync.ts
    ├── invoice-sender.ts           # Rozesílka faktur
    └── payment-import.ts           # Import plateb z banky
```

---

## Databázový model (Prisma Schema)

### Enumy (používat VŽDY místo stringů)

```prisma
enum UserRole {
  ADMIN
  CLIENT
}

enum Module {
  REVENUE
  INVENTORY
  LEADS
  TELEPHONY
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  PARTIALLY_PAID
  OVERDUE
  CANCELLED
}

enum PaymentStatus {
  MATCHED       // Spárováno s fakturou
  UNMATCHED     // Nespárováno
  OVERPAID      // Přeplatek
}

enum StockChangeType {
  SYNC
  MANUAL
  SALE
  RETURN
}

enum WebhookType {
  GENERIC
  SGTM
  CUSTOM
}

enum LeadSource {
  WEBHOOK
  SGTM
  MANUAL
  IMPORT
}
```

### Core tabulky

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String?
  role          UserRole  @default(CLIENT)
  clientId      String?
  client        Client?   @relation(fields: [clientId], references: [id])

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Soft delete

  auditLogs     AuditLog[]

  @@index([clientId])
  @@index([email])
}

model Client {
  id            String    @id @default(cuid())
  name          String
  slug          String    @unique // URL-friendly identifikátor

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Soft delete

  users         User[]
  settings      ClientSettings?

  // Relace na všechny moduly
  revenueData   RevenueData[]
  products      Product[]
  stockChanges  StockChange[]
  leads         Lead[]
  events        Event[]
  webhooks      Webhook[]

  // Modul Telefonie
  teleCustomers     TeleCustomer[]
  phoneNumbers      PhoneNumber[]
  billingRecords    BillingRecord[]
  invoices          Invoice[]
  payments          Payment[]

  @@index([slug])
}

model ClientSettings {
  id              String   @id @default(cuid())
  clientId        String   @unique
  client          Client   @relation(fields: [clientId], references: [id])

  // Explicitní pole místo JSON
  timezone        String   @default("Europe/Prague")
  dateFormat      String   @default("DD.MM.YYYY")
  currency        String   @default("CZK")
  activeModules   Module[]

  // Fakturační nastavení
  companyName     String?
  companyAddress  String?
  companyIco      String?
  companyDic      String?
  bankAccount     String?
  bankIban        String?
  invoicePrefix   String   @default("FV")
  invoiceNextNum  Int      @default(1)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model AuditLog {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  clientId    String
  action      String   // "read" | "create" | "update" | "delete"
  resource    String   // název tabulky
  resourceId  String?
  oldValue    Json?    // Původní hodnota při update/delete
  newValue    Json?    // Nová hodnota při create/update
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([clientId, createdAt])
  @@index([userId, createdAt])
  @@index([resource, resourceId])
}

model ImportHistory {
  id          String   @id @default(cuid())
  clientId    String
  userId      String
  module      Module
  fileName    String
  fileSize    Int
  rowCount    Int
  status      String   // "pending" | "processing" | "completed" | "failed"
  errorLog    String?
  createdAt   DateTime @default(now())
  completedAt DateTime?

  @@index([clientId, createdAt])
}
```

### Modul Obraty

```prisma
model RevenueData {
  id            String   @id @default(cuid())
  clientId      String
  client        Client   @relation(fields: [clientId], references: [id])

  date          DateTime @db.Date
  revenue       Decimal  @db.Decimal(12, 2) // Obrat
  adSpend       Decimal  @db.Decimal(12, 2) // Spend v reklamách
  returns       Decimal  @db.Decimal(12, 2) // Vratky
  ordersCount   Int                          // Počet objednávek
  source        String?                      // Zdroj dat pro filtrování

  // NEPOČÍTAT: profit, pno, aov - počítat dynamicky!
  // profit = revenue - returns - adSpend
  // pno = adSpend / revenue * 100
  // aov = revenue / ordersCount

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([clientId, date, source]) // Unikátní kombinace
  @@index([clientId, date])
  @@index([date])
}
```

### Modul Sklad

```prisma
model Product {
  id              String    @id @default(cuid())
  clientId        String
  client          Client    @relation(fields: [clientId], references: [id])

  externalId      String    // ID z feedu
  name            String
  sku             String?
  price           Decimal   @db.Decimal(10, 2)
  stockQuantity   Int       @default(0)
  category        String?
  brand           String?
  imageUrl        String?
  feedUrl         String?   // Zdroj XML

  // Důležitá pole extrahovaná z feedu (ne jako JSON!)
  ean             String?
  weight          Decimal?  @db.Decimal(8, 3)
  availability    String?

  lastSyncAt      DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  stockChanges    StockChange[]

  @@unique([clientId, externalId])
  @@index([clientId, category])
  @@index([clientId, brand])
  @@index([sku])
}

model StockChange {
  id            String          @id @default(cuid())
  clientId      String
  client        Client          @relation(fields: [clientId], references: [id])
  productId     String
  product       Product         @relation(fields: [productId], references: [id])

  previousQty   Int
  newQty        Int
  changeType    StockChangeType
  note          String?

  recordedAt    DateTime        @default(now())

  @@index([clientId, recordedAt])
  @@index([productId, recordedAt])
}
```

### Modul Leads

```prisma
model Lead {
  id            String     @id @default(cuid())
  clientId      String
  client        Client     @relation(fields: [clientId], references: [id])

  source        LeadSource

  // Click IDs - extrahované pole
  gclid         String?
  fbclid        String?

  // UTM parametry - extrahované pole
  utmSource     String?
  utmMedium     String?
  utmCampaign   String?
  utmTerm       String?
  utmContent    String?

  // Kontaktní údaje
  email         String?
  phone         String?
  name          String?

  // Ostatní data jako JSON (méně důležité)
  formData      Json?

  // Metadata
  ipAddress     String?
  userAgent     String?
  pageUrl       String?

  createdAt     DateTime   @default(now())

  events        Event[]

  @@index([clientId, createdAt])
  @@index([clientId, source])
  @@index([email])
}

model Event {
  id          String   @id @default(cuid())
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id])
  leadId      String?
  lead        Lead?    @relation(fields: [leadId], references: [id])

  eventName   String
  eventData   Json?

  timestamp   DateTime @default(now())

  @@index([clientId, timestamp])
  @@index([leadId])
  @@index([eventName])
}

model Webhook {
  id              String      @id @default(cuid())
  clientId        String
  client          Client      @relation(fields: [clientId], references: [id])

  name            String
  token           String      @unique @default(cuid()) // Pro auth v header
  type            WebhookType
  fieldMapping    Json?       // Mapování polí
  active          Boolean     @default(true)

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([token])
}
```

### Modul Telefonie

```prisma
// Zákazník telefonních služeb (jeden zákazník = více čísel)
model TeleCustomer {
  id              String    @id @default(cuid())
  clientId        String
  client          Client    @relation(fields: [clientId], references: [id])

  // Identifikace
  customerNumber  String    // Zákaznické číslo
  name            String

  // Fakturační údaje
  billingName     String?   // Fakturační jméno (pokud jiné)
  billingAddress  String?
  billingCity     String?
  billingZip      String?
  billingCountry  String    @default("CZ")
  ico             String?
  dic             String?
  email           String?
  phone           String?

  // Cenové podmínky
  discountPercent Decimal   @default(0) @db.Decimal(5, 2)
  customPricing   Json?     // Speciální ceny pro určité služby

  // Fakturační nastavení
  paymentTermDays Int       @default(14)
  invoiceEmail    String?   // Kam posílat faktury

  note            String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  phoneNumbers    PhoneNumber[]
  billingRecords  BillingRecord[]
  invoices        Invoice[]

  @@unique([clientId, customerNumber])
  @@index([clientId])
  @@index([name])
}

// Telefonní čísla
model PhoneNumber {
  id              String    @id @default(cuid())
  clientId        String
  client          Client    @relation(fields: [clientId], references: [id])
  customerId      String
  customer        TeleCustomer @relation(fields: [customerId], references: [id])

  number          String    // Telefonní číslo
  label           String?   // Popisek (např. "Hlavní linka", "Fax")
  active          Boolean   @default(true)

  // Tarif/balíček
  tariffName      String?
  monthlyFee      Decimal?  @db.Decimal(10, 2)

  activatedAt     DateTime?
  deactivatedAt   DateTime?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  billingRecords  BillingRecord[]

  @@unique([clientId, number])
  @@index([customerId])
}

// Záznamy z podrobného vyúčtování
model BillingRecord {
  id              String    @id @default(cuid())
  clientId        String
  client          Client    @relation(fields: [clientId], references: [id])
  customerId      String
  customer        TeleCustomer @relation(fields: [customerId], references: [id])
  phoneNumberId   String?
  phoneNumber     PhoneNumber? @relation(fields: [phoneNumberId], references: [id])

  // Období
  billingPeriod   DateTime  @db.Date // Měsíc vyúčtování (první den měsíce)

  // Detail hovoru/služby
  callDate        DateTime?
  callTime        DateTime? @db.Time
  calledNumber    String?
  duration        Int?      // Délka v sekundách
  serviceType     String    // Typ služby (hovor, SMS, data, měsíční poplatek, atd.)
  description     String?

  // Ceny
  units           Decimal   @db.Decimal(10, 3) // Jednotky (minuty, MB, ks)
  unitPrice       Decimal   @db.Decimal(10, 4) // Cena za jednotku
  priceWithoutVat Decimal   @db.Decimal(10, 2)
  vatRate         Decimal   @default(21) @db.Decimal(5, 2)
  priceWithVat    Decimal   @db.Decimal(10, 2)

  // Import metadata
  importId        String?   // Reference na ImportHistory
  rawData         Json?     // Původní data z importu

  createdAt       DateTime  @default(now())

  @@index([clientId, billingPeriod])
  @@index([customerId, billingPeriod])
  @@index([phoneNumberId, billingPeriod])
  @@index([serviceType])
}

// Faktury
model Invoice {
  id              String        @id @default(cuid())
  clientId        String
  client          Client        @relation(fields: [clientId], references: [id])
  customerId      String
  customer        TeleCustomer  @relation(fields: [customerId], references: [id])

  // Identifikace
  invoiceNumber   String        // Číslo faktury (např. FV2024001)
  variableSymbol  String        // Variabilní symbol pro platbu

  // Období
  billingPeriodFrom DateTime    @db.Date
  billingPeriodTo   DateTime    @db.Date

  // Datumy
  issueDate       DateTime      @db.Date
  dueDate         DateTime      @db.Date
  taxDate         DateTime      @db.Date // DUZP

  // Částky
  subtotal        Decimal       @db.Decimal(12, 2) // Bez DPH
  vatAmount       Decimal       @db.Decimal(12, 2) // DPH
  total           Decimal       @db.Decimal(12, 2) // Celkem s DPH

  // Stav
  status          InvoiceStatus @default(DRAFT)
  paidAmount      Decimal       @default(0) @db.Decimal(12, 2)

  // Metadata odeslání
  sentAt          DateTime?
  sentTo          String?       // Email kam bylo odesláno
  sentError       String?       // Chyba při odesílání

  // QR kód a export
  qrPaymentData   String?       // Data pro QR platbu
  pohodaExportedAt DateTime?    // Kdy bylo exportováno do Pohoda

  // PDF
  pdfUrl          String?       // URL uloženého PDF

  note            String?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?

  items           InvoiceItem[]
  payments        Payment[]

  @@unique([clientId, invoiceNumber])
  @@index([clientId, status])
  @@index([customerId])
  @@index([dueDate])
  @@index([variableSymbol])
}

model InvoiceItem {
  id              String    @id @default(cuid())
  invoiceId       String
  invoice         Invoice   @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  description     String
  quantity        Decimal   @db.Decimal(10, 3)
  unitPrice       Decimal   @db.Decimal(10, 4)
  vatRate         Decimal   @db.Decimal(5, 2)
  totalWithoutVat Decimal   @db.Decimal(12, 2)
  vatAmount       Decimal   @db.Decimal(12, 2)
  totalWithVat    Decimal   @db.Decimal(12, 2)

  sortOrder       Int       @default(0)

  @@index([invoiceId])
}

// Platby (import z banky)
model Payment {
  id              String        @id @default(cuid())
  clientId        String
  client          Client        @relation(fields: [clientId], references: [id])
  invoiceId       String?
  invoice         Invoice?      @relation(fields: [invoiceId], references: [id])

  // Bankovní transakce
  transactionId   String?       // ID transakce z banky
  bankAccount     String?       // Protiúčet
  amount          Decimal       @db.Decimal(12, 2)
  currency        String        @default("CZK")

  // Párování
  variableSymbol  String?
  specificSymbol  String?
  constantSymbol  String?
  message         String?       // Zpráva pro příjemce

  status          PaymentStatus @default(UNMATCHED)

  paymentDate     DateTime      @db.Date

  // Import metadata
  importId        String?
  rawData         Json?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@unique([clientId, transactionId])
  @@index([clientId, paymentDate])
  @@index([variableSymbol])
  @@index([status])
}

// Fronta pro rozesílku faktur (spam resistance)
model InvoiceEmailQueue {
  id              String    @id @default(cuid())
  invoiceId       String
  recipientEmail  String
  scheduledFor    DateTime  // Kdy má být odesláno
  attempts        Int       @default(0)
  lastAttemptAt   DateTime?
  lastError       String?
  sentAt          DateTime?

  createdAt       DateTime  @default(now())

  @@index([scheduledFor, sentAt])
}
```

---

## KRITICKÉ BEZPEČNOSTNÍ PRAVIDLA

### 1. Striktní izolace dat klientů

**KAŽDÝ databázový dotaz MUSÍ obsahovat filtr na `clientId`!**

```typescript
// ✅ SPRÁVNĚ
const data = await prisma.revenueData.findMany({
  where: {
    clientId: session.user.clientId,  // POVINNÉ!
    date: { gte: from, lte: to }
  }
});

// ❌ ŠPATNĚ - NIKDY NEDĚLAT!
const data = await prisma.revenueData.findMany({
  where: { date: { gte: from, lte: to } }
});
```

### 2. Webhook autentizace v HEADER (ne v URL!)

```typescript
// ❌ ŠPATNĚ - token v URL se loguje
POST /api/webhooks/abc123

// ✅ SPRÁVNĚ - token v header
POST /api/webhooks
Authorization: Bearer abc123
```

### 3. Soft deletes

Nikdy nemazat data přímo - vždy nastavit `deletedAt`:

```typescript
// ✅ SPRÁVNĚ
await prisma.customer.update({
  where: { id },
  data: { deletedAt: new Date() }
});

// Ve všech dotazech filtrovat
where: { deletedAt: null, ... }
```

### 4. Audit log

Logovat všechny změny citlivých dat:

```typescript
await prisma.auditLog.create({
  data: {
    userId: session.user.id,
    clientId: session.user.clientId,
    action: 'update',
    resource: 'invoice',
    resourceId: invoice.id,
    oldValue: oldInvoice,
    newValue: newInvoice,
    ipAddress: req.headers.get('x-forwarded-for'),
  }
});
```

### 5. Rate limiting pro emaily

Rozesílka faktur musí respektovat limity:
- Max 50 emailů/hodinu
- Min 30s mezi emaily stejnému příjemci
- Časové okno 8:00-18:00 pracovní dny

---

## Vypočítávané hodnoty (NIKDY neukládat!)

```typescript
// V API nebo DB view - počítat dynamicky
const revenueWithMetrics = revenueData.map(row => ({
  ...row,
  profit: row.revenue - row.returns - row.adSpend,
  pno: row.revenue > 0 ? (row.adSpend / row.revenue) * 100 : 0,
  aov: row.ordersCount > 0 ? row.revenue / row.ordersCount : 0,
}));
```

Nebo jako PostgreSQL view:
```sql
CREATE VIEW revenue_with_metrics AS
SELECT
  *,
  revenue - returns - ad_spend AS profit,
  CASE WHEN revenue > 0 THEN (ad_spend / revenue) * 100 ELSE 0 END AS pno,
  CASE WHEN orders_count > 0 THEN revenue / orders_count ELSE 0 END AS aov
FROM revenue_data;
```

---

## Moduly aplikace

### 1. Modul Obraty
Správa obratových dat s metrikami:
- Obrat (revenue) - uloženo
- Spend v reklamách (ad_spend) - uloženo
- Vratky (returns) - uloženo
- Počet objednávek (orders_count) - uloženo
- **Zisk (profit)** - POČÍTAT dynamicky
- **PNO** - POČÍTAT dynamicky
- **AOV** - POČÍTAT dynamicky

### 2. Modul Sklad
Správa produktů z XML feedů:
- Automatický sync z XML URL
- Sledování změn skladu (pouze diff, ne každý sync)
- Kategorizace produktů

### 3. Modul Leads
Správa příchozích leadů:
- Příjem přes webhooky (auth v header!)
- sGTM integrace
- Tracking UTM parametrů a click IDs
- Timeline eventů

### 4. Modul Telefonie

#### 4.1 Správa zákazníků a čísel
- Zákazníci s fakturačními údaji
- Více telefonních čísel na zákazníka
- Individuální slevy a cenové podmínky
- Tarify a měsíční poplatky

#### 4.2 Import vyúčtování
- Import podrobného vyúčtování (CSV/XLSX)
- Párování s čísly a zákazníky
- Filtrování a analýza spotřeby
- Historie vyúčtování

#### 4.3 Fakturace
- Generování moderních faktur s QR kódem pro platbu
- Automatický výpočet z vyúčtování
- Export do účetního programu Pohoda (XML formát)
- PDF generování a ukládání

#### 4.4 Rozesílka faktur
- Bezpečné odesílání emailů (spam resistance)
- Časové okno pro odesílání (pracovní doba)
- Rate limiting (max X emailů/hodinu)
- Fronta s retry logikou
- Tracking doručení

#### 4.5 Účetnictví a platby
- Import plateb z banky (CSV/API)
- Automatické párování podle VS
- Přehled neuhrazených faktur
- Přehled přeplatků
- Upomínky

---

## API Endpoints

### Autentizace
```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/session
```

### Health check
```
GET /api/health   # Pro monitoring a load balancer
```

### Admin
```
GET|POST   /api/admin/clients
GET|PUT|DELETE /api/admin/clients/[id]
POST /api/admin/import/revenue
POST /api/admin/import/products
POST /api/admin/import/xml-feed
GET  /api/admin/import/history
GET  /api/admin/audit-log
```

### Webhooky (autorizace v header!)
```
POST /api/webhooks
Headers: Authorization: Bearer [token]
```

### Klientská data
```
# Obraty
GET /api/client/revenue?from=&to=&granularity=day|month|year
GET /api/client/revenue/summary
GET /api/client/revenue/export?format=csv|xlsx|pdf

# Sklad
GET /api/client/inventory/products?page=&limit=&search=&category=
GET /api/client/inventory/products/[id]
GET /api/client/inventory/products/[id]/history
GET /api/client/inventory/export

# Leads
GET /api/client/leads?from=&to=&source=
GET /api/client/leads/[id]
GET /api/client/leads/export
GET /api/client/events?from=&to=
GET /api/client/events/timeline

# Telefonie - Zákazníci
GET|POST   /api/client/telephony/customers
GET|PUT|DELETE /api/client/telephony/customers/[id]
GET /api/client/telephony/customers/[id]/numbers
POST /api/client/telephony/customers/[id]/numbers

# Telefonie - Vyúčtování
GET  /api/client/telephony/billing?period=&customerId=
POST /api/client/telephony/billing/import
GET  /api/client/telephony/billing/export

# Telefonie - Faktury
GET|POST   /api/client/telephony/invoices
GET|PUT    /api/client/telephony/invoices/[id]
POST /api/client/telephony/invoices/[id]/generate-pdf
POST /api/client/telephony/invoices/[id]/send
GET  /api/client/telephony/invoices/[id]/pdf
POST /api/client/telephony/invoices/export-pohoda

# Telefonie - Platby
GET  /api/client/telephony/payments
POST /api/client/telephony/payments/import
POST /api/client/telephony/payments/[id]/match
GET  /api/client/telephony/payments/unmatched
GET  /api/client/telephony/payments/overpaid
```

---

## Coding standards

### TypeScript
- Striktní mód, žádné `any`
- Používej Zod pro validaci vstupů
- Named exports pro všechny moduly
- PascalCase pro komponenty, camelCase pro proměnné
- **Enumy definovat v Prisma schema, používat všude**

### Komponenty
- Každá komponenta v samostatném souboru
- Props definovat jako interface
- Používat React Query pro data fetching
- Loading, error a empty states pro všechny async operace

### API Routes
- Vždy validovat vstupy pomocí Zod
- Vždy ověřovat session a clientId
- Používat try/catch pro error handling
- Vracet konzistentní response format
- **Logovat do AuditLog při změnách**

### Databáze
- Indexovat sloupce používané ve WHERE a ORDER BY
- Pro velká data používat server-side paginaci
- Agregace provádět na úrovni DB, ne v aplikaci
- Cachovat časté dotazy
- **Soft deletes pro vše důležité**

---

## Postup vývoje

### Fáze 1: Základy
1. Setup Next.js projektu
2. Konfigurace Prisma + databáze
3. Implementace autentizace
4. Základní layout (admin/client)
5. CRUD pro klienty

### Fáze 2: Modul Obraty
1. DB schema (bez počítaných polí!)
2. Import CSV/XLSX
3. API endpointy s dynamickým výpočtem
4. Dashboard s grafy
5. Tabulky s exportem

### Fáze 3: Modul Sklad
1. XML feed parser
2. Automatický sync (pouze změny!)
3. UI pro prohlížení

### Fáze 4: Modul Leads
1. Webhook endpoint (auth v header)
2. sGTM integrace
3. Timeline zobrazení

### Fáze 5: Modul Telefonie
1. Správa zákazníků a čísel
2. Import vyúčtování
3. Generování faktur s QR
4. Export do Pohoda
5. Rozesílka s rate limiting
6. Import plateb a párování

### Fáze 6: Polish
1. Optimalizace výkonu
2. Error tracking (Sentry)
3. Testy
4. Dokumentace

---

## Důležité poznámky pro AI asistenty

1. **Bezpečnost dat je priorita #1** - Nikdy nevytvářej dotazy bez clientId filtru
2. **Validuj všechny vstupy** - Používej Zod schémata
3. **Používej TypeScript striktně** - Žádné `any`, žádné `@ts-ignore`
4. **Soft deletes** - Nikdy přímo nemazat, vždy nastavit deletedAt
5. **Audit log** - Logovat všechny změny citlivých dat
6. **Nepočítat v DB** - profit, pno, aov počítat dynamicky
7. **Stock changes** - Ukládat pouze změny, ne každý sync
8. **Webhook auth** - Token v header, nikdy v URL
9. **Email rate limiting** - Respektovat limity pro spam resistance
10. **Enumy** - Používat Prisma enumy, ne stringy
