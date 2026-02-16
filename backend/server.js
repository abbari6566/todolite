require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:3000" })); // allow Next.js dev server
app.use(express.json()); // parse JSON request bodies

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Create table if not exists (simple dev convenience)
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log("DB initialized: todos table ready");
}

// REST endpoints

// GET all todos
app.get("/api/todos", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, done, created_at FROM todos ORDER BY id DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// POST create todo
app.post("/api/todos", async (req, res) => {
  try {
    const { title } = req.body;

    // Basic validation
    if (!title || typeof title !== "string" || title.trim().length < 2) {
      return res
        .status(400)
        .json({ error: "Title must be at least 2 characters" });
    }

    const result = await pool.query(
      "INSERT INTO todos (title) VALUES ($1) RETURNING id, title, done, created_at",
      [title.trim()],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

// PATCH toggle done
app.patch("/api/todos/:id/toggle", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const result = await pool.query(
      `
      UPDATE todos
      SET done = NOT done
      WHERE id = $1
      RETURNING id, title, done, created_at
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to toggle todo" });
  }
});

const port = process.env.PORT || 5000;

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("DB init failed:", err);
    process.exit(1);
  });
