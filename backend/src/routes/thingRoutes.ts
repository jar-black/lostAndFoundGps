import { Router } from 'express';
import { ThingController } from '../controllers/thingController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', ThingController.create);
router.get('/nearby', ThingController.getNearby);
router.get('/my-things', ThingController.getMyThings);
router.get('/:id', ThingController.getById);
router.put('/:id', ThingController.update);
router.delete('/:id', ThingController.delete);
router.post('/:id/contact', ThingController.contact);

export default router;
