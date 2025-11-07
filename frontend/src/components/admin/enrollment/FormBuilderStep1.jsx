import React from "react";
import { Form, Dropdown } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";
import FormField from "./FormField";

const FormBuilderStep1 = ({ formState, setFormState }) => {
  const handleTitleChange = (e) => {
    setFormState({
      ...formState,
      form_structure_json: {
        ...formState.form_structure_json,
        title: e.target.value,
      },
    });
  };

  const handleSectionToggle = (sectionId) => {
    const updatedSections = formState.form_structure_json.sections.map((s) =>
      s.id === sectionId ? { ...s, visible: !s.visible } : s
    );
    setFormState({
      ...formState,
      form_structure_json: {
        ...formState.form_structure_json,
        sections: updatedSections,
      },
    });
  };

  const addField = (sectionId, fieldType) => {
    const newField = {
      id: uuidv4(),
      type: fieldType,
      label: "",
      required: true,
    };
    const updatedSections = formState.form_structure_json.sections.map((s) =>
      s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s
    );
    setFormState({
      ...formState,
      form_structure_json: {
        ...formState.form_structure_json,
        sections: updatedSections,
      },
    });
  };

  const updateField = (sectionId, fieldId, updatedField) => {
    const updatedSections = formState.form_structure_json.sections.map((s) => {
      if (s.id === sectionId) {
        return {
          ...s,
          fields: s.fields.map((f) => (f.id === fieldId ? updatedField : f)),
        };
      }
      return s;
    });
    setFormState({
      ...formState,
      form_structure_json: {
        ...formState.form_structure_json,
        sections: updatedSections,
      },
    });
  };

  const deleteField = (sectionId, fieldId) => {
    const updatedSections = formState.form_structure_json.sections.map((s) => {
      if (s.id === sectionId) {
        return { ...s, fields: s.fields.filter((f) => f.id !== fieldId) };
      }
      return s;
    });
    setFormState({
      ...formState,
      form_structure_json: {
        ...formState.form_structure_json,
        sections: updatedSections,
      },
    });
  };

  return (
    <div className="form-builder-container">
      <input
        type="text"
        value={formState.form_structure_json?.title || ""}
        onChange={handleTitleChange}
        className="form-title-input"
        placeholder="New Student Enrollment Form"
      />
      {formState.form_structure_json?.sections.map((section) => (
        <div className="form-section" key={section.id}>
          <div className="form-section-header">
            <h3>{section.title}</h3>
            <Form.Check
              type="switch"
              id={`section-toggle-${section.id}`}
              label="Visible"
              checked={section.visible}
              onChange={() => handleSectionToggle(section.id)}
            />
          </div>
          {section.visible && (
            <>
              <div className="form-field-list">
                {section.fields.map((field) => (
                  <FormField
                    key={field.id}
                    field={field}
                    onUpdate={(fieldId, updatedField) =>
                      updateField(section.id, fieldId, updatedField)
                    }
                    onDelete={(fieldId) => deleteField(section.id, fieldId)}
                  />
                ))}
              </div>
              <div className="add-field-container">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-primary" size="sm">
                    Add Form Field
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item
                      onClick={() => addField(section.id, "short_answer")}
                    >
                      Short Answer
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => addField(section.id, "paragraph")}
                    >
                      Paragraph
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => addField(section.id, "checkbox")}
                    >
                      Checkbox
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => addField(section.id, "dropdown")}
                    >
                      Dropdown
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => addField(section.id, "date_picker")}
                    >
                      Date Picker
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => addField(section.id, "file_upload")}
                    >
                      File Upload
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item
                      onClick={() => addField(section.id, "line_divider")}
                    >
                      Line Divider
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default FormBuilderStep1;
