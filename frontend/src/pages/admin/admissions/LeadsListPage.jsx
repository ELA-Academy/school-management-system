import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import { ThreeDotsVertical } from "react-bootstrap-icons";
import { getAllLeads } from "../../../services/admissionsService";
import PageHeader from "../../../components/admin/PageHeader";
import "../../../styles/AdminModern.css";

// --- THIS IS THE FIX (Part 1) ---
// Create a custom toggle component for the dropdown
const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <a
    href=""
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="text-muted"
  >
    {children}
  </a>
));

const LeadsListPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const data = await getAllLeads();
        setLeads(data);
      } catch (err) {
        setError("Failed to fetch leads.");
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    return new Date(dateString)
      .toLocaleString("en-US", options)
      .replace(",", "");
  };

  if (loading) return <p>Loading leads...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <PageHeader title={`Manage Leads (${leads.length})`} />
      <div className="content-card">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Created Date</th>
              <th>Student Name(s)</th>
              <th>Parent(s)</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Expected Start</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leads.length > 0 ? (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{formatDate(lead.created_at)}</td>
                  <td>
                    <Link
                      to={`/admin/admissions/leads/${lead.secure_token}`}
                      className="text-primary fw-bold"
                    >
                      {lead.students
                        .map((s) => `${s.first_name} ${s.last_name}`)
                        .join(", ")}
                    </Link>
                  </td>
                  <td>
                    {lead.parents
                      .map((p) => `${p.first_name} ${p.last_name}`)
                      .join(", ")}
                  </td>
                  <td>
                    <span className="fw-bold">
                      {lead.payment_status || "Unpaid"}
                    </span>
                    {(!lead.payment_status ||
                      lead.payment_status === "Unpaid") && (
                      <a href="#" className="d-block text-success small">
                        Pay Now
                      </a>
                    )}
                  </td>
                  <td>
                    <span
                      className={`status-badge status-${lead.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td>{lead.expected_start_date || "-"}</td>
                  <td className="text-center">
                    {/* --- THIS IS THE FIX (Part 2) --- */}
                    {/* Use the CustomToggle in the Dropdown */}
                    <Dropdown align="end">
                      <Dropdown.Toggle as={CustomToggle}>
                        <ThreeDotsVertical size={20} />
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item
                          as={Link}
                          to={`/admin/admissions/leads/${lead.secure_token}`}
                        >
                          View Details
                        </Dropdown.Item>
                        <Dropdown.Item href="#">
                          Send Follow-up Email
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item href="#" className="text-danger">
                          Archive Lead
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-5">
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadsListPage;
