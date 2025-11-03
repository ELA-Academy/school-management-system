import React from "react";
import { Form, InputGroup, Dropdown, Badge } from "react-bootstrap";
import { Search, Bell, PersonCircle, CheckCircle } from "react-bootstrap-icons";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

// Helper function for consistent, user-friendly timestamps
const timeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

const Header = () => {
  const { user, unreadCount, notifications, markAllNotificationsAsRead } =
    useAuth();
  const navigate = useNavigate();

  const displayRole = () => {
    if (user?.role === "superadmin") {
      return "Superadmin";
    }
    if (user?.departmentNames && user.departmentNames.length > 0) {
      return user.departmentNames.join(" | ");
    }
    return "Staff";
  };

  const handleLogout = () => {
    navigate("/logout");
  };

  return (
    <header className="header">
      <div className="header-search">
        <InputGroup style={{ width: "300px" }}>
          <InputGroup.Text>
            <Search size={16} />
          </InputGroup.Text>
          <Form.Control placeholder="Search..." className="border-start-0" />
        </InputGroup>
      </div>
      <div className="header-user-section">
        {/* --- REDESIGNED NOTIFICATION DROPDOWN --- */}
        <Dropdown align="end">
          <Dropdown.Toggle as="a" className="profile-toggle position-relative">
            <Bell size={22} className="header-icon" />
            {unreadCount > 0 && (
              <Badge pill bg="danger" className="notification-badge">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Dropdown.Toggle>

          <Dropdown.Menu className="notification-dropdown">
            <div className="notification-header">
              <strong>Notifications</strong>
            </div>
            <div className="notification-list">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <Dropdown.Item
                    as={Link}
                    to={notif.target_link || "#"}
                    key={notif.id}
                    className="notification-item"
                  >
                    <div className="unread-dot"></div>
                    <div className="notification-content">
                      <p className="notification-message">{notif.message}</p>
                      <small className="notification-time">
                        {timeAgo(notif.created_at)}
                      </small>
                    </div>
                  </Dropdown.Item>
                ))
              ) : (
                <div className="no-notifications">
                  <CheckCircle size={32} />
                  <p className="mt-2 mb-0">You're all caught up!</p>
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <Dropdown.Item
                as="button"
                className="notification-footer"
                onClick={markAllNotificationsAsRead}
              >
                Mark all as read
              </Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown>
        {/* --- END REDESIGN --- */}

        <div className="user-profile">
          <span className="user-name">{user?.name || "Admin"}</span>
          <span className="user-role">{displayRole()}</span>
        </div>

        <Dropdown align="end">
          <Dropdown.Toggle as="a" className="profile-toggle">
            <PersonCircle size={32} />
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.ItemText>
              <div className="fw-bold">{user?.name}</div>
              <div className="text-muted small">{user?.email}</div>
            </Dropdown.ItemText>
            <Dropdown.Divider />
            <Dropdown.Item href="#">Profile</Dropdown.Item>
            <Dropdown.Item href="#">Settings</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </header>
  );
};

export default Header;
