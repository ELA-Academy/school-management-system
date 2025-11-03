import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { jwtDecode } from "jwt-decode";
import api from "../utils/api";
import {
  getNotifications,
  markAllAsRead,
} from "../services/notificationService";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- NOTIFICATION STATE ---
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.length;

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to poll notifications.");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllNotificationsAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications([]); // Immediately clear notifications from UI
    } catch (error) {
      console.error("Failed to mark notifications as read.");
    }
  };
  // --- END NOTIFICATION STATE ---

  const loadUserFromToken = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser({
            email: decoded.sub,
            name: decoded.name,
            role: decoded.role,
            departmentNames: decoded.departmentNames || [],
            dashboardRoutes: decoded.dashboardRoutes || [],
          });
          setIsAuthenticated(true);
        } else {
          logout();
        }
      } catch (error) {
        console.error("Invalid token:", error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUserFromToken();
  }, [loadUserFromToken]);

  // Fetch initial notifications after user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  const loginUser = async (loginFunction, credentials) => {
    const response = await loginFunction(credentials);
    const { access_token } = response.data;
    localStorage.setItem("authToken", access_token);
    await loadUserFromToken();
  };

  const staffLogin = async (email, password) => {
    return loginUser((creds) => api.post("/auth/login", creds), {
      email,
      password,
    });
  };

  const superAdminLogin = async (email, password) => {
    return loginUser((creds) => api.post("/superadmin/login", creds), {
      email,
      password,
    });
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    setIsAuthenticated(false);
    setNotifications([]); // Clear notifications on logout
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    staffLogin,
    superAdminLogin,
    logout,
    // --- EXPOSE NOTIFICATION VALUES ---
    notifications,
    unreadCount,
    markAllNotificationsAsRead,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
