const { User, UserRole } = require('../models/User');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-mot_de_passe');
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: { users }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const newUser = await User.create({
      nom_utilisateur: req.body.nom_utilisateur,
      email: req.body.email,
      mot_de_passe: req.body.mot_de_passe,
      prénom: req.body.prénom,
      nom: req.body.nom,
      role: req.body.role || UserRole.USER,
      photo_de_profil: req.body.photo_de_profil
    });

    // Ne pas retourner le mot de passe
    newUser.mot_de_passe = undefined;

    res.status(201).json({
      status: 'success',
      data: { user: newUser }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Ajoutez d'autres méthodes (getUser, updateUser, deleteUser, login, etc.)