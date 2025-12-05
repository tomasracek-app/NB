# CLAUDE.md - Klientská datová platforma

## Přehled projektu

SaaS datová platforma pro správu a vizualizaci dat pro klienty. Hostováno na racek.digital.

## Technologický stack

### Frontend
- **Next.js 14+** (App Router)
- **TypeScript** (striktní mód, žádné `any`)
- **Tailwind CSS** pro styling
- **shadcn/ui** pro UI komponenty
- **Recharts** nebo **Chart.js** pro grafy
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
```

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
│   ├── clients/                    # Správa klientů
│   ├── import/                     # Import dat
│   └── settings/                   # Globální nastavení
│
├── (client)/                       # Klientská sekce (role: client)
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── revenue/                    # Modul obraty
│   ├── inventory/                  # Modul sklad
│   └── leads/                      # Modul leads
│
├── api/
│   ├── auth/[...nextauth]/route.ts
│   ├── admin/                      # Admin API
│   ├── client/                     # Klientské API
│   └── webhooks/[token]/route.ts   # Webhook příjem
│
├── components/
│   ├── ui/                         # shadcn komponenty
│   ├── charts/                     # Grafové komponenty
│   ├── tables/                     # Tabulkové komponenty
│   ├── import/                     # Import komponenty
│   └── layout/                     # Layout komponenty
│
├── lib/
│   ├── db.ts                       # Prisma client
│   ├── auth.ts                     # Auth konfigurace
│   ├── utils.ts
│   └── validators/                 # Zod schémata
│
├── hooks/
│   ├── useClientData.ts
│   └── useExport.ts
│
└── types/
    └── index.ts
```

## Databázový model

### Core tabulky
- `users` - Uživatelé s rolemi (admin/client)
- `clients` - Klienti/organizace

### Modul Obraty
- `revenue_data` - Obratová data (obrat, spend, vratky, zisk, PNO, AOV)

### Modul Sklad
- `products` - Produkty z XML feedů
- `stock_history` - Historie změn skladu

### Modul Leads
- `leads` - Příchozí leady
- `events` - sGTM eventy
- `webhooks` - Konfigurace webhooků

## KRITICKÉ BEZPEČNOSTNÍ PRAVIDLA

### 1. Striktní izolace dat klientů

**KAŽDÝ databázový dotaz MUSÍ obsahovat filtr na `client_id`!**

```typescript
// SPRÁVNĚ
const data = await prisma.revenueData.findMany({
  where: {
    clientId: session.user.clientId,  // POVINNÉ!
    date: { gte: from, lte: to }
  }
});

// ŠPATNĚ - NIKDY NEDĚLAT!
const data = await prisma.revenueData.findMany({
  where: { date: { gte: from, lte: to } }
});
```

### 2. Bezpečnostní middleware pro API

```typescript
// Každý klientský API endpoint MUSÍ používat tento pattern
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Admin může specifikovat client_id
  const clientId = session.user.role === 'admin'
    ? req.headers.get('x-client-id') || session.user.clientId
    : session.user.clientId;

  if (!clientId) {
    return NextResponse.json({ error: 'No client assigned' }, { status: 403 });
  }

  // Všechny dotazy MUSÍ použít clientId
  const data = await prisma.table.findMany({
    where: { clientId }
  });

  return NextResponse.json(data);
}
```

### 3. Row Level Security (RLS)

Implementovat na úrovni PostgreSQL pro dodatečnou ochranu:

```sql
ALTER TABLE revenue_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_isolation ON revenue_data
  USING (client_id = current_setting('app.current_client_id')::uuid);
```

### 4. Audit log

Logovat všechny přístupy k datům pro bezpečnostní audit.

## Coding standards

### TypeScript
- Striktní mód, žádné `any`
- Používej Zod pro validaci vstupů
- Named exports pro všechny moduly
- PascalCase pro komponenty, camelCase pro proměnné

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

