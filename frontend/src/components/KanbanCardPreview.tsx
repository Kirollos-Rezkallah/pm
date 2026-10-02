import type { Card } from "@/lib/kanban";

type KanbanCardPreviewProps = {
  card: Card;
};

export const KanbanCardPreview = ({ card }: KanbanCardPreviewProps) => (
  <article className="kanban-card kanban-card-preview">
    <h3>{card.title}</h3>
    <p className="card-details">{card.details}</p>
  </article>
);
