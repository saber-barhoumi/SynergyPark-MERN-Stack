// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, UserRole } = require('../models/User');

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// ✅ SIGNUP Route
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;
    
    // Validation des champs requis
    if (!username || !email || !password || !firstName) {
      return res.status(400).json({
        message: 'Les champs username, email, password et firstName sont requis'
      });
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Format d\'email invalide'
      });
    }

    // Validation du rôle
    if (role && !Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        message: `Le rôle doit être l'un des suivants: ${Object.values(UserRole).join(', ')}`
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(409).json({
        message: 'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà'
      });
    }

    // Créer le nouvel utilisateur
    const newUser = new User({
      username,
      email,
      password, // sera hashé automatiquement par le middleware pre('save')
      firstName,
      lastName,
      role: role || UserRole.STARTUP
    });

    await newUser.save();

    // Générer le token JWT
    const token = jwt.sign(
      { 
        userId: newUser._id, 
        username: newUser.username,
        role: newUser.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt
      }
    });

  } catch (err) {
    console.error('❌ Erreur lors de l\'inscription:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Erreur de validation',
        errors: Object.keys(err.errors).map(key => ({
          field: key,
          message: err.errors[key].message
        }))
      });
    }
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        message: `Ce ${field} est déjà utilisé`
      });
    }
    
    res.status(500).json({
      message: 'Erreur lors de l\'inscription',
      error: err.message
    });
  }
});

// ✅ SIGNIN Route
router.post('/signin', async (req, res) => {
  try {
    const { login, password } = req.body; // login peut être email ou username
    
    if (!login || !password) {
      return res.status(400).json({
        message: 'Email/nom d\'utilisateur et mot de passe sont requis'
      });
    }

    // Chercher l'utilisateur par email ou username
    const user = await User.findOne({
      $or: [{ email: login }, { username: login }]
    });

    if (!user) {
      return res.status(401).json({
        message: 'Identifiants invalides'
      });
    }

    // Vérifier si l'utilisateur est actif
    if (!user.isActive) {
      return res.status(401).json({
        message: 'Compte désactivé'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Identifiants invalides'
      });
    }

    // Mettre à jour la dernière connexion
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // Générer le token JWT
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        profilePhoto: user.profilePhoto,
        lastLogin: new Date()
      }
    });

  } catch (err) {
    console.error('❌ Erreur lors de la connexion:', err);
    res.status(500).json({
      message: 'Erreur lors de la connexion',
      error: err.message
    });
  }
});

// ✅ SIGNOUT Route (optionnel - pour le côté client)
router.post('/signout', (req, res) => {
  // Avec JWT, la déconnexion se fait côté client en supprimant le token
  res.json({
    message: 'Déconnexion réussie'
  });
});

// ✅ Verify Token Route
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        message: 'Token manquant'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      message: 'Token valide',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        profilePhoto: user.profilePhoto
      }
    });

  } catch (err) {
    res.status(401).json({
      message: 'Token invalide',
      error: err.message
    });
  }
});

module.exports = router;
