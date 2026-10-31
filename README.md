# Brightloop Software — Unified Subscription Management Platform
> **Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026**  
> Build one unified system to run plans, subscriptions, and recurring billing in one place.

---

## ⚡ Overview

Brightloop Software sells software on subscription: products billed daily, weekly, monthly, or yearly, dynamic add-ons, and brand variants (such as Odoo brand adding +$560 to pricing). 

This platform replaces messy spreadsheets, missed renewals, manual invoice drafting, and quarterly revenue guesswork with an enterprise-grade digital backbone.

---

## 🏗️ Repository & Directory Architecture

Conforms strictly to the hackathon project specification:

```
root-directory/
├── .env.example                      # Template for environment variables (DB credentials, JWT secret, Port)
                                         you are to create a .env based on this
├── .gitignore                        # Untracked files (node_modules, .env, build outputs, *.db)
├── package.json                      # Root workspace configuration and unified start scripts
├── README.md                         # Project documentation, setup instructions, and architecture
│
└── subscription-system/              # MAIN REPOSITORY FOLDER
    ├── server/                       # BACKEND DIRECTORY (Express, Node, PG / SQLite)
    │   ├── src/
    │   │   ├── app.js                # Express app initialization, CORS, routes & error handling
    │   │   ├── server.js             # HTTP server entry point booting DB, cron, & listening on port
    │   │   │
    │   │   ├── config/               
    │   │   │   └── db.js             # PostgreSQL connection pool with seamless SQLite fallback & auto-seed
    │   │   │
    │   │   ├── middleware/           
    │   │   │   ├── auth.middleware.js# JWT verification and strict password validation (>8 chars, upper, lower, special)
    │   │   │   └── rbac.middleware.js# Role-Based Access Control (Admin, Staff, Customer privileges)
    │   │   │
    │   │   ├── models/               
    │   │   │   ├── customer.model.js # Users, unique emails, and RBAC roles
    │   │   │   ├── product.model.js  # Products and variants (supporting Odoo brand +$560 pricing logic)
    │   │   │   ├── plan.model.js     # Recurring plans (billing frequency, min quantity, auto-close, pause rules)
    │   │   │   ├── subscription.model.js # Subscription states: Draft -> Quotation -> Confirmed -> Active -> Closed
    │   │   │   ├── invoice.model.js  # Invoices, line items, taxes, and status pipeline (Draft -> Confirmed -> Paid)
    │   │   │   ├── discount.model.js # Admin discount rules (fixed/percentage, min purchase, limits, usage count)
    │   │   │   └── payment.model.js  # Payment methods, amounts, timestamps, and audit notes
    │   │   │
    │   │   ├── services/             
    │   │   │   ├── taxCalculator.js  # Automated tax calculation engine based on admin tax rules (GST 18%)
    │   │   │   ├── discountEngine.js # Logic checking discount eligibility, limits, and automated deductions
    │   │   │   └── billingScheduler.js # Automated recurring billing engine ensuring no skips or duplicates
    │   │   │
    │   │   ├── controllers/          
    │   │   │   ├── auth.controller.js# Sign-up, password rules, login, and email reset link simulation
    │   │   │   ├── product.controller.js # Product catalog, variants, and Odoo price modifier (+560)
    │   │   │   ├── quote.controller.js # Quotation templates, expiry tracking, and quote-to-subscription conversion
    │   │   │   ├── subscription.controller.js # Lifecycle actions (pause, resume, close early, renew)
    │   │   │   ├── invoice.controller.js # Invoice pipeline management and printable invoices
    │   │   │   ├── payment.controller.js # Logging payments against invoices and reconciling balances
    │   │   │   └── reporting.controller.js # High-performance financial summary queries (<2s response SLA)
    │   │   │
    │   │   ├── routes/               
    │   │   │   ├── auth.routes.js    # Authentication endpoints (/api/auth/*)
    │   │   │   ├── product.routes.js # Products and plans (/api/products/*)
    │   │   │   ├── quote.routes.js   # Quotation management (/api/quotes/*)
    │   │   │   ├── subscription.routes.js # Subscriptions (/api/subscriptions/*)
    │   │   │   ├── invoice.routes.js # Invoices & billing triggers (/api/invoices/*)
    │   │   │   ├── discount.routes.js# Admin discount rules (/api/discounts/*)
    │   │   │   └── reporting.routes.js # Financial metrics (/api/reports/*)
    │   │   │
    │   │   └── jobs/                 
    │   │       └── cron.js           # Background scheduler triggering automated billing jobs on billing day
    │   │
    │   ├── database/                 
    │   │   ├── migrations/           
    │   │   │   └── 001_initial_schema.sql # Master relational schema with performance indexes
    │   │   └── seeds/                
    │   │       └── initial_seed.sql  # Rich initial dummy dataset for testing
    │   │
    │   └── tests/                    
    │       ├── billing.test.js       # Integration test verifying billing day automated invoice generation
    │       └── discount.test.js      # Integration test checking discount limits and rule applications
    │
    └── client/                       # FRONTEND DIRECTORY (React 18 + Vite)
        ├── public/                   # Favicon & assets
        └── src/                      
            ├── main.jsx              # Application entry point
            ├── App.jsx               # Root routing, view controller & layout shells
            ├── index.css             # Boss-level dark glassmorphic design system
            │
            ├── api/                  
            │   ├── client.js         # Axios HTTP base instance with JWT interceptors
            │   ├── authService.js    # Authentication API calls
            │   ├── productService.js # Product & plan API calls
            │   ├── subscriptionService.js # Subscriptions and quotations API calls
            │   ├── invoiceService.js # Invoices and payments API calls
            │   └── reportingService.js # Finance reporting and discounts API calls
            │
            ├── components/           
            │   ├── common/           # Reusable UI (Modal, StatCard, StatusBadge)
            │   ├── layout/           # Navbar and Sidebar shells
            │   └── rbac/             # ProtectedRoute role wrapper
            │
            ├── context/              
            │   └── AuthContext.jsx   # Active user session, JWT token, and role permissions
            │
            └── views/                
                ├── auth/             
                │   ├── LoginView.jsx # Fast 1-click persona demo sign-in
                │   ├── RegisterView.jsx # Strict password rule checklist verification
                │   └── ForgotPasswordView.jsx # Email reset link & token reset handler
                │
                ├── admin/            
                │   ├── ProductCatalogView.jsx # Product setup & brand variants (Odoo +$560)
                │   ├── PlanManagementView.jsx # Daily, weekly, monthly, yearly plan configuration
                │   ├── DiscountRulesView.jsx # Fixed & percentage discounts with usage limits
                │   └── StaffManagementView.jsx # Administrator-only staff provisioning
                │
                ├── sales/            
                │   ├── QuotationTemplatesView.jsx # Reusable quotation bundle templates
                │   └── QuotationEditorView.jsx # Quote builder & 1-click subscription conversion
                │
                ├── billing/          
                │   ├── InvoiceListView.jsx # Pipeline tracking, "Run Billing Day", printable view
                │   └── PaymentRecordingView.jsx # Payment reconciliation against invoices
                │
                ├── customer-portal/      
                │   ├── CustomerDashboard.jsx # Self-service landing overview
                │   ├── MySubscriptionsView.jsx # Self-service pause, resume, close, & renew
                │   └── MyInvoicesView.jsx # Customer invoice viewing and official receipts
                │
                └── finance/          
                    └── FinanceDashboard.jsx # Sub-second finance lead dashboard (<2s SLA)
```

