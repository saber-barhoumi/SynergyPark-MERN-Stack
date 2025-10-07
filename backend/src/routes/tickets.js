const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  addComment,
  assignTicket,
  updateTicketStatus,
  getTicketStatistics,
  getEnums,
  getMyTickets,
  reactToTicket,
  reactToComment,
  deleteComment
} = require('../controllers/ticketController');

// Routes publiques
router.get('/enums', getEnums);

// POST /api/tickets - Créer un nouveau ticket (accessible sans authentification pour permettre les signalements anonymes)
router.post('/', createTicket);

// GET /api/tickets - Récupérer tous les tickets (avec pagination et filtres)
router.get('/', getAllTickets);

// GET /api/tickets/my-tickets - Récupérer les tickets de l'utilisateur connecté
router.get('/my-tickets', authenticateToken, getMyTickets);

// GET /api/tickets/statistics - Récupérer les statistiques des tickets
router.get('/statistics', getTicketStatistics);

// GET /api/tickets/:id - Récupérer un ticket par ID
router.get('/:id', getTicketById);

// PUT /api/tickets/:id - Mettre à jour un ticket (authentification requise)
router.put('/:id', authenticateToken, updateTicket);

// DELETE /api/tickets/:id - Supprimer un ticket (authentification requise)
router.delete('/:id', authenticateToken, deleteTicket);

// POST /api/tickets/:id/comments - Ajouter un commentaire à un ticket (authentification requise)
router.post('/:id/comments', authenticateToken, addComment);

// POST /api/tickets/:id/reactions - Réagir à un ticket (LIKE/LOVE)
router.post('/:id/reactions', authenticateToken, reactToTicket);

// POST /api/tickets/:id/comments/:commentId/reactions - Réagir à un commentaire (LIKE/LOVE)
router.post('/:id/comments/:commentId/reactions', authenticateToken, reactToComment);

// DELETE /api/tickets/:id/comments/:commentId - Supprimer un commentaire (auteur uniquement)
router.delete('/:id/comments/:commentId', authenticateToken, deleteComment);

// PUT /api/tickets/:id/assign - Assigner un ticket à un utilisateur (authentification requise)
router.put('/:id/assign', authenticateToken, assignTicket);

// PUT /api/tickets/:id/status - Mettre à jour le statut d'un ticket (authentification requise)
router.put('/:id/status', authenticateToken, updateTicketStatus);

module.exports = router;
