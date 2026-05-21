import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error', err);
});

export const query = async (text: string, params?: unknown[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query', { text, duration, rows: res.rowCount });
  }
  return res;
};

export const getClient = async (): Promise<PoolClient> => {
  return pool.connect();
};

export const initializeDatabase = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        avatar_url VARCHAR(500),
        country VARCHAR(2),
        password_hash VARCHAR(255) NOT NULL,
        total_earnings DECIMAL(18,2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS weekly_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        player_id UUID REFERENCES players(id) ON DELETE CASCADE,
        week_start DATE NOT NULL,
        week_end DATE NOT NULL,
        rank INTEGER NOT NULL,
        score DECIMAL(18,2) NOT NULL,
        prize_pool_total DECIMAL(18,2) NOT NULL,
        reward_amount DECIMAL(18,2) DEFAULT 0,
        reward_percentage DECIMAL(6,4) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_weekly_snapshots_player
        ON weekly_snapshots(player_id, week_start)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_weekly_snapshots_week
        ON weekly_snapshots(week_start, rank)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS prize_pools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        week_start DATE UNIQUE NOT NULL,
        week_end DATE NOT NULL,
        total_pool DECIMAL(18,2) NOT NULL DEFAULT 0,
        distributed BOOLEAN DEFAULT FALSE,
        distributed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reward_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        player_id UUID REFERENCES players(id) ON DELETE CASCADE,
        prize_pool_id UUID REFERENCES prize_pools(id),
        week_start DATE NOT NULL,
        rank INTEGER NOT NULL,
        amount DECIMAL(18,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reward_transactions_player
        ON reward_transactions(player_id, week_start)
    `);

    await client.query('COMMIT');
    console.log('Database schema initialized successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export default pool;
