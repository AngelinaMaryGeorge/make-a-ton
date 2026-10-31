import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ProtectedRoute } from './components/rbac/ProtectedRoute';

// Views
import { LoginView } from './views/auth/LoginView';
import { RegisterView } from './views/auth/RegisterView';
import { ForgotPasswordView } from './views/auth/ForgotPasswordView';

import { ProductCatalogView } from './views/admin/ProductCatalogView';
import { PlanManagementView } from './views/admin/PlanManagementView';
import { DiscountRulesView } from './views/admin/DiscountRulesView';
import { StaffManagementView } from './views/admin/StaffManagementView';

import { QuotationTemplatesView } from './views/sales/QuotationTemplatesView';
import { QuotationEditorView } from './views/sales/QuotationEditorView';

import { InvoiceListView } from './views/billing/InvoiceListView';
import { PaymentRecordingView } from './views/billing/PaymentRecordingView';

import { CustomerDashboard } from './views/customer-portal/CustomerDashboard';
import { MySubscriptionsView } from './views/customer-portal/MySubscriptionsView';
import { MyInvoicesView } from './views/customer-portal/MyInvoicesView';

import { FinanceDashboard } from './views/finance/FinanceDashboard';

// Business Views
import { BusinessDashboard } from './views/business/BusinessDashboard';
import { ClientManagementView } from './views/business/ClientManagementView';
import { ClientSubscriptionsView } from './views/business/ClientSubscriptionsView';

function AppContent() {
  const { user, isCustomer } = useAuth();
  const [currentView, setCurrentView] = useState(() => {
    if (!user) return 'login';
    if (user.role === 'customer') return 'customer-dashboard';
    if (user.role === 'staff' || user.role === 'business') return 'business-dashboard';
    return 'business-dashboard';
  });

  // Switch initial view automatically when user logs in or out
  useEffect(() => {
    if (!user) {
      if (!['login', 'register', 'forgot-password'].includes(currentView)) {
        setCurrentView('login');
      }
    } else {
      if (['login', 'register', 'forgot-password'].includes(currentView)) {
        if (user.role === 'customer') {
          setCurrentView('customer-dashboard');
        } else if (user.role === 'staff' || user.role === 'business') {
          setCurrentView('business-dashboard');
        } else {
          setCurrentView('business-dashboard');
        }
      }
    }
  }, [user]);

  const renderView = () => {
    switch (currentView) {
      // Auth Views
      case 'login':
        return <LoginView onViewChange={setCurrentView} />;
      case 'register':
        return <RegisterView onViewChange={setCurrentView} />;
      case 'forgot-password':
        return <ForgotPasswordView onViewChange={setCurrentView} />;

      // Business & Operations Views
      case 'business-dashboard':
        return (
          <ProtectedRoute allowedRoles={['admin', 'staff', 'business']}>
            <BusinessDashboard onViewChange={setCurrentView} />
          </ProtectedRoute>
        );

      case 'client-management':
        return (
          <ProtectedRoute allowedRoles={['admin', 'staff', 'business']}>
            <ClientManagementView onViewChange={setCurrentView} />
          </ProtectedRoute>
        );

      case 'client-subscriptions':
        return (
          <ProtectedRoute allowedRoles={['admin', 'staff', 'business']}>
            <ClientSubscriptionsView onViewChange={setCurrentView} />
          </ProtectedRoute>
        );

      // Finance & Overview
      case 'finance-dashboard':
        return (
          <ProtectedRoute allowedRoles={['admin', 'staff', 'business']}>
            <FinanceDashboard onViewChange={setCurrentView} />
          </ProtectedRoute>
        );

      // Admin Views
      case 'product-catalog':
        return (
          <ProtectedRoute allowedRoles={['admin']}>
            <ProductCatalogView />
          </ProtectedRoute>
        );
      case 'plan-management':
        return (
          <ProtectedRoute allowedRoles={['admin']}>
            <PlanManagementView />
          </ProtectedRoute>
        );
      case 'discount-rules':
        return (
          <ProtectedRoute allowedRoles={['admin']}>
            <DiscountRulesView />
          </ProtectedRoute>
        );
      case 'staff-management':
        return (
          <ProtectedRoute allowedRoles={['admin']}>
            <StaffManagementView />
          </ProtectedRoute>
        );

      // Sales Views
      case 'quotation-templates':
        return (
          <ProtectedRoute allowedRoles={['admin', 'staff', 'business']}>
            <QuotationTemplatesView onViewChange={setCurrentView} />
          </ProtectedRoute>
        );
      case 'quotation-editor':
        return (
          <ProtectedRoute allowedRoles={['admin', 'staff', 'business']}>
            <QuotationEditorView onViewChange={setCurrentView} />
          </ProtectedRoute>
        );

      // Billing Views
      case 'invoice-list':
        return (
          <ProtectedRoute allowedRoles={['admin', 'staff', 'business']}>
            <InvoiceListView />
          </ProtectedRoute>
        );
      case 'payment-recording':
        return (
          <ProtectedRoute allowedRoles={['admin', 'staff', 'business']}>
            <PaymentRecordingView />
          </ProtectedRoute>
        );

      // Customer Portal Views
      case 'customer-dashboard':
        return (
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'business']}>
            <CustomerDashboard onViewChange={setCurrentView} />
          </ProtectedRoute>
        );
      case 'my-subscriptions':
        return (
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'business']}>
            <MySubscriptionsView />
          </ProtectedRoute>
        );
      case 'my-invoices':
        return (
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'business']}>
            <MyInvoicesView />
          </ProtectedRoute>
        );

      default:
        return <BusinessDashboard onViewChange={setCurrentView} />;
    }
  };

  const isAuthPage = ['login', 'register', 'forgot-password'].includes(currentView);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar currentView={currentView} onViewChange={setCurrentView} />

      <div style={{ display: 'flex', flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {!isAuthPage && user && (
          <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        )}
        <main style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
