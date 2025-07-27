// backend/src/server.js
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Function to find an available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve, reject) => {
    const server = require('http').createServer();
    
    server.listen(startPort, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Try the next port
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
};

// Start server with automatic port detection
const startServer = async () => {
  try {
    const availablePort = await findAvailablePort(PORT);
    
    app.listen(availablePort, () => {
      console.log(`🚀 Serveur démarré sur le port ${availablePort}`);
      console.log(`📡 API disponible sur: http://localhost:${availablePort}`);
      console.log(`🧪 Test endpoint: http://localhost:${availablePort}/api/test`);
      console.log(`👤 Users CRUD: http://localhost:${availablePort}/api/users`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();
