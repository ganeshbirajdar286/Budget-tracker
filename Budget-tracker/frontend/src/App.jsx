import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashBoard from './pages/dashBoard';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AccountHolderPage from "./pages/AccountHolder"; // 👈 we'll create this
import TransactionPage from "./pages/TransactionPage";
import AnalyticsPage from './pages/AnalyticsPage';
import BudgetPage from './pages/BudgetPage';
import TrendsPage from './pages/TrendPage';
import CurrenciesPage from './pages/CurrenciesPage';
import SubscriptionsPage from './pages/Subscription';
import ReportsPage from './pages/Report';
import NotificationsPage from './pages/NotificationsPage';
import { Toaster } from 'react-hot-toast';
import SettingsPage from './pages/SettingPage';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
          <><Toaster position="top-right" /><Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<DashBoard />} />
      {/* Update the account holder route */}
      <Route path="/profile" element={
        <ErrorBoundary>
          <AccountHolderPage />
        </ErrorBoundary>
      } />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/transactions" element={<TransactionPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/app/account" element={<AccountHolderPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/budgets" element={<BudgetPage />} />
      <Route path="/trends" element={<TrendsPage />} />
      <Route path="/currencies" element={<CurrenciesPage />} />
      <Route path="/subscriptions" element={<SubscriptionsPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes></>

  )
}

export default App;
