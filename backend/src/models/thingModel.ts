import pool from '../config/database';
import { Thing } from '../types';
import { getWeekStartDate } from '../utils/date';

export class ThingModel {
  static async create(
    userId: string,
    headline: string,
    description: string,
    latitude: number,
    longitude: number,
    contactEmail: string
  ): Promise<Thing> {
    const result = await pool.query(
      `INSERT INTO things (user_id, headline, description, latitude, longitude, contact_email)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, headline, description, latitude, longitude, contactEmail]
    );
    return result.rows[0];
  }

  static async findById(id: string): Promise<Thing | null> {
    const result = await pool.query('SELECT * FROM things WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByUserId(userId: string): Promise<Thing[]> {
    const result = await pool.query(
      'SELECT * FROM things WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async findNearby(
    latitude: number,
    longitude: number,
    radiusMeters: number = 1000
  ): Promise<Thing[]> {
    const result = await pool.query(
      `SELECT *,
        ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) as distance
       FROM things
       WHERE status = 'active'
         AND ST_DWithin(
           location,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
           $3
         )
       ORDER BY distance ASC`,
      [latitude, longitude, radiusMeters]
    );
    return result.rows;
  }

  static async update(
    id: string,
    userId: string,
    updates: Partial<Thing>
  ): Promise<Thing | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.headline !== undefined) {
      fields.push(`headline = $${paramCount++}`);
      values.push(updates.headline);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.latitude !== undefined && updates.longitude !== undefined) {
      fields.push(`latitude = $${paramCount++}`);
      values.push(updates.latitude);
      fields.push(`longitude = $${paramCount++}`);
      values.push(updates.longitude);
    }

    if (fields.length === 0) {
      return null;
    }

    values.push(id, userId);

    const result = await pool.query(
      `UPDATE things
       SET ${fields.join(', ')}
       WHERE id = $${paramCount++} AND user_id = $${paramCount++}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM things WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (result.rowCount || 0) > 0;
  }

  // Rate limiting functions
  static async getUserItemCountThisWeek(userId: string): Promise<number> {
    const weekStart = getWeekStartDate();

    const result = await pool.query(
      'SELECT item_count FROM user_item_count WHERE user_id = $1 AND week_start_date = $2',
      [userId, weekStart]
    );

    return result.rows[0]?.item_count || 0;
  }

  static async incrementUserItemCount(userId: string): Promise<void> {
    const weekStart = getWeekStartDate();

    await pool.query(
      `INSERT INTO user_item_count (user_id, week_start_date, item_count)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id, week_start_date)
       DO UPDATE SET item_count = user_item_count.item_count + 1`,
      [userId, weekStart]
    );
  }
}
