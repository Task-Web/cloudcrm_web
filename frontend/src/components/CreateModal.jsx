import { useEffect, useState } from "react";
import { Modal } from "./Modal";

export const CreateModal = ({
  isOpen,
  onClose,
  title,
  fields,
  onSubmit,
  initialData = {},
  submitLabel = "Create",
  submittingLabel = "Creating...",
}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormData(initialData);
    setErrors({});
  }, [isOpen, initialData]);

  const validateField = (field, value) => {
    if (field.required && (!value || String(value).trim() === "")) {
      return `${field.label} is required`;
    }

    if (field.type === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return "Invalid email format";
      }
    }

    return null;
  };

  const validateForm = () => {
    const nextErrors = {};

    fields.forEach((field) => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        nextErrors[field.name] = error;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      setFormData(initialData);
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="large">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {fields.map((field) => (
          <div key={field.name} className="form-group">
            <label className="form-label">
              {field.label}
              {field.required && <span style={{ color: "var(--error)" }}> *</span>}
            </label>

            {field.type === "select" ? (
              <select
                className={`form-select ${errors[field.name] ? "error" : ""}`}
                value={formData[field.name] || ""}
                onChange={(event) => handleFieldChange(field.name, event.target.value)}
                aria-invalid={errors[field.name] ? "true" : "false"}
                aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                className={`form-textarea ${errors[field.name] ? "error" : ""}`}
                value={formData[field.name] || ""}
                onChange={(event) => handleFieldChange(field.name, event.target.value)}
                rows={4}
                aria-invalid={errors[field.name] ? "true" : "false"}
                aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
              />
            ) : (
              <input
                type={field.type}
                className={`form-input ${errors[field.name] ? "error" : ""}`}
                value={formData[field.name] || ""}
                onChange={(event) => handleFieldChange(field.name, event.target.value)}
                aria-invalid={errors[field.name] ? "true" : "false"}
                aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
              />
            )}

            {errors[field.name] && (
              <div
                id={`${field.name}-error`}
                className="form-error"
                style={{
                  color: "var(--error)",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
              >
                {errors[field.name]}
              </div>
            )}
          </div>
        ))}

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            paddingTop: "20px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting} type="button">
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} type="submit">
            {submitting ? (
              <>
                <span
                  className="spinner"
                  style={{ width: "16px", height: "16px", borderWidth: "2px", marginRight: "8px" }}
                />
                {submittingLabel}
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateModal;
