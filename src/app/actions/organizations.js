'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';

export async function getOrgCategories() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.organization_id) throw new Error('Unauthorized');

    const org = await prisma.organization.findUnique({
      where: { id: user.organization_id },
      select: { categories: true }
    });

    return { success: true, categories: org?.categories || [] };
  } catch (error) {
    console.error('Error fetching org categories:', error);
    return { error: 'Failed to fetch categories' };
  }
}

export async function updateOrgCategories(categories) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.organization_id || user.role !== 'admin') {
       throw new Error('Unauthorized');
    }

    const org = await prisma.organization.update({
      where: { id: user.organization_id },
      data: { categories }
    });

    return { success: true, categories: org.categories };
  } catch (error) {
    console.error('Error updating org categories:', error);
    return { error: 'Failed to update categories' };
  }
}
