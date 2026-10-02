"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import type { Card } from "@/lib/kanban";

type CardEditorDialogProps = {
  card: Card;
  onClose: () => void;
  onSave: (title: string, details: string) => Promise<boolean>;
};

const focusableSelector = "button:not([disabled]), input:not([disabled]), textarea:not([disabled])";

export const CardEditorDialog = ({ card, onClose, onSave }: CardEditorDialogProps) => {
  const titleRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [title, setTitle] = useState(card.title);
  const [details, setDetails] = useState(card.details);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement;
    const application = document.getElementById("application-root");
    application?.setAttribute("inert", "");
    titleRef.current?.focus();
    return () => {
      application?.removeAttribute("inert");
      returnFocusRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(document.querySelectorAll<HTMLElement>("[data-card-dialog] " + focusableSelector));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Enter a card title.");
      titleRef.current?.focus();
      return;
    }
    setError("");
    setIsSaving(true);
    const saved = await onSave(title.trim(), details.trim());
    setIsSaving(false);
    if (saved) onClose();
    else setError("Changes could not be saved. Retry from this dialog or the board status line.");
  };

  return createPortal(
    <div className="dialog-layer" role="presentation">
      <button type="button" className="dialog-backdrop" aria-label="Close edit card" onClick={onClose} />
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="edit-card-title" data-card-dialog>
        <div className="dialog-heading">
          <p className="eyebrow">Card details</p>
          <h2 id="edit-card-title">Edit card</h2>
        </div>
        <form noValidate onSubmit={submit} className="dialog-form">
          {error ? <div className="form-alert" role="alert">{error}</div> : null}
          <div className="field-group">
            <label htmlFor="card-title">Title</label>
            <input
              id="card-title"
              ref={titleRef}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "card-edit-error" : undefined}
            />
          </div>
          <div className="field-group">
            <label htmlFor="card-details">Details</label>
            <textarea className="resize-none" id="card-details" rows={5} value={details} onChange={(event) => setDetails(event.target.value)} />
          </div>
          {error ? <p id="card-edit-error" className="sr-only">{error}</p> : null}
          <div className="dialog-actions">
            <button type="button" className="button button-secondary" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={isSaving} aria-busy={isSaving}>
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body
  );
};
