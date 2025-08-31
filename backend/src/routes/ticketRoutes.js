const express = require("express");
const Ticket = require("../models/Ticket");
const { authenticateToken } = require("../middleware/auth"); // tu peux extraire ton middleware

const router = express.Router();

// ➕ Créer un ticket
router.post("/", authenticateToken, async (req, res) => {
  try {
    const ticket = new Ticket({
      ...req.body,
      createdBy: req.user.userId,
      createdByUsername: req.user.username,
      createdByEmail: req.user.email
    });
    await ticket.save();
    res.status(201).json({ success: true, message: "Ticket créé", data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 📥 Récupérer tous les tickets
router.get("/", authenticateToken, async (req, res) => {
  try {
    const tickets = await Ticket.find().populate("createdBy", "username email");
    res.json({ success: true, data: tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 📥 Récupérer un ticket par ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket introuvable" });
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✏️ Modifier un ticket
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket introuvable" });
    res.json({ success: true, message: "Ticket mis à jour", data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 🗑️ Supprimer un ticket
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket introuvable" });
    res.json({ success: true, message: "Ticket supprimé" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ➕ Ajouter un commentaire à un ticket
router.post("/:id/comments", authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Le commentaire est requis" });
    }
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket introuvable" });
    ticket.comments.push({ userId: req.user.userId, username: req.user.username, text: text.trim() });
    await ticket.save();
    res.status(201).json({ success: true, message: "Commentaire ajouté", data: ticket.comments[ticket.comments.length - 1] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 📥 Récupérer les commentaires d'un ticket
router.get("/:id/comments", authenticateToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).select("comments");
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket introuvable" });
    res.json({ success: true, data: ticket.comments || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
