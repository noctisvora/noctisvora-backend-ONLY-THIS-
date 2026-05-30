require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

console.log("DATABASE_URL EXISTS:", !!process.env.DATABASE_URL);

/* ================= DATABASE ================= */
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

/* connection test */
db.query("SELECT NOW()")
    .then(res => console.log("PostgreSQL Connected 🚀", res.rows[0]))
    .catch(err => console.log("DB Error:", err.message));

/* ================= ROUTES ================= */

app.get("/", (req, res) => {
    res.send("Noctisvora Backend is Live 🚀");
});

/* 🔥 FIXED: requests route (important for admin panel) */
app.get("/requests", async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM requests ORDER BY id DESC"
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* test route */
app.get("/testdb", async (req, res) => {
    try {
        const result = await db.query("SELECT NOW()");
        res.json({ success: true, time: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/* ================= SUBMIT ================= */

app.post("/submit", async (req, res) => {
    try {
        const { name, email, budget, project } = req.body;

        if (!name || !email || !project) {
            return res.status(400).json({
                success: false,
                message: "Missing fields"
            });
        }

        await db.query(
            "INSERT INTO requests (name, email, budget, project) VALUES ($1,$2,$3,$4)",
            [name, email, budget, project]
        );

        res.json({
            success: true,
            message: "Submitted 🚀"
        });

    } catch (err) {
        console.log("Submit Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

/* ================= START ================= */

app.listen(PORT, () => {
    console.log(`Server running on ${PORT} 🚀`);
});