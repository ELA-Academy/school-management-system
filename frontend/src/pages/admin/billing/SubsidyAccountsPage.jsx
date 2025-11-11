import React, { useState, useEffect, useCallback } from "react";
import { Table, Spinner, Alert, Button, Modal, Form } from "react-bootstrap";
import PageHeader from "../../../components/admin/PageHeader";
import { getSubsidies, createSubsidy } from "../../../services/subsidyService";
import { showSuccess, showError } from "../../../utils/notificationService";

const SubsidyAccountsPage = () => {
  const [subsidies, setSubsidies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newSubsidyName, setNewSubsidyName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSubsidies();
      setSubsidies(data);
    } catch (err) {
      setError("Failed to load subsidy accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await createSubsidy({ name: newSubsidyName });
      setShowModal(false);
      setNewSubsidyName("");
      showSuccess("Subsidy account created successfully.");
      fetchData();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to create subsidy.");
    } finally {
      setIsSaving(false);
    }
  };

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
        title="Subsidy Accounts"
        buttonText="Create Subsidy"
        onButtonClick={() => setShowModal(true)}
      />
      <div className="content-card">
        <Table responsive className="modern-table">
          <thead>
            <tr>
              <th>Subsidy Name</th>
              <th>Invoiced</th>
              <th>Received</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {subsidies.map((sub) => (
              <tr key={sub.id}>
                <td>
                  <strong>{sub.name}</strong>
                </td>
                <td>$0.00</td>
                <td>$0.00</td>
                <td>$0.00</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Subsidy Account</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Subsidy Name</Form.Label>
              <Form.Control
                type="text"
                value={newSubsidyName}
                onChange={(e) => setNewSubsidyName(e.target.value)}
                placeholder="e.g., Arizona ESA"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSaving}>
              {isSaving ? <Spinner as="span" size="sm" /> : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default SubsidyAccountsPage;
