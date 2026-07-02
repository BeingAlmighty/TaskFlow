'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';
import { toast } from 'sonner';
import { Loader2, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function MasterAdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await login(username, password);
      if (res.error) {
        toast.error(res.error);
        setIsLoading(false);
      } else {
        if (res.user.role === 'superadmin') {
          toast.success('Master access granted.');
          router.push('/ops-internal-portal/dashboard');
        } else {
          toast.error('Access Denied.');
          setIsLoading(false);
        }
      }
    } catch (e) {
      toast.error('Connection failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200">
            <Shield className="w-6 h-6 text-slate-700" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Master Administration</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <Input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-white border-slate-300 text-slate-900 h-10 focus-visible:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <Input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white border-slate-300 text-slate-900 h-10 focus-visible:ring-indigo-500"
            />
          </div>
          <button 
            disabled={isLoading}
            type="submit" 
            className="w-full h-10 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
