import React, { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "../../context/AuthContext";
import { subscribeUser } from "../../utils/push-notifications";
import "../../styles/AdminModern.css";

const AdminLayout = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Subscribe user to push notifications once they are authenticated.
    // This will run once per login session.
    if (isAuthenticated) {
      subscribeUser();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Handles initial redirect logic
    if (
      user &&
      (location.pathname === "/admin" || location.pathname === "/admin/")
    ) {
      if (user.role === "superadmin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (user.role === "staff") {
        if (user.dashboardRoutes && user.dashboardRoutes.length > 0) {
          navigate(user.dashboardRoutes[0], { replace: true });
        } else {
          navigate("/admin/my-dashboard", { replace: true });
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
