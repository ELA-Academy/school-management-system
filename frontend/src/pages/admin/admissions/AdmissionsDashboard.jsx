import React, { useState, useEffect } from "react";
import PageHeader from "../../../components/admin/PageHeader";
import TaskList from "../../../components/admin/TaskList";
import StatCard from "../../../components/admin/StatCard";
import { getAllLeads } from "../../../services/admissionsService";
import { getMyTasks } from "../../../services/taskService";
import { Spinner, Alert, Row } from "react-bootstrap";
import {
  JournalRichtext,
  PersonPlusFill,
  ArrowRepeat,
  PersonCheckFill,
} from "react-bootstrap-icons";

const AdmissionsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [leadsData, tasksData] = await Promise.all([
          getAllLeads(),
          getMyTasks(),
        ]);

        const total = leadsData.length;
        const waitlisted = leadsData.filter(
          (l) => l.status === "Waitlisted"
        ).length;
        const inProgress = leadsData.filter(
          (l) =>
            l.status === "Interested" ||
            l.status === "Toured" ||
            l.status === "Admitted"
        ).length;
        const enrolled = leadsData.filter(
          (l) => l.status === "Enrolled"
        ).length;

        setStats({ total, waitlisted, inProgress, enrolled });
        setTasks(tasksData);
      } catch (err) {
        setError(
          "Failed to fetch dashboard data. Please check the API server and try again."
        );
        console.error("Admissions dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh" }}
      >
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <PageHeader title="Admissions Overview" />

      {stats && (
        <Row className="mb-4">
          <StatCard
            icon={<JournalRichtext />}
            title="Total Leads"
            value={stats.total}
            colorTheme="primary"
          />
          <StatCard
            icon={<PersonPlusFill />}
            title="New Leads (Waitlisted)"
            value={stats.waitlisted}
            colorTheme="info"
          />
          <StatCard
            icon={<ArrowRepeat />}
            title="In Progress"
            value={stats.inProgress}
            colorTheme="warning"
          />
          <StatCard
            icon={<PersonCheckFill />}
            title="Enrolled"
            value={stats.enrolled}
            colorTheme="success"
          />
        </Row>
      )}

      <TaskList tasks={tasks} title="My Admissions Tasks" />
    </div>
  );
};

export default AdmissionsDashboard;
