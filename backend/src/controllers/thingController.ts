import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ThingModel } from '../models/thingModel';
import { UserModel } from '../models/userModel';
import emailService from '../services/emailService';
import { CreateThingRequest, ContactRequest } from '../types';

export class ThingController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { headline, description, latitude, longitude }: CreateThingRequest =
        req.body;
      const userId = req.user!.userId;

      // Validate input
      if (!headline || !description || latitude === undefined || longitude === undefined) {
        res.status(400).json({ error: 'All fields are required' });
        return;
      }

      // Validate coordinates
      if (latitude < -90 || latitude > 90) {
        res.status(400).json({ error: 'Invalid latitude' });
        return;
      }
      if (longitude < -180 || longitude > 180) {
        res.status(400).json({ error: 'Invalid longitude' });
        return;
      }

      // Check rate limit (5 items per week)
      const itemCount = await ThingModel.getUserItemCountThisWeek(userId);
      if (itemCount >= 5) {
        res.status(429).json({
          error: 'Rate limit exceeded. You can only add 5 items per week.',
        });
        return;
      }

      // Get user email for contact
      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Create thing
      const thing = await ThingModel.create(
        userId,
        headline,
        description,
        latitude,
        longitude,
        user.email
      );

      // Increment user item count
      await ThingModel.incrementUserItemCount(userId);

      res.status(201).json({
        message: 'Item created successfully',
        thing,
      });
    } catch (error) {
      console.error('Create thing error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getNearby(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { lat, lng, radius } = req.query;

      // Validate input
      if (!lat || !lng) {
        res.status(400).json({ error: 'Latitude and longitude are required' });
        return;
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radiusMeters = radius ? parseInt(radius as string) : 1000;

      // Validate coordinates
      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({ error: 'Invalid coordinates' });
        return;
      }

      const things = await ThingModel.findNearby(latitude, longitude, radiusMeters);

      res.status(200).json({
        count: things.length,
        things,
      });
    } catch (error) {
      console.error('Get nearby things error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const thing = await ThingModel.findById(id);
      if (!thing) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }

      res.status(200).json({ thing });
    } catch (error) {
      console.error('Get thing error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMyThings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const things = await ThingModel.findByUserId(userId);

      res.status(200).json({
        count: things.length,
        things,
      });
    } catch (error) {
      console.error('Get my things error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const updates = req.body;

      const thing = await ThingModel.update(id, userId, updates);
      if (!thing) {
        res.status(404).json({ error: 'Item not found or unauthorized' });
        return;
      }

      res.status(200).json({
        message: 'Item updated successfully',
        thing,
      });
    } catch (error) {
      console.error('Update thing error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const deleted = await ThingModel.delete(id, userId);
      if (!deleted) {
        res.status(404).json({ error: 'Item not found or unauthorized' });
        return;
      }

      res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Delete thing error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async contact(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { message }: ContactRequest = req.body;

      if (!message || message.trim().length === 0) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      // Get the thing
      const thing = await ThingModel.findById(id);
      if (!thing) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }

      // Send email to the owner
      await emailService.sendContactEmail(
        thing.contact_email,
        thing.headline,
        message
      );

      res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
      console.error('Contact error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
}
