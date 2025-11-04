import React from "react";
import { NavLink } from "react-router-dom";
import {
  HouseDoorFill,
  PeopleFill,
  Building,
  BoxArrowLeft,
  JournalCheck,
  JournalRichtext,
  Calculator,
  BriefcaseFill,
  ClipboardDataFill,
  GearFill,
  PersonCircle,
  ChatDotsFill, // Import the new icon
} from "react-bootstrap-icons";
import { Nav } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const { user } = useAuth();

  const navLinksConfig = {
    superadmin: [
      {
        path: "/admin/dashboard",
        icon: <HouseDoorFill />,
        label: "Dashboard",
        end: true,
      },
      { path: "/admin/departments", icon: <Building />, label: "Departments" },
      { path: "/admin/staff", icon: <PeopleFill />, label: "Manage Staff" },
      {
        path: "/admin/activity-feed",
        icon: <ClipboardDataFill />,
        label: "Activity Feed",
      },
    ],
    "Admission Department": [
      {
        path: "/admin/admissions",
        icon: <JournalCheck />,
        label: "Admissions Overview",
        end: true,
      },
      {
        path: "/admin/admissions/leads",
        icon: <JournalRichtext />,
        label: "Manage Leads",
      },
    ],
    "Accounting Department": [
      {
        path: "/admin/accounting",
        icon: <Calculator />,
        label: "Accounting Overview",
        end: true,
      },
    ],
    "Administration Department": [
      {
        path: "/admin/administration",
        icon: <BriefcaseFill />,
        label: "Admin Overview",
        end: true,
      },
    ],
  };

  const getLinksForUser = () => {
    if (user?.role === "superadmin") {
      return navLinksConfig.superadmin;
    }

    if (user?.role === "staff" && user.departmentNames) {
      const combinedLinks = new Map();
      user.departmentNames.forEach((deptName) => {
        const linksForDept = navLinksConfig[deptName] || [];
        linksForDept.forEach((link) => {
          if (!combinedLinks.has(link.path)) {
            combinedLinks.set(link.path, link);
          }
        });
      });
      return Array.from(combinedLinks.values());
    }
    return [];
  };

  const linksToShow = getLinksForUser();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img
          src="/images/ELA-logo.png"
          alt="ELA Academy Logo"
          className="logo-img"
        />
      </div>

      <div className="sidebar-nav">
        <div className="sidebar-menu-title">Menu</div>
        <Nav className="flex-column">
          {linksToShow.map((link) => (
            <Nav.Link
              as={NavLink}
              to={link.path}
              key={link.path}
              end={!!link.end}
              className="nav-item"
            >
              {link.icon}
              <span>{link.label}</span>
            </Nav.Link>
          ))}
          {/* --- THIS IS THE NEW LINK --- */}
          {/* This link is visible to all authenticated users (Staff and Superadmin) */}
          <Nav.Link as={NavLink} to="/admin/messaging" className="nav-item">
            <ChatDotsFill />
            <span>Messaging</span>
          </Nav.Link>
        </Nav>

        <div className="sidebar-menu-title">Other</div>
        <Nav className="flex-column">
          <Nav.Link as={NavLink} to="/admin/profile" className="nav-item">
            <PersonCircle />
            <span>Profile</span>
          </Nav.Link>
          <Nav.Link as={NavLink} to="/admin/settings" className="nav-item">
            <GearFill />
            <span>Settings</span>
          </Nav.Link>
        </Nav>
      </div>

      <div className="sidebar-footer">
        <Nav className="flex-column">
          <Nav.Link as={NavLink} to="/logout" className="nav-item">
            <BoxArrowLeft />
            <span>Logout</span>
          </Nav.Link>
        </Nav>
      </div>
    </div>
  );
};

export default Sidebar;
