'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().nullable().optional(),
  points: z.number().int().min(0).nullable().optional(),
  assignedUserId: z.number().int().nullable().optional()
});

const bulkCreateTasksSchema = z.array(z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().nullable().optional(),
  points: z.number().int().min(0).nullable().optional(),
  assigned_user_id: z.number().int().nullable().optional()
}));

const assignPointsSchema = z.object({
  taskId: z.number().int(),
  points: z.number().int().min(0).max(100),
  bonusPoints: z.number().int().min(0).optional().default(0),
  remarks: z.string().optional().default('')
});

const addBonusPointsSchema = z.object({
  taskId: z.number().int(),
  bonusPoints: z.number().int().min(1),
  remarks: z.string().optional().default('')
});

const endTaskSchema = z.object({
  taskId: z.number().int(),
  status: z.string().optional().default('failed'),
  remarks: z.string().optional().default('Task ended without points')
});

const submitReviewSchema = z.object({
  taskId: z.number().int(),
  remarks: z.string().optional().default('')
});

async function getOrgId() {
  const user = await getCurrentUser();
  if (!user || !user.organization_id) throw new Error('Unauthorized');
  return user.organization_id;
}

export async function getTasks() {
  try {
    const orgId = await getOrgId();
    const tasks = await prisma.task.findMany({
      where: { organization_id: orgId },
      include: {
        assigned_user: {
          select: { username: true }
        }
      },
      orderBy: { id: 'desc' }
    });

    const formattedTasks = tasks.map(t => ({
      ...t,
      assignedUserName: t.assigned_user?.username || null,
      points: t.points || 0,
      bonus_points: t.bonus_points || 0,
      total_points: (t.points || 0) + (t.bonus_points || 0)
    }));
    
    return { success: true, tasks: formattedTasks };
  } catch (error) {
    console.error('Error getting tasks:', error);
    return { error: error.message === 'Unauthorized' ? 'Unauthorized' : 'Server error' };
  }
}

export async function getTaskById(taskId) {
  try {
    const orgId = await getOrgId();
    const task = await prisma.task.findFirst({
      where: { id: taskId, organization_id: orgId },
      include: {
        assigned_user: {
          select: { username: true }
        }
      }
    });
    
    if (!task) return { error: 'Task not found' };

    const formattedTask = {
      ...task,
      assignedUserName: task.assigned_user?.username || null,
      points: task.points || 0,
      bonus_points: task.bonus_points || 0,
      total_points: (task.points || 0) + (task.bonus_points || 0)
    };

    return { success: true, task: formattedTask };
  } catch (error) {
    console.error('Error getting task:', error);
    return { error: error.message === 'Unauthorized' ? 'Unauthorized' : 'Server error' };
  }
}

export async function getUserTasks(userId) {
  try {
    const orgId = await getOrgId();
    const tasks = await prisma.task.findMany({
      where: { assigned_user_id: userId, organization_id: orgId },
      orderBy: { id: 'desc' }
    });

    const formattedTasks = tasks.map(t => ({
      ...t,
      points: t.points || 0,
      bonus_points: t.bonus_points || 0,
      total_points: (t.points || 0) + (t.bonus_points || 0)
    }));

    return { success: true, tasks: formattedTasks };
  } catch (error) {
    console.error('Error getting user tasks:', error);
    return { error: error.message === 'Unauthorized' ? 'Unauthorized' : 'Server error' };
  }
}

export async function createTask(title, description, category, points, assignedUserId) {
  try {
    const orgId = await getOrgId();
    
    const parsed = createTaskSchema.safeParse({ title, description, category, points, assignedUserId });
    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }
    
    const data = parsed.data;

    if (data.assignedUserId) {
      const user = await prisma.user.findFirst({
        where: { id: data.assignedUserId, organization_id: orgId }
      });
      
      if (!user) return { error: 'User not found' };
      if (user.availability !== 'available') return { error: 'Cannot assign task to unavailable user.' };
      if (user.category !== data.category) return { error: 'User category does not match task category.' };
    }

    const status = data.assignedUserId ? 'assigned' : 'unassigned';
    
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category || null,
        assigned_user_id: data.assignedUserId || null,
        status,
        points: data.points || 0,
        bonus_points: 0,
        organization_id: orgId
      }
    });
    
    return getTaskById(task.id);
  } catch (error) {
    console.error('Error creating task:', error);
    return { error: error.message === 'Unauthorized' ? 'Unauthorized' : 'Server error' };
  }
}

