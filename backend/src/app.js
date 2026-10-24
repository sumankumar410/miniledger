const express = require('express');
const cors = require('cors');
const { env } = require('./config/env');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { NotFoundError } = require('./utils/errors');

const createApp = () => {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: env.CLIENT_URL === '*' ? '*' : env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsers
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Root welcome route
  app.get('/', (_req, res) => {
    res.json({
      name: 'MiniLedger API – Personal Lending Tracker',
      version: '1.0.0',
      status: 'active',
      health: '/api/health',
    });
  });

  // Mount API router
  app.use('/api', routes);

  // Catch-all 404 handler
  app.use((req, _res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

module.exports = createApp();
module.exports.createApp = createApp;
