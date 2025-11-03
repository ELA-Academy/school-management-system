import React, { useState, useEffect } from "react";
import PageHeader from "../../../components/admin/PageHeader";
import TaskList from "../../../components/admin/TaskList";
import StatCard from "../../../components/admin/StatCard";
import { getAdministrationOverview } from "../../../services/administrationService";
import { getMyTasks } from "../../../services/taskService";
import { Spinner, Alert, Row } from "react-bootstrap";
import {
  PersonBadge,
  CalendarEvent,
  Building,
  Headset,
} from "react-bootstrap-icons";
import "../../../styles/AdminModern.css";

const AdministrationDashboard = () => {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [overviewData, tasksData] = await Promise.all([
          getAdministrationOverview(),
          getMyTasks(),
        ]);

        setStats(overviewData);
        setTasks(tasksData);
      } catch (err) {
        setError(
          "Failed to fetch administration data. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-50">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <PageHeader title="Administration Overview" />
      {stats && (
        <Row className="mb-4">
          <StatCard
            icon={<PersonBadge />}
            title="Staff Onboarded"
            value={stats.total_staff_onboarded}
            colorTheme="primary"
          />
          <StatCard
            icon={<CalendarEvent />}
            title="Upcoming Events"
            value={stats.upcoming_events}
            colorTheme="success"
          />
          <StatCard
            icon={<Building />}
            title="Facility Requests"
            value={stats.facility_requests}
            colorTheme="info"
          />
          <StatCard
            icon={<Headset />}
            title="Open Support Tickets"
            value={stats.open_support_tickets}
            colorTheme="warning"
          />
        </Row>
      )}
      <TaskList tasks={tasks} title="My Administration Tasks" />
    </div>
  );
};

export default AdministrationDashboard;
