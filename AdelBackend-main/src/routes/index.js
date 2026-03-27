import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import eventsRoutes from './events.routes.js';
import inscriptionsRoutes from './inscriptions.routes.js';
import paymentsRoutes from './payments.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/events', eventsRoutes);
router.use('/inscriptions', inscriptionsRoutes);
router.use('/payments', paymentsRoutes);

export default router;