export async function bulkCreateTasks(tasksData) {
  try {
    const orgId = await getOrgId();
    if (!tasksData || tasksData.length === 0) return { success: true };

    const parsed = bulkCreateTasksSchema.safeParse(tasksData);
    if (!parsed.success) {
      return { error: 'Invalid task data format' };
    }
    
    const tasks = parsed.data;

    const users = await prisma.user.findMany({
      where: { organization_id: orgId }
    });
    
    const usersMap = {};
    for (const u of users) {
      usersMap[u.id] = u;
    }

    const tasksToCreate = tasks.map(task => {
      let finalAssignedUserId = task.assigned_user_id;
      let finalStatus = task.assigned_user_id ? 'assigned' : 'unassigned';

      if (finalAssignedUserId) {
        const user = usersMap[finalAssignedUserId];
        if (!user || user.availability !== 'available' || user.category !== task.category) {
           finalAssignedUserId = null;
           finalStatus = 'unassigned';
        }
      }

      return {
        title: task.title,
        description: task.description,
        category: task.category || null,
        assigned_user_id: finalAssignedUserId || null,
        status: finalStatus,
        points: task.points || 0,
        bonus_points: 0,
        organization_id: orgId
      };
    });

    await prisma.task.createMany({
      data: tasksToCreate
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error in bulkCreateTasks:', error);
    return { error: error.message === 'Unauthorized' ? 'Unauthorized' : 'Server error' };
  }
}

export async function updateTask(taskId, title, description, category, points, assignedUserId) {
  try {
    const orgId = await getOrgId();
    
    const parsed = createTaskSchema.safeParse({ title, description, category, points, assignedUserId });
    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }
    
    const data = parsed.data;

    if (data.assignedUserId) {
      const user = await prisma.user.findFirst({
        where: { id: data.assignedUserId, organization_id: orgId }
      });
      
      if (!user) return { error: 'User not found' };
      if (user.availability !== 'available') return { error: 'Cannot assign task to unavailable user.' };
      if (user.category !== data.category) return { error: 'User category does not match task category.' };
    }

    const status = data.assignedUserId ? 'assigned' : 'unassigned';
    
    await prisma.task.updateMany({
      where: { id: taskId, organization_id: orgId },
      data: {
        title: data.title,
        description: data.description,
        category: data.category || null,
        points: data.points || 0,
        assigned_user_id: data.assignedUserId || null,
        status
      }
    });
    
    return getTaskById(taskId);
  } catch (error) {
    console.error('Error updating task:', error);
    return { error: error.message === 'Unauthorized' ? 'Unauthorized' : 'Server error' };
  }
}

export async function assignPoints(taskId, points, bonusPoints = 0, remarks = '') {
  try {
    const orgId = await getOrgId();
    
    const parsed = assignPointsSchema.safeParse({ 
      taskId, 
      points: parseInt(points), 
      bonusPoints: parseInt(bonusPoints) || 0, 
      remarks 
    });
    
    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }
    
    const data = parsed.data;

    const task = await prisma.task.findFirst({
      where: { id: data.taskId, organization_id: orgId }
    });
    
    if (!task) return { error: 'Task not found' };

    const finalRemarks = data.remarks || `Task completed with ${data.points} base points and ${data.bonusPoints} total bonus points`;
    const newRemarks = !task.remarks ? finalRemarks : `${task.remarks} | ${finalRemarks}`;

    await prisma.task.update({
      where: { id: task.id },
      data: {
        points: data.points,
        bonus_points: data.bonusPoints,
        remarks: newRemarks,
        status: 'completed'
      }
    });

    return getTaskById(data.taskId);
  } catch (error) {
    console.error('Error assigning points:', error);
    return { error: error.message === 'Unauthorized' ? 'Unauthorized' : 'Server error' };
  }
}

export async function addBonusPoints(taskId, bonusPoints, remarks = '') {
  try {
    const orgId = await getOrgId();
    
    const parsed = addBonusPointsSchema.safeParse({ 
      taskId, 
      bonusPoints: parseInt(bonusPoints), 
      remarks 
    });
    
    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }
    
    const data = parsed.data;

    const task = await prisma.task.findFirst({
      where: { id: data.taskId, organization_id: orgId }
    });
    
    if (!task) return { error: 'Task not found' };
    
    const currentBonus = task.bonus_points || 0;
    const newBonus = currentBonus + data.bonusPoints;
    const basePts = task.points || 0;
    const totalPts = basePts + newBonus;

    const bonusRemark = data.remarks 
      ? `Bonus points added: ${data.bonusPoints} (${data.remarks}). New total: ${totalPts}`
      : `Bonus points added: ${data.bonusPoints}. New total: ${totalPts}`;
      
    const newRemarks = !task.remarks ? bonusRemark : `${task.remarks} | ${bonusRemark}`;

    await prisma.task.update({
      where: { id: task.id },
      data: {
        bonus_points: newBonus,
        remarks: newRemarks
      }
    });

    return getTaskById(data.taskId);
  } catch (error) {
    console.error('Error adding bonus points:', error);
    return { error: error.message === 'Unauthorized' ? 'Unauthorized' : 'Server error' };
  }
}

export async function endTaskWithoutPoints(taskId, status = 'failed', remarks = 'Task ended without points') {
  try {
    const orgId = await getOrgId();
    
    const parsed = endTaskSchema.safeParse({ taskId, status, remarks });
    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }
    
    const data = parsed.data;

    const updateRes = await prisma.task.updateMany({
      where: { id: data.taskId, organization_id: orgId },
      data: {
        status: data.status,
        remarks: data.remarks,
        points: 0,
        bonus_points: 0
      }
    });

    if (updateRes.count === 0) return { error: 'Task not found' };
    return { success: true };
  } catch (error) {
    console.error('Error ending task:', error);
    return { error: error.message === 'Unauthorized' ? 'Unauthorized' : 'Server error' };
  }
}

export async function submitTaskForReview(taskId, remarks) {
  try {
    const orgId = await getOrgId();
    
    const parsed = submitReviewSchema.safeParse({ taskId, remarks });
    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }
    
    const data = parsed.data;

    const task = await prisma.task.findFirst({
      where: { id: data.taskId, organization_id: orgId }
    });
    
    if (!task) return { error: 'Task not found' };

    const newRemarks = !task.remarks ? data.remarks : `${task.remarks} | ${data.remarks}`;

    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: 'to_be_reviewed',
        remarks: newRemarks
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error submitting task:', error);
    return { error: error.message === 'Unauthorized' ? 'Unauthorized' : 'Server error' };
  }
}