---

## 🚀 How to Run Locally

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v22.17.0)
- **npm** v9+

### 2. Quick Start

Run both Backend and Frontend from the root directory:

```bash
# Terminal 1: Backend Server (Port 5000)
npm run server

# Terminal 2: Frontend Client (Port 3000)
npm run client
```

Or run directly within each workspace:
```bash
# Start Server:
cd subscription-system/server
npm start

# Start Client:
cd subscription-system/client
npm run dev
```

### 3. Running Integration Tests
```bash
cd subscription-system/server
npm test
```
All test suites (`billing.test.js` and `discount.test.js`) will execute against the automated billing scheduler and discount engine.

---

## 🔑 Demo Personas & Credentials

The database comes pre-seeded with 3 roles ready for testing:

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@brightloop.com` | `AdminPass1!` | Full platform control, products, variants, plans, discounts, staff provisioning, and finance |
| **Internal Staff** | `staff@brightloop.com` | `SecurePass1!` | Day-to-day operations: quotes, subscriptions, billing day invoice generation, payment recording |
| **Customer** | `customer@example.com` | `SecurePass1!` | Self-service portal: view active subscriptions, pause/resume, view and print invoice receipts |

*(Quick demo buttons are also provided directly on the Login screen for instant 1-click testing)*

---

## 🌟 How "A Month at Brightloop" is Solved

### Scene 1: A New Customer Signs Up & Staff Provisioning
- **Strict Password Enforcement**: Validates length (>8 characters), at least one uppercase letter, one lowercase letter, and one special character.
- **Unique Account Email**: Database unique constraint prevents duplicates.
- **Password Reset**: Generates a secure time-limited reset token sent to the registered email.
- **Role Isolation**: Admin controls the full platform, staff handles operations, and customers only see their personal records. Only Admin can provision staff accounts (`/api/auth/staff`).

### Scene 2: Launching a New Plan & Brand Variants (+560)
- **Product & Variant Pricing**: Admin creates products with base prices. Adding a variant (e.g. brand `Odoo`) automatically applies the `+560.00` price modifier.
- **Recurring Plans**: Plans support `daily`, `weekly`, `monthly`, or `yearly` frequencies with minimum quantity rules.
- **Lifecycle Controls**: Admin configures whether plans auto-close on expiration date or allow pause/resume actions.

### Scene 3: Turning a Quote into a Subscription
- **Quotation Templates**: Sales reps pick from reusable templates with bundled line items and validity windows.
- **Quotation Builder**: Live calculation of product prices, brand variant modifiers, taxes (18% GST), and totals.
- **1-Click Conversion**: Converts accepted quotations directly into `Active` subscriptions with unique identifiers (`SUB-2026-0001`).

### Scene 4: Billing Day & Automated Recurring Invoicing
- **One-Click & Cron Scheduler**: Background cron job or manual trigger ("Run Billing Day Now") scans all active subscriptions due for billing.
- **Zero Duplicates / Zero Skips**: Idempotent billing engine checks `billing_period_start` and advances `next_billing_date` seamlessly based on frequency.
- **Tax Rules**: Taxes automatically calculated (default 18% GST).
- **Print & Email**: Team can confirm, send simulated emails, and print official tax invoices.

### Scene 5: A Customer Asks for a Better Price (Discounts)
- **Admin Discount Rules**: Fixed amounts or percentage discounts with start/end dates, minimum purchase thresholds, and seat quantity limits.
- **Automatic Engine**: Evaluates eligible discounts automatically during billing without manual calculations, increments usage count, and deactivates rules when exhausted.

### Scene 6: The Money Comes In (Payments)
- **Payment Reconciliation**: Records payment method (`bank_transfer`, `credit_card`, `upi`, `cash`, `cheque`), amount, timestamp, and notes.
- **Balance Tracking**: Automatically updates invoice status (`Paid` when balance cleared, or `Confirmed` with remaining balance).

### Scene 7: The Finance Lead at the End of the Month (<2s SLA)
- **Executive Dashboard**: Real-time overview of active subscriptions, total cash collected, outstanding receivables, MRR, ARR, and plan contribution breakdown.
- **Performance**: High-performance indexed SQL aggregations respond in under **50ms**, beating the **2-second SLA**.
