'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

// Zod Schemas
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

const changePasswordSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
}).refine(data => data.oldPassword !== data.newPassword, {
  message: "New password must be different from old password",
  path: ["newPassword"]
});

const registerOrgSchema = z.object({
  orgName: z.string().min(1, 'Organization name is required'),
  adminUsername: z.string().min(1, 'Admin username is required'),
  adminPassword: z.string().min(8, 'Admin password must be at least 8 characters long')
});

// In-memory rate limiter for login
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

function recordFailedAttempt(username, userAttempts) {
  userAttempts.count += 1;
  if (userAttempts.count >= MAX_ATTEMPTS) {
    userAttempts.lockoutUntil = Date.now() + LOCKOUT_MS;
  }
  loginAttempts.set(username, userAttempts);
  return { error: 'Invalid username or password' };
}

export async function login(username, password) {
  try {
    const parsed = loginSchema.safeParse({ username, password });
    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }

    const { username: validUsername, password: validPassword } = parsed.data;

    // Rate Limiting Check
    const userAttempts = loginAttempts.get(validUsername) || { count: 0, lockoutUntil: null };
    if (userAttempts.lockoutUntil && userAttempts.lockoutUntil > Date.now()) {
      const remainingMinutes = Math.ceil((userAttempts.lockoutUntil - Date.now()) / 60000);
      return { error: `Account locked due to too many failed attempts. Try again in ${remainingMinutes} minute(s).` };
    }

    const users = await prisma.user.findMany({
      where: { username: validUsername }
    });

    if (users.length === 0) {
      return recordFailedAttempt(validUsername, userAttempts);
    }

    let matchedUser = null;
    let needsPasswordUpgrade = false;

    for (const user of users) {
      let isMatch = false;
      if (user.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(validPassword, user.password);
      } else {
        isMatch = validPassword === user.password;
        if (isMatch) needsPasswordUpgrade = true;
      }
      
      if (isMatch) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return recordFailedAttempt(validUsername, userAttempts);
    }

    if (needsPasswordUpgrade) {
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(validPassword, salt);
        await prisma.user.update({
          where: { id: matchedUser.id },
          data: { password: hashedPassword }
        });
        console.log(`Upgraded password for user ID ${matchedUser.id} to bcrypt.`);
      } catch (upgradeError) {
        console.error('Failed to upgrade password to bcrypt:', upgradeError);
      }
    }
    
    // Successful login
    loginAttempts.delete(validUsername);

    const { password: _, ...userWithoutPassword } = matchedUser;

    // Create JWT token
    const token = jwt.sign(
      { 
        id: matchedUser.id, 
        username: matchedUser.username, 
        role: matchedUser.role, 
        category: matchedUser.category,
        organization_id: matchedUser.organization_id
      },
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
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        role: true,
        availability: true,
        category: true,
        organization_id: true
      }
    });
    return user || null;
  } catch (error) {
    return null;
  }
}

export async function changePasswordWithOld(username, oldPassword, newPassword) {
  try {
    const parsed = changePasswordSchema.safeParse({ username, oldPassword, newPassword });
    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }

    const { username: validUsername, oldPassword: validOldPassword, newPassword: validNewPassword } = parsed.data;

    const user = await prisma.user.findFirst({
      where: { username: validUsername }
    });

    if (!user) {
      return { error: 'User not found' };
    }

    // Verify old password
    let isMatch = false;
    if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$') || user.password.startsWith('$2y$')) {
      isMatch = await bcrypt.compare(validOldPassword, user.password);
    } else {
      isMatch = validOldPassword === user.password;
    }

    if (!isMatch) {
      return { error: 'Incorrect old password' };
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(validNewPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    });

    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    return { error: 'Server error: ' + (error.message || 'Unknown error') };
  }
}

export async function registerOrganization(orgName, adminUsername, adminPassword) {
  try {
    const parsed = registerOrgSchema.safeParse({ orgName, adminUsername, adminPassword });
    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }

    const { orgName: validOrgName, adminUsername: validAdminUsername, adminPassword: validAdminPassword } = parsed.data;

    const hashedPassword = await bcrypt.hash(validAdminPassword, 10);

    await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: validOrgName }
      });
      await tx.user.create({
        data: {
          username: validAdminUsername,
          password: hashedPassword,
          role: 'admin',
          organization_id: org.id
        }
      });
    });

    return { success: true, message: 'Organization created successfully' };
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'P2002') {
      return { error: 'Username already exists within this organization' };
    }
    return { error: 'Server error: ' + (error.message || 'Unknown error') };
  }
}
