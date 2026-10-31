#﻿Subscription Management System

A unified subscription management platform for Brightloop Software,
developed for the Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026.

The application is designed to manage the subscription business
lifecycle in one place --- from product and plan configuration to
quotations, recurring billing, invoices, payments, and revenue
reporting.

Project status: Hackathon development. Features and setup
instructions should be updated as implementation progresses.

Table of Contents

Overview

Core Features

Technology Stack

System Architecture

Team Responsibilities

Subscription Lifecycle

Billing Workflow

Getting Started

API Overview

Git Workflow

Security and Validation

Performance Goals

Future Improvements

Overview

Brightloop Software offers products and services through monthly and
yearly subscriptions, add-ons, and product variants. Managing customers,
renewals, invoices, and payments manually can lead to missed renewals,
incorrect invoices, and poor visibility into recurring revenue.

This project aims to provide a centralized platform for:

Managing products, variants, plans, and pricing.

Registering customers and managing staff access.

Creating quotations and converting them into subscriptions.

Tracking subscription status, renewals, pauses, and closures.

Generating invoices for subscriptions when billing is due.

Applying configurable taxes and discounts.

Recording payments against invoices.

Viewing revenue, active subscriptions, and outstanding invoices.

Core Features

1. Authentication and Role-Based Access

The system is planned to support three roles:

Role                                Access

Admin                               Full system access, configuration,
staff management, and reporting

Staff                               Day-to-day customer, quotation,
subscription, invoice, and payment
operations according to assigned
permissions

Authentication requirements:

Unique email address for each account.

Password longer than eight characters.

Password must contain an uppercase letter, a lowercase letter, and a
special character.

Password reset through the registered email address.

Only admins can create staff accounts.

2. Product and Variant Management

Create and manage products.

Store product name, type, sales price, cost price, and notes.

Configure product variants.

Support additional pricing for selected variants.

3. Subscription Plan Management

Create plans with daily, weekly, monthly, or yearly billing
intervals.

Configure plan price and minimum quantity.

Set plan availability dates.

Configure whether a plan closes automatically at its end date.

Support permitted pause, early closure, and renewal operations.

4. Quotations and Subscriptions

Create quotations using reusable quotation templates.

Configure quotation validity.

Convert quotations into subscriptions.

Track subscription number, customer, plan, dates, payment terms,
products, quantities, unit prices, taxes, and line totals.

Track the subscription lifecycle.

5. Recurring Billing and Invoices

Identify subscriptions due for billing.

Generate invoices from subscription details.

Calculate applicable taxes and discounts.

Support invoice confirmation, cancellation, sending, and printing.

Prevent duplicate invoice generation for the same billing period.

Track invoice status: Draft, Confirmed, and Paid.

6. Tax and Discount Management

Configure tax rules.

Support fixed-amount and percentage discounts.

Configure minimum purchase or quantity requirements.

Set discount start and end dates.

Configure usage limits.

Apply eligible discounts automatically to the relevant invoice.

7. Payment Management

Record payment method, amount, date, and notes.

Associate payments with the correct invoice.

Track paid and outstanding invoices.

Identify overdue invoices.

8. Dashboard and Finance Reporting

The dashboard is intended to provide a summary of:

Active subscriptions.

Revenue collected.

Outstanding payments.

Overdue invoices.

Subscription and payment information with filters.

Technology Stack

The following stack is the proposed implementation baseline. Update this
section if the team adopts different technologies.

Layer             Technology

Frontend          React with Vite
Styling           Tailwind CSS
Backend API       Python with FastAPI
Database          SQLite for the hackathon prototype
Authentication    JWT-based authentication
Charts            Recharts
Version Control   Git and GitHub

System Architecture

The application is organized into three main areas:

                 ┌──────────────────────────┐
                 │       React Frontend     │
                 │                          │
                 │ Admin | Staff | Customer │
                 └────────────┬─────────────┘
                              │ REST API
                              ▼
                 ┌──────────────────────────┐
                 │       FastAPI Backend    │
                 │                          │
                 │ Auth and RBAC            │
                 │ Products and Plans       │
                 │ Subscriptions            │
                 │ Taxes and Discounts      │
                 │ Invoices and Payments    │
                 │ Reports                  │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │        Database         │
                 │                          │
                 │ Users, Products, Plans   │
                 │ Subscriptions, Invoices  │
                 │ Payments, Discounts      │
                 └──────────────────────────┘

                 Background Billing Scheduler
                              │
                              ▼
                 Checks due subscriptions
                 and triggers invoice creation

