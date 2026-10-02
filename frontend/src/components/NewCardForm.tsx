"use client";

import { useRef, useState, type FormEvent } from "react";

const initialFormState = { title: "", details: "" };

type NewCardFormProps = {
  columnId: string;
  onAdd: (title: string, details: string) => Promise<boolean>;
};

export const NewCardForm = ({ columnId, onAdd }: NewCardFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.title.trim()) {
      setError("Enter a card title.");
      titleRef.current?.focus();
      return;
    }
    setError("");
    setIsSaving(true);
    const saved = await onAdd(formState.title.trim(), formState.details.trim());
    setIsSaving(false);
    if (saved) {
      setFormState(initialFormState);
      setIsOpen(false);
    } else {
      setError("The card could not be saved. Retry from this form or the board status line.");
    }
  };

  return (
    <div className="new-card">
      {isOpen ? (
        <form noValidate onSubmit={handleSubmit} className="new-card-form">
          {error ? <div className="form-alert" role="alert">{error}</div> : null}
          <div className="field-group">
            <label htmlFor={`new-card-title-${columnId}`}>Card title</label>
            <input
              ref={titleRef}
              id={`new-card-title-${columnId}`}
              value={formState.title}
              onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "new-card-error" : undefined}
            />
          </div>
          <div className="field-group">
            <label htmlFor={`new-card-details-${columnId}`}>Details</label>
            <textarea
              id={`new-card-details-${columnId}`}
              className="resize-none"
              value={formState.details}
              onChange={(event) => setFormState((prev) => ({ ...prev, details: event.target.value }))}
              rows={3}
            />
          </div>
          {error ? <p id="new-card-error" className="sr-only">{error}</p> : null}
          <div className="form-actions">
            <button type="submit" className="button button-primary" disabled={isSaving} aria-busy={isSaving}>
              {isSaving ? "Adding…" : "Add card"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setFormState(initialFormState);
                setError("");
              }}
              className="button button-secondary"
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setIsOpen(true)} className="button button-add-card">
          Add a card
        </button>
      )}
    </div>
  );
};
