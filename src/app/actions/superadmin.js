'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

export async function checkSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return { error: 'Not authenticated' };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'superadmin') {
      return { error: 'Access denied. Master Admin only.' };
    }
    return { user: decoded };
  } catch (error) {
    return { error: 'Invalid token' };
  }
}

export async function getSuperAdminDashboardStats() {
  const auth = await checkSuperAdmin();
  if (auth.error) return auth;

  try {
    const orgsRaw = await prisma.$queryRaw`
      SELECT o.id, o.name, COUNT(u.id) as member_count 
      FROM organizations o 
      LEFT JOIN users u ON o.id = u.organization_id 
      GROUP BY o.id, o.name
      ORDER BY member_count DESC
    `;
    
    const organizations = orgsRaw.map(org => ({
      id: org.id,
      name: org.name,
      member_count: Number(org.member_count)
    }));

    const totalOrgs = organizations.length;
    const totalMembers = organizations.reduce((sum, row) => sum + row.member_count, 0);
    
    return {
      stats: { totalOrgs, totalMembers },
      organizations
    };
  } catch (e) {
    console.error('Superadmin query error:', e);
    return { error: 'Failed to fetch platform metrics' };
  }
}
