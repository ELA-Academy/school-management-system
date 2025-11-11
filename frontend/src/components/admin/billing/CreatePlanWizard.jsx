import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Spinner,
  Form,
  Row,
  Col,
  ListGroup,
  InputGroup,
  Card,
} from "react-bootstrap";
import Select from "react-select";
import DatePicker from "react-datepicker";
import { v4 as uuidv4 } from "uuid";
import { Trash, Building } from "react-bootstrap-icons";
import { showSuccess, showError } from "../../../utils/notificationService";
import { getAllStudents } from "../../../services/studentService";
import {
  getBillingPlans,
  getPresetItems,
  saveBillingPlan,
  createSubscriptions,
} from "../../../services/billingService";

const CreatePlanWizard = ({ show, handleClose, onPlanCreated }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [students, setStudents] = useState([]);
  const [planTemplates, setPlanTemplates] = useState([]);
  const [presetItems, setPresetItems] = useState([]);

  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [planData, setPlanData] = useState({
    templateId: "new",
    plan_name: "",
    cycle: "Monthly",
    start_date: new Date(),
    end_date: null,
    invoice_generation_day: "1",
    due_day: "1",
    items_json: [
      { id: uuidv4(), type: "New Item", description: "", amount: "" },
    ],
  });

  useEffect(() => {
    if (show) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const [s, pt, pi] = await Promise.all([
            getAllStudents(),
            getBillingPlans(),
            getPresetItems(),
          ]);
          setStudents(s);
          setPlanTemplates(pt);
          setPresetItems(pi);
        } catch (err) {
          showError("Failed to load necessary data.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setStep(1);
      setSelectedStudentIds([]);
      setPlanData({
        templateId: "new",
        plan_name: "",
        cycle: "Monthly",
        start_date: new Date(),
        end_date: null,
        invoice_generation_day: "1",
        due_day: "1",
        items_json: [
          { id: uuidv4(), type: "New Item", description: "", amount: "" },
        ],
      });
    }
  }, [show]);

  const handleTemplateChange = (e) => {
    const selectedTemplateId = e.target.value;
    if (selectedTemplateId === "new") {
      setPlanData({
        ...planData,
        templateId: "new",
        plan_name: "",
        items_json: [
          { id: uuidv4(), type: "New Item", description: "", amount: "" },
        ],
      });
    } else {
      const template = planTemplates.find(
        (t) => t.id === parseInt(selectedTemplateId)
      );
      if (template) {
        setPlanData({
          ...planData,
          templateId: template.id,
          plan_name: template.name,
          items_json: template.items_json.map((item) => ({
            ...item,
            id: uuidv4(),
          })),
        });
      }
    }
  };

  const handleItemChange = (id, field, value) => {
    const newItems = planData.items_json.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "description" && item.type === "Preset Item") {
          const preset = presetItems.find((p) => p.description === value);
          if (preset) updatedItem.amount = preset.amount;
        }
        if (field === "type" && value === "Discount") {
          updatedItem.amount = -Math.abs(parseFloat(updatedItem.amount) || 0);
        }
        if (field === "type" && value !== "Discount") {
          updatedItem.amount = Math.abs(parseFloat(updatedItem.amount) || 0);
        }
        return updatedItem;
      }
      return item;
    });
    setPlanData({ ...planData, items_json: newItems });
  };

  const addItem = () =>
    setPlanData({
      ...planData,
      items_json: [
        ...planData.items_json,
        { id: uuidv4(), type: "New Item", description: "", amount: "" },
      ],
    });
  const removeItem = (id) =>
    setPlanData({
      ...planData,
      items_json: planData.items_json.filter((i) => i.id !== id),
    });

  const handleSaveTemplate = async () => {
    if (!planData.plan_name) {
      showError("Please enter a plan name to save it as a template.");
      return;
    }
    setIsSaving(true);
    try {
      const newTemplate = await saveBillingPlan({
        name: planData.plan_name,
        items_json: planData.items_json,
      });
      setPlanTemplates([...planTemplates, newTemplate]);
      setPlanData({ ...planData, templateId: newTemplate.id });
      showSuccess("Template saved successfully!");
    } catch (err) {
      showError("Failed to save template.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePlan = async () => {
    setIsSaving(true);
    try {
      await createSubscriptions({
        student_ids: selectedStudentIds,
        plan_data: planData,
      });
      showSuccess("Recurring plan created and assigned!");
      onPlanCreated();
    } catch (err) {
      showError("Failed to create plan.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalAmount = planData.items_json.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );
  const templateOptions = [
    { id: "new", name: "+ Create New Plan" },
    ...planTemplates,
  ];
  const presetOptions = presetItems.map((p) => p.description);
  const dayOptions = Array.from({ length: 28 }, (_, i) => i + 1).map(String);
  const formatCurrency = (amount) =>
    (amount || 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  const selectedStudents = students.filter((s) =>
    selectedStudentIds.includes(s.id)
  );

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      centered
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title>Create Recurring Plan - Step {step}/4</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ minHeight: "450px" }}>
        {loading && (
          <div className="text-center p-5">
            <Spinner />
          </div>
        )}

        {!loading && step === 1 && (
          <div className="d-flex flex-column align-items-center justify-content-center h-100">
            <h4>Which Plan do you want to create?</h4>
            <Button
              variant="primary"
              size="lg"
              className="my-2 w-50"
              onClick={() => setStep(2)}
            >
              Tuition Plan{" "}
              <small className="d-block">(plan with fixed rates)</small>
            </Button>
            <Button
              variant="outline-secondary"
              size="lg"
              className="w-50"
              disabled
            >
              Attendance Plan{" "}
              <small className="d-block">
                (dynamic rates based on sign in/out)
              </small>
            </Button>
          </div>
        )}

        {!loading && step === 2 && (
          <div>
            <h5>Select Students</h5>
            <ListGroup style={{ maxHeight: "400px", overflowY: "auto" }}>
              {students.map((s) => (
                <ListGroup.Item key={s.id}>
                  <Form.Check
                    type="checkbox"
                    id={`student-${s.id}`}
                    label={`${s.first_name} ${s.last_name}`}
                    checked={selectedStudentIds.includes(s.id)}
                    onChange={() =>
                      setSelectedStudentIds((ids) =>
                        ids.includes(s.id)
                          ? ids.filter((id) => id !== s.id)
                          : [...ids, s.id]
                      )
                    }
                  />
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {!loading && step === 3 && (
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Label>Create New or Pick Template</Form.Label>
                <Form.Select
                  value={planData.templateId}
                  onChange={handleTemplateChange}
                >
                  {templateOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label>Plan Name</Form.Label>
                <Form.Control
                  type="text"
                  value={planData.plan_name}
                  onChange={(e) =>
                    setPlanData({ ...planData, plan_name: e.target.value })
                  }
                  required
                />
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={4}>
                <Form.Label>Plan Cycle</Form.Label>
                <Form.Select
                  value={planData.cycle}
                  onChange={(e) =>
                    setPlanData({ ...planData, cycle: e.target.value })
                  }
                >
                  <option>Monthly</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label>Plan Start</Form.Label>
                <DatePicker
                  selected={planData.start_date}
                  onChange={(date) =>
                    setPlanData({ ...planData, start_date: date })
                  }
                  className="form-control"
                />
              </Col>
              <Col md={4}>
                <Form.Label>Plan End (Optional)</Form.Label>
                <DatePicker
                  selected={planData.end_date}
                  onChange={(date) =>
                    setPlanData({ ...planData, end_date: date })
                  }
                  className="form-control"
                  placeholderText="Select end date"
                />
              </Col>
            </Row>
            <Row className="mb-4 align-items-center">
              <Form.Label>Generate invoice on</Form.Label>
              <Col>
                <Form.Select
                  value={planData.invoice_generation_day}
                  onChange={(e) =>
                    setPlanData({
                      ...planData,
                      invoice_generation_day: e.target.value,
                    })
                  }
                >
                  {dayOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                      {d === "1"
                        ? "st"
                        : d === "2"
                        ? "nd"
                        : d === "3"
                        ? "rd"
                        : "th"}{" "}
                      day
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs="auto">, due on</Col>
              <Col>
                <Form.Select
                  value={planData.due_day}
                  onChange={(e) =>
                    setPlanData({ ...planData, due_day: e.target.value })
                  }
                >
                  {dayOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                      {d === "1"
                        ? "st"
                        : d === "2"
                        ? "nd"
                        : d === "3"
                        ? "rd"
                        : "th"}{" "}
                      day
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
            <hr />
            <h5 className="mt-3">Invoice Details</h5>
            {planData.items_json.map((item) => (
              <Row key={item.id} className="mb-2 align-items-center">
                <Col md={3}>
                  <Form.Select
                    value={item.type}
                    onChange={(e) =>
                      handleItemChange(item.id, "type", e.target.value)
                    }
                  >
                    <option>New Item</option>
                    <option>Preset Item</option>
                    <option>Discount</option>
                  </Form.Select>
                </Col>
                <Col>
                  {item.type === "Preset Item" ? (
                    <Form.Select
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(item.id, "description", e.target.value)
                      }
                    >
                      <option>Select a preset...</option>
                      {presetOptions.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </Form.Select>
                  ) : (
                    <Form.Control
                      type="text"
                      placeholder="Item Description"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(item.id, "description", e.target.value)
                      }
                    />
                  )}
                </Col>
                <Col xs={4} md={3}>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) =>
                        handleItemChange(item.id, "amount", e.target.value)
                      }
                    />
                  </InputGroup>
                </Col>
                <Col xs="auto">
                  <Button
                    variant="link"
                    className="text-danger"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash />
                  </Button>
                </Col>
              </Row>
            ))}
            <Button variant="link" onClick={addItem}>
              Add Invoice Item
            </Button>
            <div className="text-end fs-5">
              <strong>Total: {formatCurrency(totalAmount)}</strong>
            </div>
          </Form>
        )}

        {!loading && step === 4 && (
          <div>
            <div className="d-flex align-items-center mb-3">
              <h5 className="mb-0">Submit Plan</h5>
            </div>
            <div className="submit-plan-container">
              <div className="invoice-preview-card">
                <div className="invoice-preview-header">
                  <div className="invoice-preview-logo">
                    <Building />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0">
                      Exceptional Learning and Arts Academy
                    </h6>
                    <p className="text-muted small">
                      P.O. Box 29515, Jacksonville, FL, 32256
                    </p>
                  </div>
                </div>
                <div className="invoice-preview-billed-to">
                  Billed For
                  <br />
                  <strong>
                    {selectedStudents.length > 0
                      ? `${selectedStudents[0].first_name} ${selectedStudents[0].last_name}`
                      : "Student Name"}
                  </strong>
                </div>
                <div className="invoice-preview-details">
                  <strong>DUE DATE:</strong>{" "}
                  {new Date(planData.start_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="invoice-preview-items">
                  <table>
                    <thead>
                      <tr>
                        <th>DESCRIPTION</th>
                        <th className="text-end">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planData.items_json.map((item) => (
                        <tr key={item.id}>
                          <td>{item.description}</td>
                          <td className="text-end">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td>Total Amount</td>
                        <td className="text-end">
                          {formatCurrency(totalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h6>{selectedStudentIds.length} STUDENT(S) SELECTED</h6>
                <ListGroup className="selected-students-list">
                  {selectedStudents.map((s) => (
                    <ListGroup.Item key={s.id}>
                      <span>
                        <strong>
                          {s.first_name} {s.last_name}
                        </strong>
                        <br />
                        <small className="text-muted">{s.grade_level}</small>
                      </span>
                      <Button
                        variant="link"
                        className="p-0 text-danger"
                        onClick={() =>
                          setSelectedStudentIds((ids) =>
                            ids.filter((id) => id !== s.id)
                          )
                        }
                      >
                        <Trash />
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            </div>
            <Form.Check
              type="checkbox"
              defaultChecked
              label="Send invoice to parent automatically on each billing cycle."
              className="mt-4"
            />
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <div>
          {step === 3 && (
            <Button
              variant="outline-primary"
              onClick={handleSaveTemplate}
              disabled={isSaving}
            >
              Save as Template
            </Button>
          )}
        </div>
        <div>
          <Button
            variant="secondary"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            Back
          </Button>
          {step < 3 && (
            <Button
              className="ms-2"
              onClick={() => setStep(step + 1)}
              disabled={step === 2 && selectedStudentIds.length === 0}
            >
              Continue
            </Button>
          )}
          {step === 3 && (
            <Button
              className="ms-2"
              onClick={() => setStep(4)}
              disabled={!planData.plan_name}
            >
              Continue
            </Button>
          )}
          {step === 4 && (
            <Button
              className="ms-2"
              onClick={handleCreatePlan}
              disabled={isSaving}
            >
              {isSaving ? <Spinner size="sm" /> : "Create Plan"}
            </Button>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default CreatePlanWizard;
