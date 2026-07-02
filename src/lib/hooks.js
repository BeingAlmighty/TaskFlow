'use client';

import useSWR from 'swr';
import { getTasks, getUserTasks } from '@/app/actions/tasks';
import { getUsers, getLeaderboard, getDashboardStats } from '@/app/actions/users';

const actionFetcher = async (action, ...args) => {
  const res = await action(...args);
  if (res?.error) throw new Error(res.error);
  return res;
};

// Admin Dashboard Hooks
export function useTasks() {
  const { data, error, mutate } = useSWR('admin_tasks', () => actionFetcher(getTasks));
  return { 
    tasks: data?.tasks || [], 
    isLoading: !error && !data, 
    error, 
    mutateTasks: mutate 
  };
}

export function useUsers() {
  const { data, error, mutate } = useSWR('admin_users', () => actionFetcher(getUsers));
  return { 
    // Filter out the admin from the users list by default
    users: data?.users ? data.users.filter(u => u.role !== 'admin') : [], 
    isLoading: !error && !data, 
    error, 
    mutateUsers: mutate 
  };
}

export function useLeaderboard() {
  const { data, error, mutate } = useSWR('leaderboard', () => actionFetcher(getLeaderboard));
  return { 
    leaderboard: data?.users || [], 
    isLoading: !error && !data, 
    error, 
    mutateLeaderboard: mutate 
  };
}

export function useDashboardStats() {
  const { data, error, mutate } = useSWR('dashboard_stats', () => actionFetcher(getDashboardStats));
  return { 
    stats: data?.stats || { total: 0, completed: 0, pending: 0, in_progress: 0, points: 0 }, 
    isLoading: !error && !data, 
    error, 
    mutateStats: mutate 
  };
}

// User Dashboard Hooks
export function useUserTasks(userId) {
  const { data, error, mutate } = useSWR(
    userId ? ['user_tasks', userId] : null, 
    () => actionFetcher(getUserTasks, userId)
  );
  return { 
    tasks: data?.tasks || [], 
    isLoading: !error && !data, 
    error, 
    mutateUserTasks: mutate 
  };
}
