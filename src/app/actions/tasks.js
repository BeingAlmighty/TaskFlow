'use server';

import { query } from '@/lib/db';

export async function getTasks() {
  try {
    const result = await query(`
      SELECT 
        t.*, 
        u.username as "assignedUserName",
        COALESCE(t.points, 0) as points,
        COALESCE(t.bonus_points, 0) as bonus_points,
        COALESCE(t.points, 0) + COALESCE(t.bonus_points, 0) as total_points
      FROM tasks t 
      LEFT JOIN users u ON t.assigned_user_id = u.id
      ORDER BY t.id DESC
    `);
    return { success: true, tasks: result.rows };
  } catch (error) {
    console.error('Error getting tasks:', error);
    return { error: 'Server error' };
  }
}

export async function getTaskById(taskId) {
  try {
    const result = await query(`
      SELECT t.*, u.username as "assignedUserName" 
      FROM tasks t 
      LEFT JOIN users u ON t.assigned_user_id = u.id 
      WHERE t.id = $1
    `, [taskId]);
    
    if (result.rows.length === 0) return { error: 'Task not found' };
    return { success: true, task: result.rows[0] };
  } catch (error) {
    console.error('Error getting task:', error);
    return { error: 'Server error' };
  }
}

export async function getUserTasks(userId) {
  try {
    const result = await query(`
      SELECT 
        *,
        COALESCE(points, 0) as points,
        COALESCE(bonus_points, 0) as bonus_points,
        COALESCE(points, 0) + COALESCE(bonus_points, 0) as total_points
      FROM tasks 
      WHERE assigned_user_id = $1
      ORDER BY id DESC
    `, [userId]);
    return { success: true, tasks: result.rows };
  } catch (error) {
    console.error('Error getting user tasks:', error);
    return { error: 'Server error' };
  }
}

export async function createTask(title, description, category, assignedUserId) {
  try {
    if (assignedUserId) {
      const userRes = await query('SELECT availability, category FROM users WHERE id = $1', [assignedUserId]);
      const user = userRes.rows[0];
      
      if (!user) return { error: 'User not found' };
      if (user.availability !== 'available') return { error: 'Cannot assign task to unavailable user.' };
      if (user.category !== category) return { error: 'User category does not match task category.' };
    }

    const status = assignedUserId ? 'assigned' : 'unassigned';
    
    const result = await query(`
      INSERT INTO tasks (title, description, category, assigned_user_id, status, points, bonus_points) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `, [title, description, category, assignedUserId || null, status, null, 0]);
    
    return getTaskById(result.rows[0].id);
  } catch (error) {
    console.error('Error creating task:', error);
    return { error: 'Server error' };
  }
}

export async function updateTask(taskId, title, description, category, assignedUserId) {
  try {
    if (assignedUserId) {
      const userRes = await query('SELECT availability, category FROM users WHERE id = $1', [assignedUserId]);
      const user = userRes.rows[0];
      
      if (!user) return { error: 'User not found' };
      if (user.availability !== 'available') return { error: 'Cannot assign task to unavailable user.' };
      if (user.category !== category) return { error: 'User category does not match task category.' };
    }

    const status = assignedUserId ? 'assigned' : 'unassigned';
    
    const result = await query(`
      UPDATE tasks 
      SET title = $1, description = $2, category = $3, assigned_user_id = $4, status = $5
      WHERE id = $6 RETURNING id
    `, [title, description, category, assignedUserId || null, status, taskId]);
    
    if (result.rowCount === 0) return { error: 'Task not found' };
    return getTaskById(taskId);
  } catch (error) {
    console.error('Error updating task:', error);
    return { error: 'Server error' };
  }
}

export async function assignPoints(taskId, points, bonusPoints = 0, remarks = '') {
  try {
    const basePts = parseInt(points);
    const bonusPts = parseInt(bonusPoints) || 0;
    
    if (basePts < 0 || basePts > 100) return { error: 'Base points must be between 0 and 100' };
    if (bonusPts < 0) return { error: 'Bonus points cannot be negative' };

    const taskRes = await query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskRes.rows.length === 0) return { error: 'Task not found' };

    const finalRemarks = remarks || `Task completed with ${basePts} base points and ${bonusPts} total bonus points`;

    const updateRes = await query(`
      UPDATE tasks 
      SET points = $1, bonus_points = $2, 
          remarks = CASE WHEN remarks IS NULL OR remarks = '' THEN $3 ELSE remarks || ' | ' || $4 END,
          status = 'completed'
      WHERE id = $5 RETURNING id
    `, [basePts, bonusPts, finalRemarks, finalRemarks, taskId]);

    return getTaskById(taskId);
  } catch (error) {
    console.error('Error assigning points:', error);
    return { error: 'Server error' };
  }
}

export async function addBonusPoints(taskId, bonusPoints, remarks = '') {
  try {
    const additionalBonus = parseInt(bonusPoints);
    if (!additionalBonus || additionalBonus <= 0) return { error: 'Bonus points must be > 0' };

    const taskRes = await query('SELECT points, bonus_points FROM tasks WHERE id = $1', [taskId]);
    if (taskRes.rows.length === 0) return { error: 'Task not found' };
    
    const task = taskRes.rows[0];
    const currentBonus = parseInt(task.bonus_points || 0);
    const newBonus = currentBonus + additionalBonus;
    const basePts = parseInt(task.points || 0);
    const totalPts = basePts + newBonus;

    const bonusRemark = remarks 
      ? `Bonus points added: ${additionalBonus} (${remarks}). New total: ${totalPts}`
      : `Bonus points added: ${additionalBonus}. New total: ${totalPts}`;

    await query(`
      UPDATE tasks 
      SET bonus_points = $1, 
          remarks = CASE WHEN remarks IS NULL OR remarks = '' THEN $2 ELSE remarks || ' | ' || $3 END
      WHERE id = $4
    `, [newBonus, bonusRemark, bonusRemark, taskId]);

    return getTaskById(taskId);
  } catch (error) {
    console.error('Error adding bonus points:', error);
    return { error: 'Server error' };
  }
}

export async function endTaskWithoutPoints(taskId, status = 'failed', remarks = 'Task ended without points') {
  try {
    await query(`
      UPDATE tasks 
      SET status = $1, remarks = $2, points = 0, bonus_points = 0
      WHERE id = $3
    `, [status, remarks, taskId]);
    return { success: true };
  } catch (error) {
    console.error('Error ending task:', error);
    return { error: 'Server error' };
  }
}

export async function submitTaskForReview(taskId, remarks) {
  try {
    const taskRes = await query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskRes.rows.length === 0) return { error: 'Task not found' };

    await query(`
      UPDATE tasks 
      SET status = 'to_be_reviewed', 
          remarks = CASE WHEN remarks IS NULL OR remarks = '' THEN $1 ELSE remarks || ' | ' || $2 END
      WHERE id = $3
    `, [remarks, remarks, taskId]);

    return { success: true };
  } catch (error) {
    console.error('Error submitting task:', error);
    return { error: 'Server error' };
  }
}
