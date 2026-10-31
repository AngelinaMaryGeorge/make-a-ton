# Brightloop Software — Unified Subscription Management Platform

> **Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026**  
> Build one unified system to run plans, subscriptions, and recurring billing in one place.

---

##  Overview

Brightloop Software sells software on subscription: products billed daily, weekly, monthly, or yearly, dynamic add-ons, and brand variants (such as Odoo brand adding +$560 to pricing).

This platform replaces messy spreadsheets, missed renewals, manual invoice drafting, and quarterly revenue guesswork with an enterprise-grade digital backbone.

---

## Repository & Directory Structure

The tree below reflects the project files. Dependency folders, generated build output, and the local SQLite database are omitted.

```
.
├── .env.example
├── .gitignore
├── Brightloop_API.postman_collection.json
├── README.md
├── file_structure
├── package.json
├── package-lock.json
├── backend/
│   └── sql
└── subscription-system/
    ├── client/
    │   ├── index.html
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── public/
    │   │   └── favicon.svg
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       ├── api/
    │       │   ├── authService.js
    │       │   ├── client.js
    │       │   ├── invoiceService.js
    │       │   ├── productService.js
    │       │   ├── reportingService.js
    │       │   └── subscriptionService.js
    │       ├── components/
    │       │   ├── common/
    │       │   │   └── UIComponents.jsx
    │       │   ├── layout/
    │       │   │   ├── Navbar.jsx
    │       │   │   └── Sidebar.jsx
    │       │   └── rbac/
    │       │       └── ProtectedRoute.jsx
    │       ├── context/
    │       │   └── AuthContext.jsx
    │       └── views/
    │           ├── admin/
    │           │   ├── DiscountRulesView.jsx
    │           │   ├── PlanManagementView.jsx
    │           │   ├── ProductCatalogView.jsx
    │           │   └── StaffManagementView.jsx
    │           ├── auth/
    │           │   ├── ForgotPasswordView.jsx
    │           │   ├── LoginView.jsx
    │           │   └── RegisterView.jsx
    │           ├── billing/
    │           │   ├── InvoiceListView.jsx
    │           │   └── PaymentRecordingView.jsx
    │           ├── customer-portal/
    │           │   ├── CustomerDashboard.jsx
    │           │   ├── MyInvoicesView.jsx
    │           │   └── MySubscriptionsView.jsx
    │           ├── finance/
    │           │   └── FinanceDashboard.jsx
    │           └── sales/
    │               ├── QuotationEditorView.jsx
    │               └── QuotationTemplatesView.jsx
    └── server/
        ├── package.json
        ├── database/
        │   ├── migrations/
        │   │   └── 001_initial_schema.sql
        │   └── seeds/
        │       └── initial_seed.sql
        ├── src/
        │   ├── app.js
        │   ├── server.js
        │   ├── config/
        │   │   └── db.js
        │   ├── controllers/
        │   │   ├── auth.controller.js
        │   │   ├── invoice.controller.js
        │   │   ├── payment.controller.js
        │   │   ├── product.controller.js
        │   │   ├── quote.controller.js
        │   │   ├── reporting.controller.js
        │   │   └── subscription.controller.js
        │   ├── jobs/
        │   │   └── cron.js
        │   ├── middleware/
        │   │   ├── auth.middleware.js
        │   │   └── rbac.middleware.js
        │   ├── models/
        │   │   ├── customer.model.js
        │   │   ├── discount.model.js
        │   │   ├── invoice.model.js
        │   │   ├── payment.model.js
        │   │   ├── plan.model.js
        │   │   ├── product.model.js
        │   │   └── subscription.model.js
        │   ├── routes/
        │   │   ├── auth.routes.js
        │   │   ├── discount.routes.js
        │   │   ├── invoice.routes.js
        │   │   ├── product.routes.js
        │   │   ├── quote.routes.js
        │   │   ├── reporting.routes.js
        │   │   └── subscription.routes.js
        │   └── services/
        │       ├── billingScheduler.js
        │       ├── discountEngine.js
        │       └── taxCalculator.js
        └── tests/
            ├── billing.test.js
            └── discount.test.js
```

---

##  How to Run Locally

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

##  Demo Personas & Credentials

The database comes pre-seeded with 3 roles ready for testing:

| Role               | Email                  | Password       | Access Privileges                                                                               |
| :----------------- | :--------------------- | :------------- | :---------------------------------------------------------------------------------------------- |
| **System Admin**   | `admin@brightloop.com` | `AdminPass1!`  | Full platform control, products, variants, plans, discounts, staff provisioning, and finance    |
| **Internal Staff** | `staff@brightloop.com` | `SecurePass1!` | Day-to-day operations: quotes, subscriptions, billing day invoice generation, payment recording |
| **Customer**       | `customer@example.com` | `SecurePass1!` | Self-service portal: view active subscriptions, pause/resume, view and print invoice receipts   |

_(Quick demo buttons are also provided directly on the Login screen for instant 1-click testing)_

---

##  How "A Month at Brightloop" is Solved

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
