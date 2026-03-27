import { Router } from 'express';
import InscriptionController from '../controllers/InscriptionController.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { inscriptionIdSchema } from '../validators/inscription.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/inscriptions/:id
 * @desc Get inscription by ID
 * @access Private
 */
router.get(
  '/:id',
  validate(inscriptionIdSchema),
  InscriptionController.getInscription,
);

/**
 * @route PATCH /api/inscriptions/:id/cancel
 * @desc Cancel inscription
 * @access Private/Owner
 */
router.patch(
  '/:id/cancel',
  validate(inscriptionIdSchema),
  InscriptionController.cancelInscription,
);

export default router;

