import pool from './database';

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Starting database migration...');

    // Enable PostGIS extension
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('✓ PostGIS extension enabled');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ Users table created');

    // Create index for users email lookup
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    console.log('✓ Users email index created');

    // Create things table
    await client.query(`
      CREATE TABLE IF NOT EXISTS things (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        headline VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        contact_email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'active',
        location GEOGRAPHY(POINT, 4326)
      );
    `);
    console.log('✓ Things table created');

    // Create indexes for things table
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_things_location_gist ON things USING GIST(location);
    `);
    console.log('✓ Things location GIST index created');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_things_user_id ON things(user_id);
    `);
    console.log('✓ Things user_id index created');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_things_created_at ON things(created_at DESC);
    `);
    console.log('✓ Things created_at index created');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_things_status_location ON things(status) WHERE status = 'active';
    `);
    console.log('✓ Things status partial index created');

    // Create user_item_count table for rate limiting
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_item_count (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        week_start_date DATE NOT NULL,
        item_count INT DEFAULT 0,
        PRIMARY KEY (user_id, week_start_date)
      );
    `);
    console.log('✓ User item count table created');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_item_count_lookup ON user_item_count(user_id, week_start_date);
    `);
    console.log('✓ User item count index created');

    // Create trigger to automatically populate location field
    await client.query(`
      CREATE OR REPLACE FUNCTION update_location()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS things_location_trigger ON things;
      CREATE TRIGGER things_location_trigger
      BEFORE INSERT OR UPDATE ON things
      FOR EACH ROW
      EXECUTE FUNCTION update_location();
    `);
    console.log('✓ Location trigger created');

    console.log('\n✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
