// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Middleware pour vérifier le token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: 'Token d\'accès manquant'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        message: 'Utilisateur non trouvé'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: 'Compte désactivé'
      });
    }

    // Set req.user with the user object and explicitly include userId
    req.user = {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    };
    next();
  } catch (err) {
    return res.status(403).json({
      message: 'Token invalide',
      error: err.message
    });
  }
};

// Middleware pour vérifier les rôles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Utilisateur non authentifié'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Accès non autorisé pour ce rôle'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
