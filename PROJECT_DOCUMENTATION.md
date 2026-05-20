# Payment System — Complete Project Documentation

> A premium SaaS-grade **Payment Collection & Receivables Management System** built with React, Vite, TailwindCSS, and Zustand. Designed for businesses to track invoices, record payments, manage follow-ups, reconcile with Tally, and run automated reminder campaigns.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Getting Started](#getting-started)
3. [Folder Structure](#folder-structure)
4. [Architecture Overview](#architecture-overview)
5. [Data Flow](#data-flow)
6. [Routing & Navigation](#routing--navigation)
7. [State Management](#state-management)
8. [Mock Data Layer](#mock-data-layer)
9. [Service Layer](#service-layer)
10. [Reusable Components](#reusable-components)
11. [Page Modules](#page-modules)
12. [Utility Functions](#utility-functions)
13. [Authentication System](#authentication-system)
14. [Styling & Theme](#styling--theme)
15. [Build & Deployment](#build--deployment)
16. [Default Credentials](#default-credentials)

---

## Tech Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React | 18.3 | UI component library |
| **Bundler** | Vite | 8.x | Dev server & production builds |
| **Styling** | TailwindCSS | 3.4 | Utility-first CSS framework |
| **State** | Zustand | 4.5 | Lightweight global state management |
| **Routing** | React Router DOM | 6.22 | Client-side SPA routing |
| **Charts** | Recharts | 2.10 | Area charts, pie charts for analytics |
| **Icons** | Lucide React | 0.545 | SVG icon set |
| **Toasts** | React Hot Toast | 2.4 | Notification popups |
| **Persistence** | localStorage | Browser API | Data persistence (MVP, no backend) |

---

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd Payment-System

# 2. Install dependencies
npm install

# 3. Start development server (accessible on LAN via --host)
npm run dev

# 4. Build for production
npm run build

# 5. Preview production build
npm run preview
```

The dev server starts at `http://localhost:5173`.

---

## Folder Structure

```
Payment-System/
├── index.html                  # HTML entry point with Google Fonts
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite bundler configuration
├── tailwind.config.js          # TailwindCSS config (darkMode: 'class')
├── postcss.config.js           # PostCSS plugins (tailwind + autoprefixer)
├── eslint.config.js            # Linting rules
├── vercel.json                 # Vercel deployment SPA rewrites
│
├── dist/                       # Production build output (auto-generated)
│
└── src/
    ├── main.jsx                # React DOM entry — renders <App />
    ├── App.jsx                 # Wraps everything in <Providers> + <AppRoutes>
    ├── index.css               # Global styles, Tailwind directives, animations
    │
    ├── Assets/
    │   └── divine-logo.svg     # Brand logo used on login screen
    │
    ├── app/                    # Application shell
    │   ├── providers.jsx       # ThemeContext provider + Toaster setup
    │   ├── layout.jsx          # Authenticated layout (Sidebar + Header + Footer)
    │   └── routes.jsx          # All route definitions + modal state management
    │
    ├── components/             # Reusable UI components
    │   ├── Sidebar.jsx         # Navigation sidebar with role-based menu items
    │   ├── Header.jsx          # Top bar with user info, notifications
    │   ├── Footer.jsx          # Powered-by footer strip
    │   ├── MetricCard.jsx      # Analytics card with gradient accent bar
    │   ├── TableWrapper.jsx    # Standard table container with loading/empty states
    │   ├── StatusTag.jsx       # Color-coded status badge (pending/partial/received)
    │   ├── ModalWrapper.jsx    # Reusable modal overlay with backdrop blur
    │   ├── ProtectedRoute.jsx  # Auth guard wrapper
    │   ├── DataTable.jsx       # Advanced data table (legacy)
    │   ├── LoadingSpinner.jsx  # Spinner animation component
    │   ├── StandardButtons.jsx # Button preset styles
    │   ├── SearchableDropdown.jsx # Filterable select dropdown
    │   ├── ModalAlert.jsx      # Confirmation dialog
    │   ├── ModalForm.jsx       # Form-in-modal pattern
    │   ├── ModalView.jsx       # Read-only detail modal
    │   ├── InfoPopover.jsx     # Hover info tooltip
    │   ├── DragScrollTable.jsx # Horizontally scrollable table
    │   ├── Layout.jsx          # Alternate layout (legacy)
    │   ├── NewPayrollModal.jsx # Payroll modal (legacy)
    │   │
    │   └── modals/             # Domain-specific modal components
    │       ├── FollowUpModal.jsx   # Log follow-up notes with next calling date
    │       └── PaymentModal.jsx    # Record partial/full payments with proof
    │
    ├── pages/                  # Route-level page components
    │   ├── Login.jsx           # Login page (alternate path)
    │   ├── Settings.jsx        # System settings (group heads, payment modes, users)
    │   │
    │   ├── auth/
    │   │   └── Login.jsx       # Primary login page with demo credentials
    │   │
    │   ├── dashboard/
    │   │   └── Dashboard.jsx   # Analytics dashboard with charts & metrics
    │   │
    │   ├── receivables/
    │   │   └── Receivables.jsx # Sales ledger table with search, filter, pagination
    │   │
    │   ├── compare/
    │   │   └── Compare.jsx     # Tally vs Sales reconciliation desk
    │   │
    │   └── campaigns/
    │       └── Campaigns.jsx   # Automated reminder campaign management
    │
    ├── services/               # Business logic layer (data operations)
    │   ├── sales.service.js    # CRUD for sales records, payments, follow-ups
    │   ├── dashboard.service.js# Aggregation logic for dashboard metrics
    │   ├── compare.service.js  # Reconciliation engine (sales vs tally)
    │   └── campaign.service.js # Campaign CRUD and status management
    │
    ├── mock/                   # Seed data (loaded into localStorage on first visit)
    │   ├── sales.json          # 5 sample invoices with payments & follow-ups
    │   ├── tally.json          # 3 tally book entries for reconciliation testing
    │   └── campaigns.json      # 4 sample campaigns (active, sent, paused, draft)
    │
    ├── store/                  # Zustand global state stores
    │   ├── authStore.js        # Authentication state (login/logout/session)
    │   └── dataStore.js        # Shared data store (legacy)
    │
    ├── utils/                  # Pure utility/helper functions
    │   ├── formatCurrency.js   # Formats numbers to ₹XX,XXX Indian locale
    │   ├── formatDate.js       # Formats ISO dates to DD-MMM-YYYY
    │   ├── statusColor.js      # Maps status strings to TailwindCSS color classes
    │   ├── storageManager.js   # localStorage CRUD for settings & users
    │   ├── helpers.js          # Miscellaneous helper functions
    │   └── storageManager.js-tmp # Temp backup (safe to ignore)
    │
    └── lib/
        └── utils.js            # clsx + tailwind-merge utility (cn function)
```

---

## Architecture Overview

The application follows a **layered architecture** pattern designed for clean separation of concerns:

```
┌─────────────────────────────────────────────────┐
│                   Browser UI                     │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Pages    │  │Components│  │   Modals      │  │
│  │(Dashboard,│  │(MetricCard│  │(FollowUp,    │  │
│  │Receivables│  │TableWrap, │  │ Payment)     │  │
│  │Compare,   │  │StatusTag) │  │              │  │
│  │Campaigns, │  │           │  │              │  │
│  │Settings)  │  │           │  │              │  │
│  └─────┬─────┘  └─────┬────┘  └──────┬───────┘  │
│        │              │               │          │
│  ┌─────▼──────────────▼───────────────▼───────┐  │
│  │           Service Layer                     │  │
│  │  (sales.service, dashboard.service,         │  │
│  │   compare.service, campaign.service)        │  │
│  └─────────────────┬──────────────────────────┘  │
│                    │                             │
│  ┌─────────────────▼──────────────────────────┐  │
│  │         localStorage (Browser)              │  │
│  │  payment_system_sales, campaigns, users,    │  │
│  │  settings, user (auth session)              │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Key principles:**
- **Pages** are route-level containers. They call services and render components.
- **Services** encapsulate all data access. No page directly touches localStorage.
- **Components** are pure, reusable UI elements. They receive data via props.
- **Zustand stores** manage cross-cutting state (authentication).
- **Mock JSON** seeds localStorage on first visit, simulating a backend.

---

## Data Flow

```
User Action (e.g. "Record Payment")
        │
        ▼
   Page Component (Receivables.jsx)
        │  opens modal via state setter
        ▼
   Modal Component (PaymentModal.jsx)
        │  user fills form, clicks submit
        ▼
   Service Layer (salesService.addPayment)
        │  reads current data from localStorage
        │  mutates the specific sale record
        │  recalculates receivedAmount, pendingAmount, status
        │  writes updated array back to localStorage
        ▼
   Custom Event (window.dispatchEvent('refresh_sales'))
        │
        ▼
   Page re-fetches data from service → UI updates
```

---

## Routing & Navigation

Defined in `src/app/routes.jsx`. Uses React Router v6 nested routes:

| Path | Component | Auth Required | Description |
|------|-----------|---------------|-------------|
| `/login` | `Login` | No | Authentication page |
| `/` | Redirects to `/dashboard` | Yes | Default redirect |
| `/dashboard` | `Dashboard` | Yes | Analytics overview |
| `/receivables` | `Receivables` | Yes | Invoice ledger & actions |
| `/compare` | `Compare` | Yes | Tally reconciliation |
| `/campaigns` | `Campaigns` | Yes | Reminder automation |
| `/settings` | `Settings` | Yes (ADMIN) | System configuration |
| `*` | Redirects to `/` | — | Catch-all fallback |

**Auth guard:** The `Layout` component checks `useAuthStore().isAuthenticated`. If `false`, it redirects to `/login`.

**Role-based menus:** The `Sidebar` component shows different menu items based on `user.role`:
- **ADMIN** → sees all 5 items including Settings
- **USER/EMPLOYEE** → sees 4 items (no Settings)

---

## State Management

### Zustand Auth Store (`src/store/authStore.js`)

```javascript
// State shape
{
  user: { id, name, password, role } | null,
  isAuthenticated: boolean
}

// Actions
login(userData)    → sets user + persists to localStorage
logout()           → clears user + removes from localStorage
initializeAuth()   → hydrates state from localStorage on app load
```

**Why Zustand over Redux?**
- Zero boilerplate (no actions, reducers, dispatch)
- 1KB bundle size vs Redux's 7KB+
- Perfect for MVP/SaaS dashboards
- Built-in subscription model with React hooks

### localStorage Keys Used

| Key | Purpose | Managed By |
|-----|---------|------------|
| `user` | Current authenticated user session | `authStore.js` |
| `payment_system_sales` | All invoice/sales records | `sales.service.js` |
| `payment_system_campaigns` | Campaign templates | `campaign.service.js` |
| `payment_system_settings` | Group heads & payment modes | `storageManager.js` |
| `payment_system_users` | User accounts list | `storageManager.js` |
| `theme` | Light/dark preference (locked to light) | `providers.jsx` |

---

## Mock Data Layer

Located in `src/mock/`. These JSON files seed localStorage on first app load.

### `sales.json` — Invoice Records

Each sale object represents one invoice:

```json
{
  "id": "sale_001",
  "followUpNo": "FU-1001",
  "customerName": "Rahul Traders",
  "phone": "9876543210",
  "invoiceDate": "2026-05-10",
  "invoiceNo": "INV-001",
  "totalAmount": 50000,
  "receivedAmount": 20000,
  "pendingAmount": 30000,
  "status": "partial",            // "pending" | "partial" | "received"
  "billCopy": "/dummy/invoice.pdf",
  "followUps": [
    {
      "id": 1,
      "note": "Customer asked for 1 week time",
      "nextCallingDate": "2026-05-28",
      "createdAt": "2026-05-20"
    }
  ],
  "payments": [
    {
      "id": 1,
      "amount": 20000,
      "mode": "online",           // "online" | "cheque" | "cash"
      "proof": "/dummy/proof.jpg",
      "remarks": "NEFT received",
      "receivedAt": "2026-05-15"
    }
  ]
}
```

**Status auto-calculation logic** (in `sales.service.js → addPayment`):
- `pendingAmount === 0` → status = `"received"`
- `receivedAmount > 0 && pendingAmount > 0` → status = `"partial"`
- `receivedAmount === 0` → status = `"pending"`

### `tally.json` — Accounting Book Entries

Used by the Compare module for reconciliation. Contains `invoiceNo`, `customerName`, and `totalAmount`.

### `campaigns.json` — Reminder Templates

Each campaign has: `id`, `name`, `type`, `audienceCount`, `sentCount`, `pendingCount`, `lastSent`, `status` (active/sent/paused/draft).

---

## Service Layer

### `sales.service.js`

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `initializeSales()` | — | void | Seeds localStorage from `sales.json` if empty |
| `getSales()` | — | `Sale[]` | Returns all sales from localStorage |
| `saveSales(sales)` | `Sale[]` | void | Writes full sales array to localStorage |
| `addFollowUp(saleId, note, date)` | string, string, string | `Sale[]` | Appends follow-up to a sale |
| `addPayment(saleId, payment)` | string, object | `Sale[]` | Records payment, recalculates amounts & status |

### `dashboard.service.js`

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getDashboardData(dateRange?)` | `{start, end}` or null | object | Computes all dashboard metrics, charts, and tables |

**Returns:**
- `metrics` — totalRevenue, receivedAmount, pendingAmount, overdueAmount, customersCount, invoicesCount
- `revenueTrend` — time-series data for area chart
- `statusData` — pie chart data (Pending/Partial/Received counts)
- `recentFollowUps` — latest 5 follow-up log entries
- `pendingPayments` — top 5 unpaid invoices sorted by amount

### `compare.service.js`

| Method | Returns | Description |
|--------|---------|-------------|
| `getTallyData()` | `TallyEntry[]` | Returns tally mock data |
| `reconcile()` | `ReconcileResult[]` | Cross-matches sales vs tally by `invoiceNo` |

**Reconciliation statuses:** `matched`, `unmatched` (amount mismatch), `missing_in_tally`, `missing_in_sales`

### `campaign.service.js`

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getCampaigns()` | — | `Campaign[]` | All campaigns from localStorage |
| `createCampaign(data)` | `{name, type, audienceCount}` | `Campaign[]` | Creates a new draft campaign |
| `updateCampaignStatus(id, status)` | string, string | `Campaign[]` | Changes campaign status |
| `saveCampaigns(campaigns)` | `Campaign[]` | void | Writes to localStorage |

---

## Reusable Components

### `MetricCard.jsx`
Analytics widget with a gradient accent bar at top, numeric value, icon, and optional trend indicator. Props: `title`, `value`, `icon`, `gradient`, `description`, `trend`, `trendType`.

### `TableWrapper.jsx`
Standardized table container. Handles three states: **loading** (skeleton pulse rows), **data** (renders via `renderRow` callback), **empty** (centered message). Props: `headers[]`, `data[]`, `renderRow(item, idx)`, `loading`, `emptyMessage`.

### `StatusTag.jsx`
Renders a colored pill badge. Maps status strings like `"pending"`, `"partial"`, `"received"`, `"active"`, `"draft"` to background/text/border color classes via `statusColor.js`.

### `ModalWrapper.jsx`
Generic modal overlay with backdrop blur, centered white panel, close button, and scrollable content area. Props: `isOpen`, `onClose`, `title`, `children`.

### `Sidebar.jsx`
Fixed navigation sidebar with brand logo, role-based menu items (NavLink with active indicator), user avatar with initials, and sign-out button. Supports mobile drawer (slide-in with backdrop overlay).

### `Header.jsx`
Sticky top bar showing welcome text, notification bell with red dot indicator, and user avatar with role badge. Clicking avatar triggers logout.

---

## Page Modules

### 1. Login (`src/pages/auth/Login.jsx`)
- Full-screen centered card with brand logo
- User ID + Password inputs with visibility toggle
- Demo credential quick-fill buttons (Admin / User)
- Validates against user accounts stored in localStorage
- On success: calls `authStore.login()` and navigates to `/dashboard`

### 2. Dashboard (`src/pages/dashboard/Dashboard.jsx`)
- **6 metric cards** — Total Revenue, Received, Pending, Overdue, Customers, Invoices
- **Area chart** (Recharts) — Revenue vs Collection trend over time
- **Donut pie chart** — Invoice status distribution (Pending/Partial/Received)
- **2 data tables** — Recent Follow-ups + Top Pending Invoices
- **Global date filter** — Filters all metrics by invoice date range

### 3. Receivables (`src/pages/receivables/Receivables.jsx`)
- Full sales ledger table with columns: Invoice, Customer, Total, Collected, Balance, Status, Actions
- **Search** — filters by customer name, invoice number, or phone
- **Status filter** — dropdown for All/Pending/Partial/Received
- **Sorting** — by invoice date (asc/desc toggle)
- **Pagination** — 8 items per page with prev/next controls
- **Actions per row:**
  - 💬 Log Follow-up → opens `FollowUpModal`
  - ➕ Add Payment → opens `PaymentModal` (only if balance > 0)
  - 📄 View Invoice PDF → external link

### 4. Compare (`src/pages/compare/Compare.jsx`)
- **4 status cards** — Matched, Discrepancies, Missing in Tally, Missing in Sales
- **"Run Reconciler" button** — triggers cross-matching engine with loading spinner
- **Search + status filter** for reconciliation results
- **Table** — Invoice No, Customer, Sales Amount, Tally Amount, Variance, Status badge

### 5. Campaigns (`src/pages/campaigns/Campaigns.jsx`)
- **4 metric cards** — Total Campaigns, Active, Total Reach, Dispatch Rate %
- **Campaign table** — Name, Type, Audience, Dispatched, Remaining, Status, Actions
- **Actions:** Play (activate), Pause, Send Now (dispatch immediately)
- **"New Campaign" modal** — Name, Type (Pending/Overdue/Follow-up), Audience Size, Message Template

### 6. Settings (`src/pages/Settings.jsx`)
- **3 tabbed sections** (capsule pill navigation):
  - **Group Heads** — Add/delete tracking segments
  - **Payment Modes** — Add/delete approved payment channels
  - **User Accounts** — Full CRUD: add new users (ID, name, password, role), inline edit, delete, role badges (ADMIN/USER)

---

## Utility Functions

### `formatCurrency.js`
```javascript
formatCurrency(50000) → "₹50,000"
// Uses Intl.NumberFormat with 'en-IN' locale, INR currency
```

### `formatDate.js`
```javascript
formatDate("2026-05-20") → "20 May 2026"
// Handles invalid dates gracefully, returns original string on failure
```

### `statusColor.js`
Maps status strings to TailwindCSS class strings:
```javascript
statusColor("pending")  → "bg-rose-50 text-rose-700 border-rose-200"
statusColor("partial")  → "bg-amber-50 text-amber-700 border-amber-200"
statusColor("received") → "bg-emerald-50 text-emerald-700 border-emerald-200"
statusColor("active")   → "bg-teal-50 text-teal-700 border-teal-200"
// ... and more for compare/campaign statuses
```

### `storageManager.js`
Manages `payment_system_settings` and `payment_system_users` in localStorage. Provides `getSettings()`, `saveSettings()`, `getUsers()`, `saveUsers()` with default seed data.

---

## Authentication System

**Flow:**
1. User visits any protected route → `layout.jsx` checks `isAuthenticated`
2. If `false` → redirects to `/login`
3. User enters credentials → matched against `getUsers()` from localStorage
4. On match → `authStore.login(user)` stores session in Zustand + localStorage
5. On subsequent visits → `authStore` hydrates from localStorage automatically
6. Logout → clears Zustand state + removes `user` key from localStorage

**Default accounts** (seeded by `storageManager.js`):

| Username | Password | Role | Access Level |
|----------|----------|------|-------------|
| `admin` | `admin123` | ADMIN | Full access including Settings |
| `user` | `user123` | USER | Standard access (no Settings) |

---

## Styling & Theme

- **Framework:** TailwindCSS 3.4 with `darkMode: 'class'`
- **Current Theme:** Permanently locked to **light mode** (see `providers.jsx`)
- **Font:** DM Sans (loaded from Google Fonts in `index.css`)
- **Design Language:** Premium SaaS — white cards, slate-50 backgrounds, indigo-600 accents, subtle shadows, rounded-xl corners, smooth transitions
- **Color Palette:**
  - **Primary:** Indigo-600 (buttons, active states, links)
  - **Success:** Emerald-600 (payments, matched, received)
  - **Warning:** Amber-600 (partial, paused, overdue)
  - **Danger:** Rose-600 (pending, delete, errors)
  - **Neutral:** Slate-50 → Slate-900 scale (backgrounds, text, borders)

---

## Build & Deployment

```bash
# Development
npm run dev          # Starts Vite dev server with HMR on port 5173

# Production
npm run build        # Outputs optimized bundle to dist/
npm run preview      # Serves dist/ locally for testing

# Linting
npm run lint         # Runs ESLint across the codebase
```

**Deployment:** A `vercel.json` is included for Vercel SPA hosting with `rewrites` to handle client-side routing:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

---

## Default Credentials

| Role | ID | Password |
|------|-----|----------|
| Administrator | `admin` | `admin123` |
| Employee | `user` | `user123` |

---

*Built with React + Vite + TailwindCSS + Zustand. Powered by Botivate.*
