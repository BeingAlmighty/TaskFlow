'use server';

import { query } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function getUsers() {
  try {
    const result = await query(`
      SELECT 
        u.id, 
        u.username, 
        u.role, 
        u.availability, 
        u.category,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.points ELSE 0 END), 0) as "basePoints",
        COALESCE(SUM(t.bonus_points), 0) as "bonusPoints",
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.points ELSE 0 END), 0) + COALESCE(SUM(t.bonus_points), 0) as "totalScore"
      FROM users u 
      LEFT JOIN tasks t ON u.id = t.assigned_user_id 
      GROUP BY u.id
      ORDER BY "totalScore" DESC, "bonusPoints" DESC
    `);
    
    // Convert string aggregations to numbers
    return { success: true, users: result.rows.map(u => ({
      ...u,
      basePoints: parseInt(u.basePoints),
      bonusPoints: parseInt(u.bonusPoints),
      totalScore: parseInt(u.totalScore)
    })) };
  } catch (error) {
    console.error('Error getting users:', error);
    return { error: 'Server error' };
  }
}

export async function getLeaderboard() {
  try {
    const result = await query(`
      SELECT 
        u.id, 
        u.username, 
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.points ELSE 0 END), 0) as "basePoints",
        COALESCE(SUM(t.bonus_points), 0) as "bonusPoints",
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.points ELSE 0 END), 0) + COALESCE(SUM(t.bonus_points), 0) as "totalScore",
        COALESCE(COUNT(CASE WHEN t.status = 'completed' THEN 1 END), 0) as "completedTasks"
      FROM users u 
      LEFT JOIN tasks t ON u.id = t.assigned_user_id 
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY "totalScore" DESC, "bonusPoints" DESC
    `);
    
    return { success: true, users: result.rows.map(u => ({
      ...u,
      basePoints: parseInt(u.basePoints),
      bonusPoints: parseInt(u.bonusPoints),
      totalScore: parseInt(u.totalScore),
      completedTasks: parseInt(u.completedTasks)
    })) };
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return { error: 'Server error' };
  }
}

export async function getAssignmentStatus() {
  try {
    const result = await query(`
      SELECT 
        u.id, 
        u.username, 
        u.category, 
        u.availability,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM tasks 
            WHERE assigned_user_id = u.id AND status != 'completed' AND status != 'failed'
          ) THEN 'assigned'
          ELSE 'unassigned'
        END as assignment_status,
        (SELECT COUNT(*) 
         FROM tasks 
         WHERE assigned_user_id = u.id AND status = 'completed') as completed_tasks
      FROM users u
      WHERE u.role = 'user'
    `);
    return { success: true, users: result.rows.map(u => ({
        ...u,
        completed_tasks: parseInt(u.completed_tasks)
    })) };
  } catch (error) {
    console.error('Error getting assignment status:', error);
    return { error: 'Server error' };
  }
}

export async function getAvailableUsersByCategory(category) {
  try {
    const result = await query(`
        SELECT id, username, role, category, availability 
        FROM users 
        WHERE category = $1 
        AND availability = 'available' 
        AND role = 'user'
    `, [category]);
    return { success: true, users: result.rows };
  } catch (error) {
    console.error('Error getting available users:', error);
    return { error: 'Server error' };
  }
}

export async function createUser(username, password, role, category) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (username, password, role, category) VALUES ($1, $2, $3, $4) RETURNING id, username, role, category, availability',
      [username, hashedPassword, role || 'user', category]
    );
    return { success: true, user: result.rows[0] };
  } catch (error) {
    if (error.code === '23505') { // Postgres unique violation
      return { error: 'Username already exists' };
    }
    console.error('Error creating user:', error);
    return { error: 'Server error' };
  }
}

export async function updateUserAvailability(userId, availability) {
  try {
    if (!['available', 'unavailable'].includes(availability)) {
      return { error: 'Availability must be either "available" or "unavailable"' };
    }
    const result = await query(
      'UPDATE users SET availability = $1 WHERE id = $2 RETURNING id',
      [availability, userId]
    );
    if (result.rowCount === 0) return { error: 'User not found' };
    return { success: true };
  } catch (error) {
    console.error('Error updating availability:', error);
    return { error: 'Server error' };
  }
}

export async function updateUserPassword(userId, password) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'UPDATE users SET password = $1 WHERE id = $2 RETURNING id',
      [hashedPassword, userId]
    );
    if (result.rowCount === 0) return { error: 'User not found' };
    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    return { error: 'Server error' };
  }
}

export async function getDashboardStats() {
  try {
    const totalTasksRes = await query('SELECT COUNT(*) FROM tasks');
    const activeUsersRes = await query(`SELECT COUNT(*) FROM users WHERE role = 'user' AND availability = 'available'`);
    const pendingReviewRes = await query(`SELECT COUNT(*) FROM tasks WHERE status = 'to_be_reviewed'`);

    return {
      success: true,
      stats: {
        totalTasks: parseInt(totalTasksRes.rows[0].count),
        activeUsers: parseInt(activeUsersRes.rows[0].count),
        pendingReview: parseInt(pendingReviewRes.rows[0].count)
      }
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return { error: 'Server error' };
  }
}
