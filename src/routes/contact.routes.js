// server/src/routes/contact.routes.js
import express from "express";
import rateLimit from "express-rate-limit";
import ContactMessage from "../models/ContactMessage.js";
import nodemailer from "nodemailer";

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", limiter, async (req, res) => {
  try {
    const { name, email, subject, message, phone, website } = req.body;

    if (website) return res.status(200).json({ ok: true }); // honeypot

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email and message are required." });
    }

    const doc = await ContactMessage.create({
      name, email, subject, message, phone,
      ip: req.ip, userAgent: req.get("user-agent") || ""
    });

    if (process.env.EMAIL_HOST && process.env.EMAIL_TO) {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "587", 10),
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
      const html = `
        <h2>New Contact Message</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone || "-"}</p>
        <p><b>Subject:</b> ${subject || "-"}</p>
        <pre style="white-space:pre-wrap">${message}</pre>
      `;
      await transporter.sendMail({
        from: `"TMP Website" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_TO,
        subject: `Contact: ${subject || "New message"} – ${name}`,
        html,
      });
    }

    res.json({ ok: true, id: doc._id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", async (_req, res) => {
  const list = await ContactMessage.find().sort({ createdAt: -1 }).limit(50);
  res.json(list);
});

export default router;   // <-- important