Suggested Repository Structure

subscription-management-system/
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── products.py
│   │   │   ├── plans.py
│   │   │   ├── quotations.py
│   │   │   ├── subscriptions.py
│   │   │   ├── invoices.py
│   │   │   ├── payments.py
│   │   │   └── reports.py
│   │   ├── services/
│   │   ├── models/
│   │   ├── database.py
│   │   └── main.py
│   └── requirements.txt
│
├── business_logic/
│   ├── products/
│   ├── pricing/
│   ├── taxes/
│   ├── discounts/
│   └── quotations/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── admin/
│   │   ├── staff/
│   │   ├── customer/
│   │   └── services/
│   └── package.json
│
├── docs/
├── .gitignore
└── README.md

The exact folder structure may change as implementation progresses.
Coordinate shared modules with the relevant owner before moving or
renaming files.

Team Responsibilities

The project is divided into three engineering workstreams.

Person 1 --- Backend and Database Engineer

Primary ownership: Backend infrastructure and data management.

Responsibilities:

Database architecture, schema, and relationships.

Authentication, password hashing, and password reset.

Role-based access control enforcement.

REST API endpoints.

Subscription lifecycle API and data handling.

Recurring billing scheduler or cron jobs.

Invoice generation and payment recording.

Backend integration and API testing.

Main deliverables:

Database and backend application.

Authentication and authorization.

API endpoints.

Recurring billing process.

Invoice and payment APIs.

Person 2 --- Business Logic and Pricing Specialist

Primary ownership: Product configuration and business rules.

Responsibilities:

Product and variant configuration.

Subscription plan configuration.

Variant-based price adjustments.

Tax rules and calculations.

Fixed and percentage discount engine.

Discount eligibility and usage limits.

Quotation templates and validity.

Quotation-to-subscription workflow.

Renewal, pause, and closure rules.

Main deliverables:

Product and plan logic.

Pricing calculations.

Tax and discount logic.

Quotation workflow.

Subscription business rules.

Person 3 --- Frontend and Portal Engineer

Primary ownership: User interface and user experience.

Responsibilities:

Login and registration pages.

Admin dashboard.

Staff interface.

Customer self-service portal.

Role-based navigation and views.

Product and plan management screens.

Subscription and quotation screens.

Invoice and payment screens.

Finance reporting and filters.

Responsive design and performance optimization.

Main deliverables:

Responsive frontend.

Admin and staff interfaces.

Customer portal.

Finance dashboard and reports.

Integration Ownership

Area                             Primary owner     Collaborates with

Authentication and database      Person 1          Person 3
Products and plans               Person 2          Persons 1 and 3
Taxes and discounts              Person 2          Person 1
Quotations                       Person 2          Persons 1 and 3
Subscription lifecycle           Persons 1 and 2   Person 3
Recurring billing and invoices   Person 1          Person 2
Payments                         Person 1          Person 3
Dashboard and portal             Person 3          Person 1

Integration rule: Agree on database fields, API request/response
formats, and status values before implementing dependent features. Keep
shared interfaces documented.

Subscription Lifecycle

The main lifecycle described in the challenge is:

DRAFT → QUOTATION → CONFIRMED → ACTIVE → CLOSED

The system should also support the applicable pause and renewal
operations.

Subscription records should include:

Unique subscription number.

Customer.

Plan.

Start date and expiry date.

Payment terms.

Subscription status.

Product lines, quantities, unit prices, taxes, and amounts.

Billing Workflow

Subscription reaches billing date
              │
              ▼
       Check eligibility
              │
              ▼
   Check for existing invoice
              │
              ▼
      Calculate line totals
              │
              ▼
       Apply discounts
              │
              ▼
        Calculate taxes
              │
              ▼
       Generate invoice
              │
              ▼
      Confirm and send invoice
              │
              ▼
        Record payment
              │
              ▼
       Update invoice status
              │
              ▼
        Refresh reports

The billing process must be safe to retry. It should use a unique
subscription-and-billing-period reference or equivalent database
constraint to prevent duplicate invoices.

Getting Started

