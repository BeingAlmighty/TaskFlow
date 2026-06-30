'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, changePasswordWithOld } from '@/app/actions/auth';
import { toast } from 'sonner';
import { ListTodo, Users, TrendingUp, Trophy, User, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const router = useRouter();

  // Change Password Modal States
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [cpUsername, setCpUsername] = useState('');
  const [cpOldPassword, setCpOldPassword] = useState('');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpConfirmPassword, setCpConfirmPassword] = useState('');
  
  const [showCpOldPassword, setShowCpOldPassword] = useState(false);
  const [showCpNewPassword, setShowCpNewPassword] = useState(false);
  const [showCpConfirmPassword, setShowCpConfirmPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await login(username, password);
      
      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      toast.success('Login successful');
      
      sessionStorage.setItem('role', result.user.role);
      sessionStorage.setItem('userId', result.user.id);
      sessionStorage.setItem('username', result.user.username);
      sessionStorage.setItem('category', result.user.category || '');
      sessionStorage.setItem('availability', result.user.availability || 'available');
      
      if (result.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/user');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (cpNewPassword !== cpConfirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changePasswordWithOld(cpUsername, cpOldPassword, cpNewPassword);
      if (result.error) {
        toast.error(result.error);
        setIsChangingPassword(false);
        return;
      }
      
      toast.success('Password changed successfully! You can now log in.');
      setChangePasswordModalOpen(false);
      setCpUsername('');
      setCpOldPassword('');
      setCpNewPassword('');
      setCpConfirmPassword('');
      setShowCpOldPassword(false);
      setShowCpNewPassword(false);
      setShowCpConfirmPassword(false);
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleModalClose = (open) => {
    setChangePasswordModalOpen(open);
    if (!open) {
      // Clear sensitive fields when modal closes
      setCpOldPassword('');
      setCpNewPassword('');
      setCpConfirmPassword('');
      setShowCpOldPassword(false);
      setShowCpNewPassword(false);
      setShowCpConfirmPassword(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden font-sans" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
      <div className="bg-shapes">
        <div className="absolute w-full h-full pointer-events-none opacity-50">
          <div className="absolute bg-indigo-400/10 rounded-full animate-[float_20s_infinite_linear] blur-xl" style={{ width: '300px', height: '300px', top: '10%', left: '5%' }}></div>
          <div className="absolute bg-purple-400/10 rounded-full animate-[float_25s_infinite_linear] blur-xl" style={{ width: '400px', height: '400px', top: '40%', right: '5%', animationDelay: '-5s' }}></div>
          <div className="absolute bg-blue-400/10 rounded-full animate-[float_20s_infinite_linear] blur-xl" style={{ width: '250px', height: '250px', bottom: '10%', left: '15%', animationDelay: '-10s' }}></div>
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-5">
        <div className="flex flex-col md:flex-row w-full max-w-[1100px] min-h-[600px] bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden animate-[slideUp_0.8s_ease-out] border border-white/20">
          
          {/* Left Side */}
          <div className="flex-1 relative flex flex-col justify-center items-center text-white p-12 md:p-16 text-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)' }}>
            <div className="absolute inset-0 opacity-20" style={{ background: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 400 400\"><defs><linearGradient id=\"grad1\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\"><stop offset=\"0%\" style=\"stop-color:rgba(255,255,255,0.1);stop-opacity:1\" /><stop offset=\"100%\" style=\"stop-color:rgba(255,255,255,0);stop-opacity:1\" /></linearGradient></defs><circle cx=\"100\" cy=\"100\" r=\"50\" fill=\"url(%23grad1)\"/><circle cx=\"300\" cy=\"150\" r=\"30\" fill=\"rgba(255,255,255,0.1)\"/><circle cx=\"150\" cy=\"300\" r=\"40\" fill=\"rgba(255,255,255,0.05)\"/></svg>')" }}></div>
            
            <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
              <div className="mb-8 p-5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] animate-[pulse-dot_3s_infinite]">
                <ListTodo size={48} className="text-indigo-100" />
              </div>
              <h1 className="text-5xl font-bold mb-4 tracking-tight" style={{ background: 'linear-gradient(45deg, #fff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                TaskFlow
              </h1>
              <p className="text-lg opacity-80 mb-10 font-light tracking-wide text-indigo-100">Premium Task Management</p>
              
              <div className="text-left w-full max-w-[280px] space-y-6">
                <div className="flex items-center opacity-0 animate-[slideInLeft_0.6s_ease-out_forwards]" style={{ animationDelay: '0.2s' }}>
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-4 border border-white/10">
                    <Users className="text-indigo-200 w-5 h-5" />
                  </div>
                  <span className="font-medium tracking-wide">Team Collaboration</span>
                </div>
                <div className="flex items-center opacity-0 animate-[slideInLeft_0.6s_ease-out_forwards]" style={{ animationDelay: '0.4s' }}>
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-4 border border-white/10">
                    <TrendingUp className="text-indigo-200 w-5 h-5" />
                  </div>
                  <span className="font-medium tracking-wide">Progress Tracking</span>
                </div>
                <div className="flex items-center opacity-0 animate-[slideInLeft_0.6s_ease-out_forwards]" style={{ animationDelay: '0.6s' }}>
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-4 border border-white/10">
                    <Trophy className="text-indigo-200 w-5 h-5" />
                  </div>
                  <span className="font-medium tracking-wide">Performance Analytics</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side */}
          <div className="flex-1 p-10 md:p-16 flex flex-col justify-center bg-white relative">
            <div className="w-full max-w-[380px] mx-auto relative z-10">
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Welcome Back</h2>
                <p className="text-slate-500 font-medium">Sign in to your account to continue</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="relative group">
                  <label className="block mb-2 text-slate-600 font-semibold text-sm uppercase tracking-wider">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 z-10 transition-colors group-focus-within:text-indigo-600" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="Enter your username"
                      className="w-full py-4 pl-12 pr-4 border-2 border-slate-100 rounded-2xl text-base transition-all duration-300 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(79,70,229,0.1)] outline-none font-medium text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="relative group">
                  <label className="block mb-2 text-slate-600 font-semibold text-sm uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 z-10 transition-colors group-focus-within:text-indigo-600" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="Enter your password"
                      className="w-full py-4 pl-12 pr-12 border-2 border-slate-100 rounded-2xl text-base transition-all duration-300 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(79,70,229,0.1)] outline-none font-medium text-slate-800 placeholder:text-slate-400"
                    />
                    <button 
                      type="button"
                      tabIndex="-1"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                    >
                      {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => setChangePasswordModalOpen(true)}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Forgot / Change Password?
                  </button>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full mt-8 py-4 px-4 text-white rounded-2xl text-base font-bold transition-all duration-300 relative overflow-hidden flex justify-center items-center group disabled:opacity-80 tracking-wide"
                  style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)' }}
                >
                  <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-500 group-hover:left-full"></div>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      <Dialog open={changePasswordModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-800">Change Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePasswordSubmit} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="font-semibold text-slate-600 uppercase tracking-wider text-xs">Username</Label>
              <Input 
                required 
                value={cpUsername} 
                onChange={e => setCpUsername(e.target.value)} 
                disabled={isChangingPassword}
                className="py-6 border-2 border-slate-200 rounded-xl focus-visible:ring-indigo-500 font-medium" 
                placeholder="Enter your username"
              />
            </div>
            
            <div className="space-y-2 relative">
              <Label className="font-semibold text-slate-600 uppercase tracking-wider text-xs">Old Password</Label>
              <div className="relative">
                <Input 
                  type={showCpOldPassword ? "text" : "password"} 
                  required 
                  value={cpOldPassword} 
                  onChange={e => setCpOldPassword(e.target.value)} 
                  disabled={isChangingPassword}
                  className="py-6 pr-10 border-2 border-slate-200 rounded-xl focus-visible:ring-indigo-500 font-medium" 
                  placeholder="Enter current password"
                />
                <button type="button" tabIndex="-1" onClick={() => setShowCpOldPassword(!showCpOldPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                  {showCpOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2 relative">
              <Label className="font-semibold text-slate-600 uppercase tracking-wider text-xs">New Password</Label>
              <div className="relative">
                <Input 
                  type={showCpNewPassword ? "text" : "password"} 
                  required 
                  value={cpNewPassword} 
                  onChange={e => setCpNewPassword(e.target.value)} 
                  disabled={isChangingPassword}
                  className="py-6 pr-10 border-2 border-slate-200 rounded-xl focus-visible:ring-indigo-500 font-medium" 
                  placeholder="At least 8 characters"
                />
                <button type="button" tabIndex="-1" onClick={() => setShowCpNewPassword(!showCpNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                  {showCpNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2 relative">
              <Label className="font-semibold text-slate-600 uppercase tracking-wider text-xs">Confirm New Password</Label>
              <div className="relative">
                <Input 
                  type={showCpConfirmPassword ? "text" : "password"} 
                  required 
                  value={cpConfirmPassword} 
                  onChange={e => setCpConfirmPassword(e.target.value)} 
                  disabled={isChangingPassword}
                  className="py-6 pr-10 border-2 border-slate-200 rounded-xl focus-visible:ring-indigo-500 font-medium" 
                  placeholder="Type new password again"
                />
                <button type="button" tabIndex="-1" onClick={() => setShowCpConfirmPassword(!showCpConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                  {showCpConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <button 
                type="button" 
                disabled={isChangingPassword}
                onClick={() => handleModalClose(false)} 
                className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isChangingPassword}
                className="px-5 py-2.5 text-white rounded-xl font-bold shadow-md hover:-translate-y-0.5 transition-all bg-indigo-600 hover:bg-indigo-700 disabled:opacity-80 flex items-center gap-2"
              >
                {isChangingPassword ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
