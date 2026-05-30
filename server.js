require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors());
app.use(express.json());

/* ================= PORT ================= */
const PORT = process.env.PORT || 3000;

/* ================= BASIC DEBUG ================= */
console.log("DATABASE_URL EXISTS:", !!process.env.DATABASE_URL);

/* ================= DATABASE (CLEAN + FIXED) ================= */
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

/* SAFE CONNECTION TEST */
db.query("SELECT NOW()")
    .then(() => console.log("PostgreSQL Connected 🚀"))
    .catch((err) => console.log("DB Error:", err.message));

/* ================= EMAIL ================= */
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/* ================= HOME ================= */
app.get("/", (req, res) => {
    res.send("Noctisvora Backend is Live 🚀");
});

/* ================= TEST DB ================= */
app.get("/testdb", async (req, res) => {
    try {
        const result = await db.query("SELECT NOW()");
        res.json({
            success: true,
            time: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/* ================= SUBMIT API ================= */
app.post("/submit", async (req, res) => {
    try {
        const { name, email, budget, project } = req.body;

        if (!name || !email || !project) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        await db.query(
            "INSERT INTO requests (name, email, budget, project) VALUES ($1, $2, $3, $4)",
            [name, email, budget, project]
        );

        transporter.sendMail({
            from: `Noctisvora <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: "🚀 New Project Request",
            text: `Name: ${name}\nEmail: ${email}\nBudget: ${budget}\nProject: ${project}`
        });

        transporter.sendMail({
            from: `Noctisvora <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "We received your request 🚀",
            text: `Hello ${name},\n\nWe received your request. We will contact you soon.\n\n— Noctisvora`
        });

        res.json({
            success: true,
            message: "Project Submitted 🚀"
        });

    } catch (err) {
        console.log("Submit Error:", err.message);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/* ================= GET REQUESTS ================= */
app.get("/requests", async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM requests ORDER BY id DESC"
        );

        res.json(result.rows);

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/* ================= UPDATE STATUS ================= */
app.put("/requests/:id", async (req, res) => {
    try {
        const { status } = req.body;

        await db.query(
            "UPDATE requests SET status = $1 WHERE id = $2",
            [status, req.params.id]
        );

        res.json({ success: true, message: "Updated" });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/* ================= DELETE REQUEST ================= */
app.delete("/requests/:id", async (req, res) => {
    try {
        await db.query(
            "DELETE FROM requests WHERE id = $1",
            [req.params.id]
        );

        res.json({ success: true, message: "Deleted" });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
    console.log(`Server running on ${PORT} 🚀`);
});