These instructions describe the intended local development setup. They
may need adjustment to match the final repository structure.

Prerequisites

Git

Python 3.10 or later

Node.js and npm

A code editor such as Visual Studio Code

1. Clone the repository

git clone <YOUR_GITHUB_REPOSITORY_URL>
cd subscription-management-system

Replace the placeholder with the team's actual GitHub repository URL.

2. Set up the backend

cd backend

python -m venv venv

Activate the virtual environment:

Windows PowerShell

.\venv\Scripts\Activate.ps1

Linux/macOS

source venv/bin/activate

Install dependencies:

pip install -r requirements.txt

Start the FastAPI development server:

uvicorn app.main:app --reload

The API should be available at:

http://127.0.0.1:8000

If FastAPI's automatic documentation is enabled, visit:

http://127.0.0.1:8000/docs

3. Set up the frontend

Open a second terminal:

cd frontend
npm install
npm run dev

Open the local URL printed by Vite in the terminal.

4. Environment variables

Keep secrets and environment-specific settings outside source control.
Create a local .env file based on the configuration required by the
application.

Example configuration keys:

DATABASE_URL=sqlite:///./subscription.db
SECRET_KEY=replace_with_a_secure_random_secret
ACCESS_TOKEN_EXPIRE_MINUTES=30

Do not commit real secrets, passwords, tokens, or production
credentials.

API Overview

The following endpoints are proposed API contracts. They should be
updated to match the routes actually implemented.

Method                  Endpoint                           Purpose

POST                    /api/auth/register               Register a customer

POST                    /api/auth/login                  Authenticate a user

POST                    /api/auth/forgot-password        Request password reset

GET                     /api/products                    List products

POST                    /api/products                    Create a product

GET                     /api/plans                       List subscription plans

POST                    /api/plans                       Create a plan

POST                    /api/quotations                  Create a quotation

POST                    /api/subscriptions               Create a subscription

GET                     /api/subscriptions               List accessible
subscriptions

PATCH                   /api/subscriptions/{id}/status   Update subscription
status

GET                     /api/invoices                    List accessible
invoices

POST                    /api/invoices/generate           Trigger invoice
generation

POST                    /api/payments                    Record a payment

All protected endpoints must enforce authorization on the backend.
Hiding a button in the frontend is not sufficient access control.

Git Workflow

Use separate branches for each workstream:

Branch             Owner

main             Stable integrated version
backend          Person 1
business-logic   Person 2
frontend         Person 3

Suggested workflow:

git checkout -b backend
git add .
git commit -m "Add backend authentication and database"
git push -u origin backend

Repeat with the appropriate branch and commit message for each
workstream.

Before merging:

Pull the latest changes.

Resolve conflicts carefully.

Test the affected functionality.

Merge into main only when the integration is working.

Use clear, focused commit messages. Every team member should commit
their own work.

Security and Validation

The implementation should account for:

Unique customer email addresses.

Secure password hashing.

Password complexity validation.

Server-side role and ownership checks.

Customers accessing only their own records.

Admin-only staff creation and configuration actions.

Validation of quantities, dates, prices, and payment amounts.

Safe handling of expired or exhausted discounts.

Protection against duplicate billing and payment recording.

No hard-coded secrets or credentials in the repository.

Performance Goals

The challenge expects pages to respond in under two seconds,
including when handling thousands of subscriptions.

Potential implementation measures:

Database indexes on frequently filtered fields.

Pagination for large tables.

Efficient filtering and sorting at the database/API level.

Avoiding unnecessary frontend re-renders.

Limiting dashboard queries to required summary data.

Avoiding repeated API calls for the same information.

Measure performance with realistic data rather than assuming the target
has been met.

Future Improvements

Potential extensions after the core workflow is stable:

Email notifications for invoices and renewals.

Customer payment gateway integration.

Downloadable PDF invoices.

Advanced revenue and churn analytics.

Automated overdue payment reminders.

Audit logs for important administrative actions.

More advanced billing retry and failure handling.

Hackathon

Event: Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026
Problem Statement: Subscription Management System
Business Scenario: Brightloop Software

Built collaboratively by the hackathon team.

Acknowledgements

Thanks to Odoo and the Make-A-Ton 9.0 organizers for providing
the challenge and opportunity to build a practical subscription
management solution.
