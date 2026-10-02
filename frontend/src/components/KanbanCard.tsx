"use client";

import { useState } from "react";
import clsx from "clsx";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardEditorDialog } from "@/components/CardEditorDialog";
import type { Card, Column } from "@/lib/kanban";

type KanbanCardProps = {
  card: Card;
  columnId: string;
  columns: Column[];
  onMove: (cardId: string, destinationColumnId: string) => Promise<boolean>;
  onEdit: (cardId: string, title: string, details: string) => Promise<boolean>;
};

export const KanbanCard = ({ card, columnId, columns, onMove, onEdit }: KanbanCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <>
      <article
        ref={setNodeRef}
        style={style}
        className={clsx("kanban-card", isDragging && "kanban-card-dragging")}
        data-testid={`card-${card.id}`}
      >
        <div className="card-heading">
          <h3>{card.title}</h3>
          <button
            type="button"
            className="drag-handle"
            aria-label={`Edit ${card.title}; drag to move it`}
            onClick={() => setIsEditing(true)}
            {...attributes}
            {...listeners}
          >
            Edit / drag
          </button>
        </div>
        <p className="card-details">{card.details || "No details yet."}</p>
        <div className="card-actions">
          <label className="move-control" htmlFor={`move-${card.id}`}>
            Move to
            <select
              id={`move-${card.id}`}
              value={columnId}
              onChange={(event) => void onMove(card.id, event.target.value)}
              aria-label={`Move ${card.title} to another column`}
            >
              {columns.map((column) => (
                <option key={column.id} value={column.id}>{column.title}</option>
              ))}
            </select>
          </label>
        </div>
      </article>
      {isEditing ? (
        <CardEditorDialog
          card={card}
          onClose={() => setIsEditing(false)}
          onSave={(title, details) => onEdit(card.id, title, details)}
        />
      ) : null}
    </>
  );
};
