import pool from './db.js';
import bcrypt from 'bcrypt';

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        availability VARCHAR(50) DEFAULT 'available',
        category VARCHAR(100)
      )
    `);

    // Create tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        points INTEGER DEFAULT NULL,
        bonus_points INTEGER DEFAULT 0,
        remarks TEXT,
        status VARCHAR(50) DEFAULT 'active',
        category VARCHAR(100)
      )
    `);

    // Check if admin exists
    const adminCheck = await client.query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
        ['admin', hashedPassword, 'admin']
      );
      console.log('Admin user created.');
    }

    // Check if test user exists
    const testCheck = await client.query('SELECT * FROM users WHERE username = $1', ['test']);
    if (testCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('test123', 10);
      await client.query(
        'INSERT INTO users (username, password, role, category) VALUES ($1, $2, $3, $4)',
        ['test', hashedPassword, 'user', 'Technical Part']
      );
      console.log('Test user created.');
    }

    await client.query('COMMIT');
    console.log('Database initialized successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Failed to initialize database:', e);
    throw e;
  } finally {
    client.release();
  }
}
