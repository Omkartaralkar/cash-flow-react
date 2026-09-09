import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ThemeProvider } from "./hooks/useTheme";
import { ToastProvider } from "./hooks/useToast";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import AddIncome from "./pages/AddIncome";
import AddExpense from "./pages/AddExpense";
import Given from "./pages/Given";
import Returned from "./pages/Returned";
import People from "./pages/People";
import PersonDetail from "./pages/PersonDetail";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function AuthGate({ children }) {
  // Small wrapper so /login and /signup redirect an already
  // signed-in user straight to the dashboard.
  const { user, checking } = useAuth();
  if (checking) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route
                path="/login"
                element={
                  <AuthGate>
                    <Login />
                  </AuthGate>
                }
              />
              <Route
                path="/signup"
                element={
                  <AuthGate>
                    <Signup />
                  </AuthGate>
                }
              />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="income" element={<AddIncome />} />
                <Route path="expense" element={<AddExpense />} />
                <Route path="given" element={<Given />} />
                <Route path="returned" element={<Returned />} />
                <Route path="people" element={<People />} />
                <Route path="people/:name" element={<PersonDetail />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
