'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSuperAdminDashboardStats } from '@/app/actions/superadmin';
import { logout } from '@/app/actions/auth';
import { Loader2, LogOut, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function MasterAdminDashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const res = await getSuperAdminDashboardStats();
      if (res.error) {
        toast.error(res.error);
        router.push('/ops-internal-portal');
      } else {
        setData(res);
      }
      setIsLoading(false);
    }
    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.push('/ops-internal-portal');
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center border border-indigo-100">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Master Administration</h1>
              <p className="text-slate-500 text-sm">Overview of all active organizations</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors font-medium text-sm shadow-sm"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <div className="text-sm font-medium text-slate-500 mb-1">Total Organizations</div>
            <div className="text-3xl font-bold text-slate-800">{data?.stats?.totalOrgs || 0}</div>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <div className="text-sm font-medium text-slate-500 mb-1">Total Users</div>
            <div className="text-3xl font-bold text-slate-800">{data?.stats?.totalMembers || 0}</div>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <div className="text-sm font-medium text-slate-500 mb-1">System Status</div>
            <div className="text-lg font-bold text-emerald-600 mt-2 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Healthy
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-base font-semibold text-slate-800">Organization Directory</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Organization Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Active Members</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data?.organizations?.map(org => (
                  <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">#{org.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{org.name}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {org.member_count}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data?.organizations || data.organizations.length === 0) && (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-slate-500 text-sm">No organizations found in the database.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
