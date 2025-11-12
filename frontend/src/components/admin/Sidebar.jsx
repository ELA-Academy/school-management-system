import React, { useState } from "react";
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
  ChatDotsFill,
  PencilSquare,
  ClipboardCheck,
  Bank,
  MortarboardFill,
  ArrowRepeat,
  Award,
  ChevronRight,
} from "react-bootstrap-icons";
import { Nav, Badge } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import "../../styles/Sidebar.css";

const Sidebar = () => {
  const { user, unreadTasks, unreadMessages } = useAuth();
  const [openSections, setOpenSections] = useState({
    mySchool: true,
    departments: true,
    tools: true,
    other: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const NavItem = ({ to, icon, label, badgeCount, end = false }) => (
    <Nav.Link as={NavLink} to={to} end={end} className="nav-item">
      {icon}
      <span>{label}</span>
      {badgeCount > 0 && (
        <Badge pill bg="danger" className="sidebar-badge">
          {badgeCount}
        </Badge>
      )}
    </Nav.Link>
  );

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
      { path: "/admin/billing", icon: <Bank />, label: "Billing Ledger" },
      {
        path: "/admin/billing/recurring-plans",
        icon: <ArrowRepeat />,
        label: "Recurring Plans",
      },
      {
        path: "/admin/billing/subsidies",
        icon: <Award />,
        label: "Subsidy Accounts",
      },
      {
        path: "/admin/enrollment",
        icon: <PencilSquare />,
        label: "Enrollment",
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
    if (user?.role === "superadmin") return navLinksConfig.superadmin;
    if (user?.role === "staff" && user.departmentNames) {
      const combinedLinks = new Map();
      user.departmentNames.forEach((deptName) => {
        const linksForDept = navLinksConfig[deptName] || [];
        linksForDept.forEach((link) => {
          if (!combinedLinks.has(link.path)) combinedLinks.set(link.path, link);
        });
      });
      return Array.from(combinedLinks.values());
    }
    return [];
  };

  const departmentLinks = getLinksForUser();

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
        {/* My School Section */}
        <div
          className="sidebar-menu-toggle"
          onClick={() => toggleSection("mySchool")}
          aria-expanded={openSections.mySchool}
        >
          My School <ChevronRight className="toggle-icon" />
        </div>
        <Nav
          className={`flex-column sidebar-submenu ${
            openSections.mySchool ? "show" : ""
          }`}
        >
          <NavItem
            to="/admin/students"
            icon={<MortarboardFill />}
            label="Students"
          />
        </Nav>

        {/* Department-Specific Links */}
        {departmentLinks.length > 0 && (
          <>
            <div
              className="sidebar-menu-toggle"
              onClick={() => toggleSection("departments")}
              aria-expanded={openSections.departments}
            >
              Departments <ChevronRight className="toggle-icon" />
            </div>
            <Nav
              className={`flex-column sidebar-submenu ${
                openSections.departments ? "show" : ""
              }`}
            >
              {departmentLinks.map((link) => (
                <NavItem
                  to={link.path}
                  key={link.path}
                  icon={link.icon}
                  label={link.label}
                  end={!!link.end}
                />
              ))}
            </Nav>
          </>
        )}

        {/* Tools Section */}
        <div
          className="sidebar-menu-toggle"
          onClick={() => toggleSection("tools")}
          aria-expanded={openSections.tools}
        >
          Tools <ChevronRight className="toggle-icon" />
        </div>
        <Nav
          className={`flex-column sidebar-submenu ${
            openSections.tools ? "show" : ""
          }`}
        >
          {user?.role === "staff" && (
            <NavItem
              to="/admin/tasks"
              icon={<ClipboardCheck />}
              label="My Tasks"
              badgeCount={unreadTasks}
            />
          )}
          <NavItem
            to="/admin/messaging"
            icon={<ChatDotsFill />}
            label="Messaging"
            badgeCount={unreadMessages}
          />
        </Nav>

        {/* General Settings Section */}
        <div
          className="sidebar-menu-toggle"
          onClick={() => toggleSection("other")}
          aria-expanded={openSections.other}
        >
          Other <ChevronRight className="toggle-icon" />
        </div>
        <Nav
          className={`flex-column sidebar-submenu ${
            openSections.other ? "show" : ""
          }`}
        >
          <NavItem
            to="/admin/profile"
            icon={<PersonCircle />}
            label="Profile"
          />
          <NavItem to="/admin/settings" icon={<GearFill />} label="Settings" />
        </Nav>
      </div>

      <div className="sidebar-footer">
        <NavItem to="/logout" icon={<BoxArrowLeft />} label="Logout" />
      </div>
    </div>
  );
};

export default Sidebar;
