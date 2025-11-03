import React, { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "../../context/AuthContext";
import "../../styles/AdminModern.css";

const AdminLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // This effect runs when the user first logs in and lands at "/admin"
    if (
      user &&
      (location.pathname === "/admin" || location.pathname === "/admin/")
    ) {
      if (user.role === "superadmin") {
        // Superadmins always go to the main dashboard
        navigate("/admin/dashboard", { replace: true });
      } else if (user.role === "staff") {
        // Staff members are redirected based on their department's route
        if (user.dashboardRoutes && user.dashboardRoutes.length > 0) {
          // If a specific route exists (e.g., /admin/admissions), go there
          navigate(user.dashboardRoutes[0], { replace: true });
        } else {
          // --- THIS IS THE FIX ---
          // If no specific route is set for their department, send them to the
          // generic "My Dashboard" page instead of the superadmin's page.
          navigate("/admin/my-dashboard", { replace: true });
          // --- END OF FIX ---
        }
      }
    }
  }, [user, navigate, location.pathname]);

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
