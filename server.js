require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const nodemailer = require("nodemailer");

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

/* TEST CONNECTION */
db.query("SELECT NOW()")
    .then(res => console.log("PostgreSQL Connected 🚀", res.rows[0]))
    .catch(err => console.log("DB Error:", err.message));

/* ================= ROUTES ================= */

app.get("/", (req, res) => {
    res.send("Noctisvora Backend is Live 🚀");
});

app.get("/testdb", async (req, res) => {
    try {
        const result = await db.query("SELECT NOW()");
        res.json({ success: true, time: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post("/submit", async (req, res) => {
    try {
        const { name, email, budget, project } = req.body;

        await db.query(
            "INSERT INTO requests (name, email, budget, project) VALUES ($1,$2,$3,$4)",
            [name, email, budget, project]
        );

        res.json({ success: true, message: "Submitted 🚀" });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT} 🚀`);
});