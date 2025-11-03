import React, { useState, useEffect } from "react";
import PageHeader from "../../../components/admin/PageHeader";
import TaskList from "../../../components/admin/TaskList";
import StatCard from "../../../components/admin/StatCard";
import { getMyTasks } from "../../../services/taskService";
import { useAuth } from "../../../context/AuthContext";
import { Spinner, Alert, Row } from "react-bootstrap";
import { ListTask } from "react-bootstrap-icons";
import "../../../styles/AdminModern.css";

const GenericDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const departmentName = user?.departmentNames?.[0] || "Department";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const tasksData = await getMyTasks();
        setTasks(tasksData);
      } catch (err) {
        setError("Failed to fetch dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <PageHeader title={`${departmentName} Overview`} />

      <Row className="mb-4">
        <StatCard
          icon={<ListTask />}
          title="My Active Tasks"
          value={tasks.filter((t) => t.status !== "Completed").length}
          colorTheme="primary"
        />
        {/* You can add more generic stat cards here in the future */}
      </Row>

      <TaskList tasks={tasks} title={`My ${departmentName} Tasks`} />
    </div>
  );
};

export default GenericDashboard;
