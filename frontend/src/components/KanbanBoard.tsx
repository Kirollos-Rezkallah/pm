"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { api, ApiError, type ChatMessage, type ChatResult } from "@/lib/api";
import { createId, moveCard, type BoardData } from "@/lib/kanban";
import { ChatSidebar } from "@/components/ChatSidebar";
import { KanbanCardPreview } from "@/components/KanbanCardPreview";
import { KanbanColumn } from "@/components/KanbanColumn";
import { SignInForm } from "@/components/SignInForm";

type AppState = "loading" | "signed-out" | "workspace" | "error";

export const KanbanBoard = () => {
  const [appState, setAppState] = useState<AppState>("loading");
  const [username, setUsername] = useState("");
  const [board, setBoard] = useState<BoardData | null>(null);
  const boardRef = useRef<BoardData | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saveStatus, setSaveStatus] = useState("Board changes save automatically.");
  const [saveError, setSaveError] = useState("");
  const saveQueue = useRef<Promise<boolean>>(Promise.resolve(true));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const setCurrentBoard = (nextBoard: BoardData) => {
    boardRef.current = nextBoard;
    setBoard(nextBoard);
  };

  const loadWorkspace = async (knownUsername?: string) => {
    setAppState("loading");
    setLoadError("");
    try {
      const user = knownUsername ? { username: knownUsername } : await api.currentUser();
      const nextBoard = await api.getBoard();
      setUsername(user.username);
      setCurrentBoard(nextBoard);
      setAppState("workspace");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setAppState("signed-out");
      } else {
        setLoadError("The board could not be loaded. Check that the local server is running, then retry.");
        setAppState("error");
      }
    }
  };

  useEffect(() => {
    void loadWorkspace();
  }, []);

  const signIn = async (nextUsername: string, password: string) => {
    setLoginError("");
    try {
      const user = await api.login(nextUsername, password);
      await loadWorkspace(user.username);
    } catch (error) {
      setLoginError(error instanceof ApiError ? error.message : "The sign-in request could not be completed. Try again.");
    }
  };

  const signOut = async () => {
    try {
      await api.logout();
    } finally {
      setBoard(null);
      boardRef.current = null;
      setUsername("");
      setLoginError("");
      setAppState("signed-out");
    }
  };

  const persistBoard = (nextBoard: BoardData, successMessage: string): Promise<boolean> => {
    setCurrentBoard(nextBoard);
    setSaveStatus("Saving board…");
    setSaveError("");
    const task = saveQueue.current.then(async () => {
      try {
        await api.saveBoard(nextBoard);
        if (boardRef.current === nextBoard) setSaveStatus(successMessage);
        return true;
      } catch {
        if (boardRef.current === nextBoard) {
          setSaveStatus("Board changes need attention.");
          setSaveError("The latest board change was not saved.");
        }
        return false;
      }
    });
    saveQueue.current = task;
    return task;
  };

  const retrySave = () => {
    if (boardRef.current) void persistBoard(boardRef.current, "Board changes saved.");
  };

  const renameColumn = (columnId: string, title: string) => {
    if (!boardRef.current) return Promise.resolve(false);
    const nextBoard = {
      ...boardRef.current,
      columns: boardRef.current.columns.map((column) => column.id === columnId ? { ...column, title } : column),
    };
    return persistBoard(nextBoard, "Column name saved.");
  };

  const addCard = (columnId: string, title: string, details: string) => {
    if (!boardRef.current) return Promise.resolve(false);
    const id = createId("card");
    const nextBoard = {
      ...boardRef.current,
      cards: { ...boardRef.current.cards, [id]: { id, title, details } },
      columns: boardRef.current.columns.map((column) => column.id === columnId ? { ...column, cardIds: [...column.cardIds, id] } : column),
    };
    return persistBoard(nextBoard, "Card added.");
  };

  const editCard = (cardId: string, title: string, details: string) => {
    if (!boardRef.current) return Promise.resolve(false);
    const currentCard = boardRef.current.cards[cardId];
    if (!currentCard) return Promise.resolve(false);
    const nextBoard = { ...boardRef.current, cards: { ...boardRef.current.cards, [cardId]: { ...currentCard, title, details } } };
    return persistBoard(nextBoard, "Card changes saved.");
  };

  const moveToColumn = (cardId: string, destinationColumnId: string) => {
    if (!boardRef.current) return Promise.resolve(false);
    const nextColumns = moveCard(boardRef.current.columns, cardId, destinationColumnId);
    if (nextColumns === boardRef.current.columns) return Promise.resolve(true);
    return persistBoard({ ...boardRef.current, columns: nextColumns }, "Card moved.");
  };

  const handleDragStart = (event: DragStartEvent) => setActiveCardId(String(event.active.id));

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null);
    if (!event.over || event.active.id === event.over.id) return;
    if (!boardRef.current) return;
    const nextColumns = moveCard(boardRef.current.columns, String(event.active.id), String(event.over.id));
    if (nextColumns !== boardRef.current.columns) void persistBoard({ ...boardRef.current, columns: nextColumns }, "Card moved.");
  };

  const sendChat = async (messages: ChatMessage[]): Promise<ChatResult> => {
    const saved = await saveQueue.current;
    if (!saved) throw new Error("The board must be saved before asking the assistant.");
    return api.chat(messages);
  };

  const acceptAssistantBoard = (assistantBoard: BoardData | null) => {
    if (assistantBoard) {
      setCurrentBoard(assistantBoard);
      setSaveError("");
      setSaveStatus("Board updated by the assistant.");
    }
  };

  const activeCard = useMemo(() => activeCardId && board?.cards[activeCardId], [activeCardId, board]);

  if (appState === "loading") {
    return <main className="loading-shell" aria-live="polite">Loading your workspace…</main>;
  }
  if (appState === "error") {
    return <main className="loading-shell"><p role="alert">{loadError}</p><button className="button button-primary" type="button" onClick={() => void loadWorkspace()}>Retry loading</button></main>;
  }
  if (appState === "signed-out") {
    return <SignInForm onSignIn={signIn} error={loginError} />;
  }
  if (!board) return null;

  return (
    <div id="application-root" className="application-shell">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Single board workspace</p>
          <h1>Kanban Studio</h1>
          <p className="workspace-intro">Move work forward without losing the thread.</p>
        </div>
        <div className="account-panel">
          <p>Signed in as <strong>{username}</strong></p>
          <button type="button" className="button button-secondary" onClick={() => void signOut()}>Sign out</button>
        </div>
        <div className="stage-rail" aria-label="Board stages">
          {board.columns.map((column) => <span key={column.id}><i aria-hidden="true" />{column.title}</span>)}
        </div>
      </header>

      <div className="workspace-grid">
        <main className="board-area" aria-labelledby="board-heading">
          <div className="board-status" aria-live="polite">
            <p id="board-heading">{saveStatus}</p>
            {saveError ? <button type="button" className="text-button" onClick={retrySave}>Retry save</button> : null}
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <section className="board-columns" aria-label="Kanban board">
              {board.columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  cards={column.cardIds.map((cardId) => board.cards[cardId]).filter(Boolean)}
                  columns={board.columns}
                  onRename={renameColumn}
                  onAddCard={addCard}
                  onMoveCard={moveToColumn}
                  onEditCard={editCard}
                />
              ))}
            </section>
            <DragOverlay>{activeCard ? <KanbanCardPreview card={activeCard} /> : null}</DragOverlay>
          </DndContext>
        </main>
        <ChatSidebar onSend={sendChat} onBoardUpdated={acceptAssistantBoard} />
      </div>
    </div>
  );
};