### Databáze
- Indexovat sloupce používané ve WHERE a ORDER BY
- Pro velká data používat server-side paginaci
- Agregace provádět na úrovni DB, ne v aplikaci
- Cachovat časté dotazy

## Uživatelské role

### ADMIN
- Plný přístup ke všemu
- Import dat (CSV, XLSX, XML)
- Správa klientů a jejich přístupů
- Konfigurace modulů
- Přiřazování dat ke klientům

### CLIENT
- Omezený přístup POUZE ke svým datům
- Prohlížení přiřazených dat
- Filtrování, řazení, vyhledávání
- Export dat (CSV, XLSX, PDF)
- Zobrazení grafů a vizualizací

## Moduly aplikace

### 1. Modul Obraty
Správa obratových dat s metrikami:
- Obrat (revenue)
- Spend v reklamách (ad_spend)
- Vratky (returns)
- Zisk (profit)
- PNO - podíl nákladů na obratu
- AOV - average order value
- Počet objednávek (orders_count)

### 2. Modul Sklad
Správa produktů z XML feedů:
- Automatický sync z XML URL
- Sledování historie skladových zásob
- Kategorizace produktů

### 3. Modul Leads
Správa příchozích leadů:
- Příjem přes webhooky
- sGTM integrace
- Tracking UTM parametrů a click IDs
- Timeline eventů

## Škálovatelnost

Platforma je navržena pro MILIONY řádků:

1. **Indexace** - Všechny sloupce pro filtrování a řazení
2. **Paginace** - Server-side, nikdy nenačítat vše najednou
3. **Virtualizace** - TanStack Virtual pro velké tabulky
4. **Lazy loading** - Načítat data až když jsou potřeba
5. **Agregace v DB** - Používat SQL agregace, ne JS
6. **Caching** - Redis pro časté dotazy

## API Endpoints

### Autentizace
```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/session
```

### Admin
```
GET|POST   /api/admin/clients
GET|PUT|DELETE /api/admin/clients/[id]
POST /api/admin/import/revenue
POST /api/admin/import/products
POST /api/admin/import/xml-feed
```

### Klientská data
```
GET /api/client/revenue?from=&to=&granularity=day|month|year
GET /api/client/revenue/summary
GET /api/client/revenue/export?format=csv|xlsx|pdf
GET /api/client/inventory/products?page=&limit=&search=
GET /api/client/leads?from=&to=&source=
GET /api/client/events/timeline
```

### Webhooky
```
POST /api/webhooks/[token]   # Příjem leadů/eventů
```

## UI/UX pravidla

- Moderní, čistý design
- Dark mode support
- Responzivní (desktop first)
- Loading states pro všechny async operace
- Error states s jasným popisem
- Empty states s návodem
- Konzistentní spacing a typography

## Postup vývoje

### Fáze 1: Základy
1. Setup Next.js projektu
2. Konfigurace Prisma + databáze
3. Implementace autentizace
4. Základní layout
5. CRUD pro klienty

### Fáze 2: Modul Obraty
1. DB schema
2. Import CSV/XLSX
3. API endpointy
4. Dashboard s grafy
5. Tabulky s exportem

### Fáze 3: Modul Sklad
1. XML feed parser
2. Automatický sync
3. UI pro prohlížení

### Fáze 4: Modul Leads
1. Webhook endpoint
2. sGTM integrace
3. Timeline zobrazení

### Fáze 5: Polish
1. Optimalizace výkonu
2. Error handling
3. Testy

## Důležité poznámky pro AI asistenty

1. **Bezpečnost dat je priorita #1** - Nikdy nevytvářej dotazy bez client_id filtru
2. **Validuj všechny vstupy** - Používej Zod schémata
3. **Používej TypeScript striktně** - Žádné `any`, žádné `@ts-ignore`
4. **Testuj edge cases** - Prázdná data, velké datasety, neplatné vstupy
5. **Dokumentuj složitou logiku** - Komentáře v kódu kde je to potřeba
6. **Optimalizuj pro výkon** - Pamatuj na miliony řádků
