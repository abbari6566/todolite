"use client";

import { useEffect, useState } from "react";

type Todo = {
  id: number;
  title: string;
  done: boolean;
  created_at: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTodos() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/todos`);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data: Todo[] = await res.json();
      setTodos(data);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.error ?? `Failed to create (${res.status})`);
      }

      setTitle("");
      await loadTodos();
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    }
  }

  async function toggleTodo(id: number) {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/todos/${id}/toggle`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error(`Failed to toggle (${res.status})`);
      await loadTodos();
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    }
  }

  useEffect(() => {
    loadTodos();
  }, []);

  return (
    <main
      style={{ maxWidth: 560, margin: "40px auto", fontFamily: "system-ui" }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>TodoLite</h1>

      <form
        onSubmit={addTodo}
        style={{ display: "flex", gap: 8, marginBottom: 16 }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New todo..."
          style={{ flex: 1, padding: 10 }}
        />
        <button type="submit" style={{ padding: "10px 14px" }}>
          Add
        </button>
      </form>

      {error && (
        <div style={{ background: "#ffe6e6", padding: 10, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : todos.length === 0 ? (
        <p>No todos yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {todos.map((t) => (
            <li
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 12,
                border: "1px solid #ddd",
                marginBottom: 8,
              }}
            >
              <span
                style={{ textDecoration: t.done ? "line-through" : "none" }}
              >
                {t.title}
              </span>
              <button onClick={() => toggleTodo(t.id)}>
                {t.done ? "Undo" : "Done"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
