const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors());
app.use(express.json());

/* ================= PORT ================= */
const PORT = process.env.PORT || 3000;

/* ================= DATABASE ================= */

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root123",
    database: "noctisvora"
});

/* ================= EMAIL ================= */

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "noctisvora@gmail.com",
        pass: "YOUR_APP_PASSWORD"
    }
});

/* ================= CONNECT DB ================= */

db.connect((err) => {
    if (err) {
        console.log("DB Error:", err);
    } else {
        console.log("MySQL Connected");
    }
});

/* ================= SUBMIT API ================= */

app.post("/submit", (req, res) => {

    const { name, email, budget, project } = req.body;

    const sql = `
        INSERT INTO requests (name,email,budget,project)
        VALUES (?,?,?,?)
    `;

    db.query(sql, [name, email, budget, project], (err) => {

        if (err) {
            console.log(err);
            return res.status(500).send("Error saving request");
        }

        /* ===== ADMIN EMAIL ===== */

        const adminMail = {
            from: "Noctisvora <noctisvora@gmail.com>",
            to: "noctisvora@gmail.com",
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

        /* ===== AUTO REPLY ===== */

        const userMail = {
            from: "Noctisvora <no-reply@gmail.com>",
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
    });
});

/* ================= GET REQUESTS (ADMIN PANEL) ================= */

app.get("/requests", (req, res) => {

    db.query("SELECT * FROM requests ORDER BY id DESC", (err, result) => {

        if (err) {
            return res.status(500).json(err);
        }

        res.json(result);
    });
});

/* ================= UPDATE STATUS ================= */

app.put("/requests/:id", (req, res) => {

    const { status } = req.body;

    db.query(
        "UPDATE requests SET status=? WHERE id=?",
        [status, req.params.id],
        (err) => {
            if (err) return res.status(500).send(err);
            res.send("Updated");
        }
    );
});

/* ================= DELETE REQUEST ================= */

app.delete("/requests/:id", (req, res) => {

    db.query(
        "DELETE FROM requests WHERE id=?",
        [req.params.id],
        (err) => {
            if (err) return res.status(500).send(err);
            res.send("Deleted");
        }
    );
});

/* ================= START SERVER ================= */

app.listen(PORT, () => {
    console.log("Server running on", PORT);
});