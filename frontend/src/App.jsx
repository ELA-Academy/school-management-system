import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./context/AuthContext";

// --- Import All Components ---
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import SuperAdminSetup from "./pages/SuperAdminSetup";
import AdminLayout from "./components/admin/AdminLayout";
import DashboardOverview from "./pages/admin/DashboardOverview";
import ManageDepartments from "./pages/admin/ManageDepartments";
import ManageStaff from "./pages/admin/ManageStaff";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminRoute from "./components/SuperAdminRoute"; // Import the new guard
import Logout from "./components/Logout";
import AdmissionForm from "./pages/public/AdmissionForm";
import AdmissionsDashboard from "./pages/admin/admissions/AdmissionsDashboard";
import LeadsListPage from "./pages/admin/admissions/LeadsListPage";
import LeadDetailPage from "./pages/admin/admissions/LeadDetailPage";
import AccountingDashboard from "./pages/admin/accounting/AccountingDashboard";
import AdministrationDashboard from "./pages/admin/administration/AdministrationDashboard";
import GenericDashboard from "./pages/admin/department/GenericDashboard";
import ActivityFeedPage from "./pages/admin/ActivityFeedPage";
import ProfilePage from "./pages/admin/ProfilePage";
import MessagingPage from "./pages/admin/MessagingPage";

function App() {
  return (
    <AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/superadmin" element={<SuperAdminSetup />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/admissions/apply" element={<AdmissionForm />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />

              {/* --- APPLYING THE SUPER ADMIN GUARD --- */}
              <Route element={<SuperAdminRoute />}>
                <Route path="dashboard" element={<DashboardOverview />} />
                <Route path="departments" element={<ManageDepartments />} />
                <Route path="staff" element={<ManageStaff />} />
                <Route path="activity-feed" element={<ActivityFeedPage />} />
              </Route>
              {/* --- END OF GUARD APPLICATION --- */}

              {/* Shared Routes (accessible by all logged-in users) */}
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<ProfilePage />} />
              <Route path="messaging" element={<MessagingPage />} />

              {/* Staff & Department Routes */}
              <Route path="admissions" element={<AdmissionsDashboard />} />
              <Route path="admissions/leads" element={<LeadsListPage />} />
              <Route
                path="admissions/leads/:token"
                element={<LeadDetailPage />}
              />
              <Route path="accounting" element={<AccountingDashboard />} />
              <Route
                path="administration"
                element={<AdministrationDashboard />}
              />
              <Route path="my-dashboard" element={<GenericDashboard />} />

              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
