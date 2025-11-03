import React, { useState, useEffect } from "react";
import PageHeader from "../../../components/admin/PageHeader";
import TaskList from "../../../components/admin/TaskList";
import StatCard from "../../../components/admin/StatCard";
import { getAccountingOverview } from "../../../services/accountingService";
import { getMyTasks } from "../../../services/taskService";
import { Spinner, Alert, Row } from "react-bootstrap";
import {
  CashCoin,
  FileEarmarkText,
  ClockHistory,
  GraphDownArrow,
} from "react-bootstrap-icons";
import "../../../styles/AdminModern.css";

const AccountingDashboard = () => {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAccountingData = async () => {
      try {
        setLoading(true);
        setError("");
        const [overviewData, tasksData] = await Promise.all([
          getAccountingOverview(),
          getMyTasks(),
        ]);

        setStats(overviewData);
        setTasks(tasksData);
      } catch (err) {
        setError("Failed to fetch accounting data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchAccountingData();
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
      <PageHeader title="Accounting Overview" />
      {stats && (
        <Row className="mb-4">
          <StatCard
            icon={<CashCoin />}
            title="Total Revenue"
            value={`$${stats.total_revenue}`}
            colorTheme="success"
          />
          <StatCard
            icon={<FileEarmarkText />}
            title="Pending Invoices"
            value={stats.pending_invoices}
            colorTheme="info"
          />
          <StatCard
            icon={<ClockHistory />}
            title="Overdue Payments"
            value={stats.overdue_payments}
            colorTheme="warning"
          />
          <StatCard
            icon={<GraphDownArrow />}
            title="Total Expenses"
            value={`$${stats.total_expenses}`}
            colorTheme="primary"
          />
        </Row>
      )}
      <TaskList tasks={tasks} title="My Accounting Tasks" />
    </div>
  );
};

export default AccountingDashboard;
