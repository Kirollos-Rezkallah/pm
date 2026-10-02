"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "@/components/KanbanCard";
import { NewCardForm } from "@/components/NewCardForm";
import type { Card, Column } from "@/lib/kanban";

type KanbanColumnProps = {
  column: Column;
  cards: Card[];
  columns: Column[];
  onRename: (columnId: string, title: string) => Promise<boolean>;
  onAddCard: (columnId: string, title: string, details: string) => Promise<boolean>;
  onMoveCard: (cardId: string, destinationColumnId: string) => Promise<boolean>;
  onEditCard: (cardId: string, title: string, details: string) => Promise<boolean>;
};

export const KanbanColumn = ({
  column,
  cards,
  columns,
  onRename,
  onAddCard,
  onMoveCard,
  onEditCard,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [title, setTitle] = useState(column.title);

  useEffect(() => setTitle(column.title), [column.title]);

  const saveTitle = () => {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setTitle(column.title);
      return;
    }
    if (nextTitle !== column.title) void onRename(column.id, nextTitle);
  };

  return (
    <section ref={setNodeRef} className={clsx("kanban-column", isOver && "kanban-column-over")} data-testid={`column-${column.id}`}>
      <header className="column-header">
        <div className="column-marker" aria-hidden="true" />
        <p>{cards.length} {cards.length === 1 ? "card" : "cards"}</p>
        <label htmlFor={`column-title-${column.id}`}>Column name</label>
        <input
          id={`column-title-${column.id}`}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={saveTitle}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) event.currentTarget.blur();
          }}
        />
      </header>
      <div className="column-cards">
        <SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              columnId={column.id}
              columns={columns}
              onMove={onMoveCard}
              onEdit={onEditCard}
            />
          ))}
        </SortableContext>
        {cards.length === 0 ? <p className="column-empty">Drop a card here or use a card’s Move to control.</p> : null}
      </div>
      <NewCardForm columnId={column.id} onAdd={(title, details) => onAddCard(column.id, title, details)} />
    </section>
  );
};
