'use server';

import { query } from '@/lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

export async function login(username, password) {
  try {
    if (!username || !password) {
      return { error: 'Username and password are required' };
    }

    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return { error: 'Invalid username or password' };
    }

    // Support both old plain text passwords and new bcrypt hashes
    let isMatch = false;
    if (user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;
    }

    if (!isMatch) {
      return { error: 'Invalid username or password' };
    }

    const { password: _, ...userWithoutPassword } = user;

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, category: user.category },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Server error: ' + (error.message || 'Unknown error') };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  return { success: true };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await query(
      'SELECT id, username, role, availability, category FROM users WHERE id = $1',
      [decoded.id]
    );
    return result.rows[0] || null;
  } catch (error) {
    return null;
  }
}
