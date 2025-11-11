import React, { useState, useEffect, useCallback } from "react";
import { Tabs, Tab, Button, Table, Spinner, Alert } from "react-bootstrap";
import PageHeader from "../../../components/admin/PageHeader";
import CreatePlanWizard from "../../../components/admin/billing/CreatePlanWizard";
import {
  getSubscriptions,
  getBillingPlans,
} from "../../../services/billingService";

const RecurringPlansPage = () => {
  const [activePlans, setActivePlans] = useState([]);
  const [planTemplates, setPlanTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showWizard, setShowWizard] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [subs, plans] = await Promise.all([
        getSubscriptions(),
        getBillingPlans(),
      ]);
      setActivePlans(subs);
      setPlanTemplates(plans);
    } catch (err) {
      setError("Failed to load recurring plan data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePlanCreated = () => {
    setShowWizard(false);
    fetchData(); // Refresh data after a new plan is created
  };

  const formatCurrency = (amount) =>
    amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

  if (loading)
    return (
      <div className="text-center p-5">
        <Spinner />
      </div>
    );
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <>
      <PageHeader
        title="Recurring Plans"
        buttonText="Create Recurring Plan"
        onButtonClick={() => setShowWizard(true)}
      />
      <Tabs defaultActiveKey="active" id="recurring-plans-tabs">
        <Tab eventKey="active" title={`Active Plans (${activePlans.length})`}>
          <div className="content-card mt-3">
            <Table responsive className="modern-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Plan Name</th>
                  <th>Plan Period</th>
                  <th>Next Invoice Date</th>
                  <th className="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                {activePlans.map((plan) => (
                  <tr key={plan.id}>
                    <td>
                      <strong>{plan.student_name}</strong>
                    </td>
                    <td>{plan.plan_name}</td>
                    <td>
                      {new Date(plan.start_date).toLocaleDateString()} -{" "}
                      {plan.end_date
                        ? new Date(plan.end_date).toLocaleDateString()
                        : "Ongoing"}
                    </td>
                    <td>
                      {new Date(plan.next_invoice_date).toLocaleDateString()}
                    </td>
                    <td className="text-end">
                      {formatCurrency(plan.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Tab>
        <Tab
          eventKey="templates"
          title={`Plan Templates (${planTemplates.length})`}
        >
          <div className="content-card mt-3">
            <Table responsive className="modern-table">
              <thead>
                <tr>
                  <th>Template Name</th>
                  <th>Default Items</th>
                </tr>
              </thead>
              <tbody>
                {planTemplates.map((template) => (
                  <tr key={template.id}>
                    <td>
                      <strong>{template.name}</strong>
                    </td>
                    <td>{template.items_json.length} items</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Tab>
      </Tabs>

      <CreatePlanWizard
        show={showWizard}
        handleClose={() => setShowWizard(false)}
        onPlanCreated={handlePlanCreated}
      />
    </>
  );
};

export default RecurringPlansPage;
