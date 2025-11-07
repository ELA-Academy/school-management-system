import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Form, Button, Spinner, Alert, Container, Card } from "react-bootstrap";
import {
  getPublicEnrollmentForm,
  submitEnrollmentForm,
} from "../../services/enrollmentService";
import "../../styles/MultiStepForm.css";

const PublicEnrollmentForm = () => {
  const { token } = useParams();
  const [formData, setFormData] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPublicEnrollmentForm(token);
      setFormData(data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not load the form. The link may be invalid or expired."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (fieldId, value) => {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitEnrollmentForm(token, responses);
      setSubmitSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.error || "An error occurred during submission."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field) => {
    const label = (
      <Form.Label>
        {field.label} {field.required && <span className="text-danger">*</span>}
      </Form.Label>
    );
    const value = responses[field.id] || "";

    switch (field.type) {
      case "short_answer":
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <Form.Control
              type="text"
              required={field.required}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          </Form.Group>
        );
      case "paragraph":
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <Form.Control
              as="textarea"
              rows={3}
              required={field.required}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          </Form.Group>
        );
      case "checkbox":
        return (
          <Form.Group key={field.id} className="mb-3">
            <Form.Check
              type="checkbox"
              required={field.required}
              checked={!!value}
              onChange={(e) => handleInputChange(field.id, e.target.checked)}
              label={field.label}
            />
          </Form.Group>
        );
      case "dropdown":
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <Form.Select
              required={field.required}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            >
              <option value="">Select an option</option>
              {/* TODO: Add options */}
            </Form.Select>
          </Form.Group>
        );
      case "date_picker":
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <Form.Control
              type="date"
              required={field.required}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          </Form.Group>
        );
      case "file_upload":
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <Form.Control
              type="file"
              required={field.required}
              onChange={(e) => handleInputChange(field.id, e.target.files[0])}
            />
          </Form.Group>
        );
      case "line_divider":
        return <hr key={field.id} className="my-4" />;
      default:
        return null;
    }
  };

  if (loading)
    return (
      <div className="text-center p-5">
        <Spinner />
      </div>
    );

  if (submitSuccess) {
    return (
      <Container className="mt-5">
        <Alert variant="success">
          <Alert.Heading>Thank You!</Alert.Heading>
          <p>
            Your enrollment form has been submitted successfully. Our admissions
            team will be in touch with you shortly.
          </p>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="form-page-container">
      <Card className="multistep-form">
        <Card.Body>
          {error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <Form onSubmit={handleSubmit}>
              <h2 className="text-center">{formData.form_structure.title}</h2>
              <p className="text-center text-muted mb-4">
                Enrollment for: <strong>{formData.student_name}</strong>
              </p>
              {formData.form_structure.sections
                .filter((s) => s.visible)
                .map((section) => (
                  <div key={section.id} className="mb-4">
                    <h4>{section.title}</h4>
                    <hr />
                    {section.fields.map(renderField)}
                  </div>
                ))}
              {formData.fee_required && (
                <Alert variant="info">
                  A payment of{" "}
                  <strong>${formData.fee_amount.toFixed(2)}</strong> is required
                  to complete this submission. You will be redirected to our
                  secure payment portal after clicking submit.
                </Alert>
              )}
              <div className="d-grid">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner size="sm" /> : "Submit Application"}
                </Button>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default PublicEnrollmentForm;
