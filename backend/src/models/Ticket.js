const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priority: { type: String, enum: ["High", "Low", "Medium"], default: "Low" },
    status: { type: String, enum: ["Closed", "Reopened", "Inprogress"], default: "Open" },
    assignedTo: { type: [String], default: [] }, // tu pourras mettre des userId ici si tu veux
    category: { type: String, default: "General" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // champs dénormalisés pour accès rapide
    createdByUsername: { type: String },
    createdByEmail: { type: String },
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        username: { type: String },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;