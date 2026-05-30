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

/* ================= DATABASE ================= */

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);

const db = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

/* ================= TEST DB CONNECTION ================= */

db.query("SELECT NOW()")
    .then(() => console.log("PostgreSQL Connected"))
    .catch(err => console.log("DB Error:", err));

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
        res.json(result.rows);
    } catch (err) {
        res.status(500).json(err);
    }
});

/* ================= SUBMIT API ================= */

app.post("/submit", async (req, res) => {
    try {

        const { name, email, budget, project } = req.body;

        await db.query(
            `
            INSERT INTO requests (name, email, budget, project)
            VALUES ($1, $2, $3, $4)
            `,
            [name, email, budget, project]
        );

        const adminMail = {
            from: `Noctisvora <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: "🚀 New Project Request",
            text: `
Name: ${name}
Email: ${email}
Budget: ${budget}
Project: ${project}
`
        };

        transporter.sendMail(adminMail, (error) => {
            if (error) console.log("Admin Mail Error:", error);
        });

        const userMail = {
            from: `Noctisvora <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "We received your request 🚀",
            text: `
Hello ${name},

We have received your project request.

Our team will contact you soon.

— Noctisvora
`
        };

        transporter.sendMail(userMail, (error) => {
            if (error) console.log("User Mail Error:", error);
        });

        res.send("Project Submitted 🚀");

    } catch (err) {
        console.log(err);
        res.status(500).json(err);
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
        res.status(500).json(err);
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

        res.send("Updated");

    } catch (err) {
        res.status(500).json(err);
    }
});

/* ================= DELETE REQUEST ================= */

app.delete("/requests/:id", async (req, res) => {
    try {

        await db.query(
            "DELETE FROM requests WHERE id = $1",
            [req.params.id]
        );

        res.send("Deleted");

    } catch (err) {
        res.status(500).json(err);
    }
});

/* ================= START SERVER ================= */

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});