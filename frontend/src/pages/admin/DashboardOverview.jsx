import React, { useState, useEffect } from "react";
import { Row, Col, Card, Spinner, Alert, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  PeopleFill,
  MortarboardFill,
  Building,
  JournalRichtext,
  ClockHistory,
  PersonCheckFill,
} from "react-bootstrap-icons";
import api from "../../utils/api";
import PageHeader from "../../components/admin/PageHeader";
import StatCard from "../../components/admin/StatCard"; // Import the reusable component

// Helper to format time ago
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

const DashboardOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/dashboard/overview");
        setData(response.data);
      } catch (err) {
        setError("Failed to fetch dashboard data. Please try again later.");
        console.error("Dashboard fetch error:", err);
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

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <PageHeader title="Dashboard Overview" />
      {data && (
        <>
          <Row>
            <StatCard
              icon={<PeopleFill />}
              title="Total Staff"
              value={data.total_staff}
              colorTheme="primary"
            />
            <StatCard
              icon={<Building />}
              title="Total Departments"
              value={data.total_departments}
              colorTheme="info"
            />
            <StatCard
              icon={<JournalRichtext />}
              title="Total Leads"
              value={data.total_leads}
              colorTheme="success"
            />
            <StatCard
              icon={<MortarboardFill />}
              title="Enrolled Students"
              value={data.total_students}
              colorTheme="warning"
            />
          </Row>

          <Row>
            {/* Recent Activity Widget */}
            <Col lg={6} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <ClockHistory className="me-2" /> Recent Activity
                  </h5>
                  <Button
                    as={Link}
                    to="/admin/activity-feed"
                    variant="outline-primary"
                    size="sm"
                  >
                    View All
                  </Button>
                </Card.Header>
                <Card.Body>
                  <ul className="list-unstyled">
                    {data.recent_activities?.map((act) => (
                      <li key={act.id} className="mb-3 d-flex">
                        <PersonCheckFill
                          size={20}
                          className="text-success me-3 mt-1"
                        />
                        <div>
                          <strong>{act.actor_name}</strong> {act.action}
                          {act.target_name && (
                            <span className="text-muted">
                              {" "}
                              on {act.target_name}
                            </span>
                          )}
                          <div className="small text-muted">
                            {timeAgo(act.created_at)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>
            </Col>

            {/* New Leads Widget */}
            <Col lg={6} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header>
                  <h5 className="mb-0">
                    <JournalRichtext className="me-2" /> New Leads
                  </h5>
                </Card.Header>
                <Card.Body>
                  <ul className="list-unstyled">
                    {data.recent_leads?.map((lead) => (
                      <li
                        key={lead.id}
                        className="mb-3 d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <strong>
                            {lead.students[0]?.first_name}{" "}
                            {lead.students[0]?.last_name}
                          </strong>
                          <div className="small text-muted">
                            Status: {lead.status}
                          </div>
                        </div>
                        <Button
                          as={Link}
                          to={`/admin/admissions/leads/${lead.secure_token}`}
                          variant="secondary"
                          size="sm"
                        >
                          View
                        </Button>
                      </li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default DashboardOverview;
