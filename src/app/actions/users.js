'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from './auth';
import { z } from 'zod';

const createUserSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.string().optional().default('user'),
  category: z.string().optional().nullable()
});

const updateUserAvailabilitySchema = z.object({
  userId: z.number().int(),
  availability: z.enum(['available', 'unavailable'])
});

const updateUserPasswordSchema = z.object({
  userId: z.number().int(),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

async function getOrgId() {
  const user = await getCurrentUser();
  if (!user || !user.organization_id) throw new Error('Unauthorized');
  return user.organization_id;
}

export async function getUsers() {
  try {
    const orgId = await getOrgId();
    
    // For raw aggregations, Prisma raw queries or grouped finds can be used.
    // However, since we need LEFT JOIN aggregations with COALESCE, Prisma raw query is the cleanest way here.
    const usersRaw = await prisma.$queryRaw`
      SELECT 
        u.id, 
        u.username, 
        u.role, 
        u.availability, 
        u.category,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.points ELSE 0 END), 0) as "basePoints",
        COALESCE(SUM(t.bonus_points), 0) as "bonusPoints",
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.points ELSE 0 END), 0) + COALESCE(SUM(t.bonus_points), 0) as "totalScore",
        COUNT(CASE WHEN t.status IN ('assigned', 'to_be_reviewed') THEN 1 END) as "activeTasks"
      FROM users u 
      LEFT JOIN tasks t ON u.id = t.assigned_user_id 
      WHERE u.organization_id = ${orgId}
      GROUP BY u.id
      ORDER BY "totalScore" DESC, "bonusPoints" DESC
    `;
    
    return { 
      success: true, 
      users: usersRaw.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        availability: u.availability,
        category: u.category,
        basePoints: Number(u.basePoints ?? u.basepoints ?? 0),
        bonusPoints: Number(u.bonusPoints ?? u.bonuspoints ?? 0),
        totalScore: Number(u.totalScore ?? u.totalscore ?? 0),
        active_tasks: Number(u.activeTasks ?? u.activetasks ?? 0)
      })) 
    };
  } catch (error) {
    console.error('Error getting users:', error);
    return { error: error.message === 'Unauthorized' ? 'Unauthorized' : 'Server error' };
  }
}

export async function getLeaderboard() {
  try {
    const orgId = await getOrgId();
    const usersRaw = await prisma.$queryRaw`
      SELECT 
        u.id, 
        u.username, 
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.points ELSE 0 END), 0) as "basePoints",
        COALESCE(SUM(t.bonus_points), 0) as "bonusPoints",
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.points ELSE 0 END), 0) + COALESCE(SUM(t.bonus_points), 0) as "totalScore",
        COALESCE(COUNT(CASE WHEN t.status = 'completed' THEN 1 END), 0) as "completedTasks"
      FROM users u 
      LEFT JOIN tasks t ON u.id = t.assigned_user_id 
      WHERE u.role = 'user' AND u.organization_id = ${orgId}
      GROUP BY u.id
      ORDER BY "totalScore" DESC, "bonusPoints" DESC
    `;
    
    return { 
      success: true, 
      users: usersRaw.map(u => ({
        id: u.id,
        username: u.username,
        basePoints: Number(u.basePoints ?? u.basepoints ?? 0),
        bonusPoints: Number(u.bonusPoints ?? u.bonuspoints ?? 0),
        totalScore: Number(u.totalScore ?? u.totalscore ?? 0),
        completedTasks: Number(u.completedTasks ?? u.completedtasks ?? 0)
      })) 
    };
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return { error: error.message === 'Unauthorized' ? 'Unauthorized' : 'Server error' };
  }
}



export async function createUser(username, password, role, category) {
  try {
    const orgId = await getOrgId();
    
    const parsed = createUserSchema.safeParse({ username, password, role, category });
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }
    
    const data = parsed.data;
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        role: data.role,
        category: data.category,
        organization_id: orgId
      },
      select: {
        id: true,
        username: true,
        role: true,
        category: true,
        availability: true
      }
    });
    
    return { success: true, user };
  } catch (error) {
    if (error.code === 'P2002') {
      return { error: 'Username already exists' };
    }
    console.error('Error creating user:', error);
    return { error: error.message === 'Unauthorized' ? 'Unauthorized' : 'Server error' };
  }
}

export async function updateUserAvailability(userId, availability) {
  try {
    const orgId = await getOrgId();
    
    const parsed = updateUserAvailabilitySchema.safeParse({ userId, availability });
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }
    
    const data = parsed.data;

    const res = await prisma.user.updateMany({
      where: { id: data.userId, organization_id: orgId },
      data: { availability: data.availability }
    });

    if (res.count === 0) return { error: 'User not found' };
    return { success: true };
  } catch (error) {
    console.error('Error updating availability:', error);
    return { error: error.message === 'Unauthorized' ? 'Unauthorized' : 'Server error' };
  }
}

export async function updateUserPassword(userId, password) {
  try {
    const orgId = await getOrgId();
    
    const parsed = updateUserPasswordSchema.safeParse({ userId, password });
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }
    
    const data = parsed.data;
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const res = await prisma.user.updateMany({
      where: { id: data.userId, organization_id: orgId },
      data: { password: hashedPassword }
    });

    if (res.count === 0) return { error: 'User not found' };
    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    return { error: error.message === 'Unauthorized' ? 'Unauthorized' : 'Server error' };
  }
}

export async function getDashboardStats() {
  try {
    const orgId = await getOrgId();
    
    const [totalTasks, activeUsers, pendingReview] = await Promise.all([
      prisma.task.count({ where: { organization_id: orgId } }),
      prisma.user.count({ where: { role: 'user', availability: 'available', organization_id: orgId } }),
      prisma.task.count({ where: { status: 'to_be_reviewed', organization_id: orgId } })
    ]);

    return {
      success: true,
      stats: { totalTasks, activeUsers, pendingReview }
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return { error: error.message === 'Unauthorized' ? 'Unauthorized' : 'Server error' };
  }
}
