'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, changePasswordWithOld, registerOrganization } from '@/app/actions/auth';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, User, Lock, Building, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/AuthProvider';

const TaskFlowLogo = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6H20V9.5H13.5V19H10.5V9.5H4V6Z" className="fill-indigo-600" />
  </svg>
);

const springTransition = {
  type: 'spring',
  stiffness: 220,
  damping: 25,
  mass: 0.8
};

const formContainerVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98, filter: 'blur(4px)' },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    filter: 'blur(0px)',
    transition: { 
      duration: 0.35, 
      ease: 'easeOut',
      staggerChildren: 0.06
    }
  },
  exit: { 
    opacity: 0, 
    y: -15, 
    scale: 0.98, 
    filter: 'blur(4px)', 
    pointerEvents: 'none',
    transition: { duration: 0.25, ease: 'easeIn' }
  }
};

const formItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

export default function LoginPage() {
  const { user, refreshUser, broadcastAuthChange, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user && !isAuthLoading) {
      if (user.role === 'admin') router.push('/admin');
      else router.push('/user');
    }
  }, [user, isAuthLoading, router]);

  // Global View State
  const [view, setView] = useState('login'); // 'login' | 'register'

  // Login States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

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

  // Registration States
  const [isRegisteringOrg, setIsRegisteringOrg] = useState(false);
  const [roOrgName, setRoOrgName] = useState('');
  const [roAdminUsername, setRoAdminUsername] = useState('');
  const [roAdminPassword, setRoAdminPassword] = useState('');
  const [showRoAdminPassword, setShowRoAdminPassword] = useState(false);
  const [roRoles, setRoRoles] = useState([]);
  const [newRole, setNewRole] = useState('');

  const handleAddRole = (e) => {
    e.preventDefault();
    if (newRole.trim() && !roRoles.includes(newRole.trim())) {
      setRoRoles([...roRoles, newRole.trim()]);
      setNewRole('');
    }
  };

  const handleRemoveRole = (roleToRemove) => {
    setRoRoles(roRoles.filter(role => role !== roleToRemove));
  };

  const handleRegisterOrg = async (e) => {
    e.preventDefault();
    setIsRegisteringOrg(true);
    
    try {
      const res = await registerOrganization(roOrgName, roAdminUsername, roAdminPassword, roRoles.join(','));
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message);
        setRoOrgName('');
        setRoAdminUsername('');
        setRoAdminPassword('');
        setRoRoles([]);
        setNewRole('');
        setUsername(roAdminUsername);
        setPassword(roAdminPassword);
        setView('login');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsRegisteringOrg(false);
    }
  };

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
      
      // Update global auth state and notify other tabs
      const freshUser = await refreshUser();
      broadcastAuthChange();
      
      if (freshUser?.role === 'admin') {
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
      setCpOldPassword('');
      setCpNewPassword('');
      setCpConfirmPassword('');
      setShowCpOldPassword(false);
      setShowCpNewPassword(false);
      setShowCpConfirmPassword(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      
      <motion.div 
        layout
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div 
        layout
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-300/20 rounded-full blur-[100px] pointer-events-none"
      />

      <div className={`w-full min-h-screen flex flex-col md:flex-row ${view === 'register' ? 'md:flex-row-reverse' : ''} overflow-hidden relative z-10`}>
        
        {/* BRANDING PANEL */}
        <motion.div 
          layout
          transition={springTransition}
          className="hidden md:flex w-full md:w-1/2 flex-shrink-0 flex-col items-center justify-center p-10 md:p-12 bg-indigo-600 text-white min-h-[340px] md:min-h-full shadow-2xl z-20"
        >
          <motion.div layout transition={springTransition} className="flex flex-col items-center text-center mt-2 md:mt-0 max-w-[340px]">
            {/* Logo Badge */}
            <motion.div layout layoutId="logo-badge" transition={springTransition} className="w-[84px] h-[84px] bg-white rounded-full flex items-center justify-center shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] mb-3">
              <TaskFlowLogo />
            </motion.div>
            <motion.span layout layoutId="brand-name" transition={springTransition} className="font-bold text-[20px] tracking-tight mb-10">
              TaskFlow
            </motion.span>

            <motion.div layout className="relative h-[48px] mb-4 w-full flex justify-center items-center">
              <AnimatePresence mode="wait">
                <motion.h1 
                  key={view === 'login' ? 'title-login' : 'title-register'}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.25 }}
                  className="absolute text-3xl md:text-4xl font-bold tracking-tight whitespace-nowrap"
                >
                  {view === 'login' ? 'Welcome Back!' : 'Create Organization'}
                </motion.h1>
              </AnimatePresence>
            </motion.div>

            <motion.div layout className="relative h-[72px] w-full flex justify-center items-start">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={view === 'login' ? 'sub-login' : 'sub-register'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute w-full text-indigo-100/90 text-[14px] md:text-[15px] leading-relaxed mx-auto text-center"
                >
                  {view === 'login' 
                    ? 'To stay connected with us please login with your personal info'
                    : 'Set up your workspace and invite your team to get started'
                  }
                </motion.p>
              </AnimatePresence>
            </motion.div>

            <motion.button 
              layout 
              layoutId="auth-cta"
              transition={springTransition}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.15)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView(view === 'login' ? 'register' : 'login')}
              className="hidden md:flex mt-12 px-12 h-[52px] items-center justify-center rounded-full border border-white/80 text-white font-medium bg-transparent transition-colors uppercase tracking-wide text-[13px]"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={view === 'login' ? 'btn-login' : 'btn-register'}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  {view === 'login' ? 'CREATE ORGANIZATION' : 'SIGN IN INSTEAD'}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* FORM PANEL */}
        <motion.div 
          layout
          transition={springTransition}
          className="flex-1 w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-8 md:p-12 z-10"
        >
          <div className="w-full max-w-[360px] relative">
            <AnimatePresence mode="wait">
              {view === 'login' ? (
                <motion.div
                  key="login-form"
                  variants={formContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full"
                >
                  {/* Form Header */}
                  <motion.div variants={formItemVariants} className="mb-10 text-center">
                    <h2 className="text-[34px] font-bold text-indigo-600 tracking-tight mb-2 capitalize">Sign In</h2>
                    <p className="text-[14px] text-slate-500 font-medium">Log in to your account to continue</p>
                  </motion.div>
                  
                  <form onSubmit={handleLogin} className="space-y-5">
                    
                    <motion.div variants={formItemVariants} className="relative">
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isLoading}
                        autoComplete="off"
                        placeholder=" "
                        className="peer w-full h-[54px] pl-12 pr-4 border-none rounded-full text-[15px] transition-all bg-slate-100/70 focus:bg-indigo-50 focus:ring-[3px] focus:ring-indigo-600/20 outline-none font-medium text-slate-900"
                      />
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-[18px] h-[18px] z-10 transition-colors peer-focus:text-indigo-600 pointer-events-none" />
                      <label
                        htmlFor="username"
                        className={`absolute bg-white px-2 rounded-full pointer-events-none transition-all duration-200 font-medium z-10
                          ${username ? 'top-[-8px] left-5 text-[12px] text-slate-500' : 'top-1/2 -translate-y-1/2 left-12 text-[14px] text-slate-400 !bg-transparent'}
                          peer-focus:top-[-8px] peer-focus:translate-y-0 peer-focus:left-5 peer-focus:text-[12px] peer-focus:text-indigo-600 peer-focus:!bg-white`}
                      >
                        Username
                      </label>
                    </motion.div>

                    <motion.div variants={formItemVariants} className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        autoComplete="new-password"
                        placeholder=" "
                        className="peer w-full h-[54px] pl-12 pr-12 border-none rounded-full text-[15px] transition-all bg-slate-100/70 focus:bg-indigo-50 focus:ring-[3px] focus:ring-indigo-600/20 outline-none font-medium text-slate-900"
                      />
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-[18px] h-[18px] z-10 transition-colors peer-focus:text-indigo-600 pointer-events-none" />
                      <label
                        htmlFor="password"
                        className={`absolute bg-white px-2 rounded-full pointer-events-none transition-all duration-200 font-medium z-10
                          ${password ? 'top-[-8px] left-5 text-[12px] text-slate-500' : 'top-1/2 -translate-y-1/2 left-12 text-[14px] text-slate-400 !bg-transparent'}
                          peer-focus:top-[-8px] peer-focus:translate-y-0 peer-focus:left-5 peer-focus:text-[12px] peer-focus:text-indigo-600 peer-focus:!bg-white`}
                      >
                        Password
                      </label>
                      <button 
                        type="button"
                        tabIndex="-1"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none z-10"
                      >
                        {showLoginPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </motion.div>

                    <motion.div variants={formItemVariants} className="flex justify-center mt-2 mb-6">
                      <button 
                        type="button" 
                        onClick={() => setChangePasswordModalOpen(true)}
                        className="text-[13px] font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                      >
                        Forgot your password?
                      </button>
                    </motion.div>

                    <motion.div variants={formItemVariants}>
                      <motion.button 
                        type="submit" 
                        disabled={isLoading}
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-full h-[54px] text-white rounded-full text-[15px] font-bold tracking-wide uppercase transition-all flex justify-center items-center disabled:opacity-80 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-[0_8px_16px_-4px_rgba(79,70,229,0.4)]"
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'LOG IN'}
                      </motion.button>
                    </motion.div>
                    
                    <motion.div variants={formItemVariants} className="flex justify-center mt-6 md:hidden">
                      <button 
                        type="button" 
                        onClick={() => setView('register')}
                        className="text-[13px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wide"
                      >
                        Create Organization
                      </button>
                    </motion.div>

                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="register-form"
                  variants={formContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full"
                >
                  {/* Form Header */}
                  <motion.div variants={formItemVariants} className="mb-10 text-center">
                    <h2 className="text-[34px] font-bold text-indigo-600 tracking-tight mb-2 capitalize">Register</h2>
                    <p className="text-[14px] text-slate-500 font-medium">Create a new tenant workspace</p>
                  </motion.div>
                  
                  <form onSubmit={handleRegisterOrg} className="space-y-5">
                    
                    <motion.div variants={formItemVariants} className="relative">
                      <input
                        type="text"
                        id="roOrgName"
                        value={roOrgName}
                        onChange={(e) => setRoOrgName(e.target.value)}
                        required
                        disabled={isRegisteringOrg}
                        placeholder=" "
                        className="peer w-full h-[54px] pl-12 pr-4 border-none rounded-full text-[15px] transition-all bg-slate-100/70 focus:bg-indigo-50 focus:ring-[3px] focus:ring-indigo-600/20 outline-none font-medium text-slate-900"
                      />
                      <Building className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-[18px] h-[18px] z-10 transition-colors peer-focus:text-indigo-600 pointer-events-none" />
                      <label
                        htmlFor="roOrgName"
                        className={`absolute bg-white px-2 rounded-full pointer-events-none transition-all duration-200 font-medium z-10
                          ${roOrgName ? 'top-[-8px] left-5 text-[12px] text-slate-500' : 'top-1/2 -translate-y-1/2 left-12 text-[14px] text-slate-400 !bg-transparent'}
                          peer-focus:top-[-8px] peer-focus:translate-y-0 peer-focus:left-5 peer-focus:text-[12px] peer-focus:text-indigo-600 peer-focus:!bg-white`}
                      >
                        Organization Name
                      </label>
                    </motion.div>

                    <motion.div variants={formItemVariants} className="relative">
                      <input
                        type="text"
                        id="roAdminUsername"
                        value={roAdminUsername}
                        onChange={(e) => setRoAdminUsername(e.target.value)}
                        required
                        disabled={isRegisteringOrg}
                        placeholder=" "
                        className="peer w-full h-[54px] pl-12 pr-4 border-none rounded-full text-[15px] transition-all bg-slate-100/70 focus:bg-indigo-50 focus:ring-[3px] focus:ring-indigo-600/20 outline-none font-medium text-slate-900"
                      />
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-[18px] h-[18px] z-10 transition-colors peer-focus:text-indigo-600 pointer-events-none" />
                      <label
                        htmlFor="roAdminUsername"
                        className={`absolute bg-white px-2 rounded-full pointer-events-none transition-all duration-200 font-medium z-10
                          ${roAdminUsername ? 'top-[-8px] left-5 text-[12px] text-slate-500' : 'top-1/2 -translate-y-1/2 left-12 text-[14px] text-slate-400 !bg-transparent'}
                          peer-focus:top-[-8px] peer-focus:translate-y-0 peer-focus:left-5 peer-focus:text-[12px] peer-focus:text-indigo-600 peer-focus:!bg-white`}
                      >
                        Admin Username
                      </label>
                    </motion.div>

                    <motion.div variants={formItemVariants} className="relative">
                      <input
                        type={showRoAdminPassword ? "text" : "password"}
                        id="roAdminPassword"
                        value={roAdminPassword}
                        onChange={(e) => setRoAdminPassword(e.target.value)}
                        required
                        disabled={isRegisteringOrg}
                        placeholder=" "
                        className="peer w-full h-[54px] pl-12 pr-12 border-none rounded-full text-[15px] transition-all bg-slate-100/70 focus:bg-indigo-50 focus:ring-[3px] focus:ring-indigo-600/20 outline-none font-medium text-slate-900"
                      />
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-[18px] h-[18px] z-10 transition-colors peer-focus:text-indigo-600 pointer-events-none" />
                      <label
                        htmlFor="roAdminPassword"
                        className={`absolute bg-white px-2 rounded-full pointer-events-none transition-all duration-200 font-medium z-10
                          ${roAdminPassword ? 'top-[-8px] left-5 text-[12px] text-slate-500' : 'top-1/2 -translate-y-1/2 left-12 text-[14px] text-slate-400 !bg-transparent'}
                          peer-focus:top-[-8px] peer-focus:translate-y-0 peer-focus:left-5 peer-focus:text-[12px] peer-focus:text-indigo-600 peer-focus:!bg-white`}
                      >
                        Admin Password
                      </label>
                      <button 
                        type="button"
                        tabIndex="-1"
                        onClick={() => setShowRoAdminPassword(!showRoAdminPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none z-10"
                      >
                        {showRoAdminPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </motion.div>

                    <motion.div variants={formItemVariants} className="space-y-3">
                      <div className="relative flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            id="newRole"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddRole(e);
                              }
                            }}
                            disabled={isRegisteringOrg}
                            placeholder=" "
                            className="peer w-full h-[54px] pl-12 pr-4 border-none rounded-full text-[15px] transition-all bg-slate-100/70 focus:bg-indigo-50 focus:ring-[3px] focus:ring-indigo-600/20 outline-none font-medium text-slate-900"
                          />
                          <Building className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-[18px] h-[18px] z-10 transition-colors peer-focus:text-indigo-600 pointer-events-none" />
                          <label
                            htmlFor="newRole"
                            className={`absolute bg-white px-2 rounded-full pointer-events-none transition-all duration-200 font-medium z-10
                              ${newRole ? 'top-[-8px] left-5 text-[12px] text-slate-500' : 'top-1/2 -translate-y-1/2 left-12 text-[14px] text-slate-400 !bg-transparent'}
                              peer-focus:top-[-8px] peer-focus:translate-y-0 peer-focus:left-5 peer-focus:text-[12px] peer-focus:text-indigo-600 peer-focus:!bg-white`}
                          >
                            Add Custom Role
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddRole}
                          disabled={!newRole.trim() || isRegisteringOrg}
                          className="w-[54px] h-[54px] bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-200 transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 px-1">
                        <AnimatePresence>
                          {roRoles.map((role) => (
                            <motion.div
                              key={role}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.2 }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[13px] font-medium rounded-full border border-indigo-100"
                            >
                              {role}
                              <button
                                type="button"
                                onClick={() => handleRemoveRole(role)}
                                disabled={isRegisteringOrg}
                                className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors disabled:opacity-50"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </motion.div>

                    <motion.div variants={formItemVariants} className="mt-8 pt-2">
                      <motion.button 
                        type="submit" 
                        disabled={isRegisteringOrg}
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-full h-[54px] text-white rounded-full text-[15px] font-bold tracking-wide uppercase transition-all flex justify-center items-center disabled:opacity-80 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-[0_8px_16px_-4px_rgba(79,70,229,0.4)]"
                      >
                        {isRegisteringOrg ? <Loader2 className="w-5 h-5 animate-spin" /> : 'REGISTER'}
                      </motion.button>
                    </motion.div>
                    
                    <motion.div variants={formItemVariants} className="flex justify-center mt-6 md:hidden">
                      <button 
                        type="button" 
                        onClick={() => setView('login')}
                        className="text-[13px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wide"
                      >
                        Sign in instead
                      </button>
                    </motion.div>

                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>

      {/* Change Password Modal */}
      <Dialog open={changePasswordModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[450px] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-bold tracking-tight text-slate-900">Change Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePasswordSubmit} className="space-y-6 mt-4">
            <div className="relative">
              <Input 
                id="cpUsername"
                required 
                value={cpUsername} 
                onChange={e => setCpUsername(e.target.value)} 
                disabled={isChangingPassword}
                placeholder=" "
                className="peer w-full h-[52px] px-4 border-none bg-slate-100/70 focus:bg-indigo-50 rounded-full text-[16px] transition-all focus:ring-[3px] focus:ring-indigo-600/20 outline-none font-medium text-slate-900" 
              />
              <label
                htmlFor="cpUsername"
                className={`absolute bg-white px-2 rounded-full pointer-events-none transition-all duration-200 font-medium z-10
                  ${cpUsername ? 'top-[-8px] left-4 text-[12px] text-slate-500' : 'top-1/2 -translate-y-1/2 left-4 text-[14px] text-slate-400 !bg-transparent'}
                  peer-focus:top-[-8px] peer-focus:translate-y-0 peer-focus:left-4 peer-focus:text-[12px] peer-focus:text-indigo-600 peer-focus:!bg-white`}
              >
                Username
              </label>
            </div>
            
            <div className="relative">
              <Input 
                type={showCpOldPassword ? "text" : "password"} 
                id="cpOldPassword"
                required 
                value={cpOldPassword} 
                onChange={e => setCpOldPassword(e.target.value)} 
                disabled={isChangingPassword}
                placeholder=" "
                className="peer w-full h-[52px] pl-4 pr-12 border-none bg-slate-100/70 focus:bg-indigo-50 rounded-full text-[16px] transition-all focus:ring-[3px] focus:ring-indigo-600/20 outline-none font-medium text-slate-900" 
              />
              <label
                htmlFor="cpOldPassword"
                className={`absolute bg-white px-2 rounded-full pointer-events-none transition-all duration-200 font-medium z-10
                  ${cpOldPassword ? 'top-[-8px] left-4 text-[12px] text-slate-500' : 'top-1/2 -translate-y-1/2 left-4 text-[14px] text-slate-400 !bg-transparent'}
                  peer-focus:top-[-8px] peer-focus:translate-y-0 peer-focus:left-4 peer-focus:text-[12px] peer-focus:text-indigo-600 peer-focus:!bg-white`}
              >
                Old Password
              </label>
              <button type="button" tabIndex="-1" onClick={() => setShowCpOldPassword(!showCpOldPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500 z-10">
                {showCpOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input 
                type={showCpNewPassword ? "text" : "password"} 
                id="cpNewPassword"
                required 
                value={cpNewPassword} 
                onChange={e => setCpNewPassword(e.target.value)} 
                disabled={isChangingPassword}
                placeholder=" "
                className="peer w-full h-[52px] pl-4 pr-12 border-none bg-slate-100/70 focus:bg-indigo-50 rounded-full text-[16px] transition-all focus:ring-[3px] focus:ring-indigo-600/20 outline-none font-medium text-slate-900" 
              />
              <label
                htmlFor="cpNewPassword"
                className={`absolute bg-white px-2 rounded-full pointer-events-none transition-all duration-200 font-medium z-10
                  ${cpNewPassword ? 'top-[-8px] left-4 text-[12px] text-slate-500' : 'top-1/2 -translate-y-1/2 left-4 text-[14px] text-slate-400 !bg-transparent'}
                  peer-focus:top-[-8px] peer-focus:translate-y-0 peer-focus:left-4 peer-focus:text-[12px] peer-focus:text-indigo-600 peer-focus:!bg-white`}
              >
                New Password
              </label>
              <button type="button" tabIndex="-1" onClick={() => setShowCpNewPassword(!showCpNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500 z-10">
                {showCpNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input 
                type={showCpConfirmPassword ? "text" : "password"} 
                id="cpConfirmPassword"
                required 
                value={cpConfirmPassword} 
                onChange={e => setCpConfirmPassword(e.target.value)} 
                disabled={isChangingPassword}
                placeholder=" "
                className="peer w-full h-[52px] pl-4 pr-12 border-none bg-slate-100/70 focus:bg-indigo-50 rounded-full text-[16px] transition-all focus:ring-[3px] focus:ring-indigo-600/20 outline-none font-medium text-slate-900" 
              />
              <label
                htmlFor="cpConfirmPassword"
                className={`absolute bg-white px-2 rounded-full pointer-events-none transition-all duration-200 font-medium z-10
                  ${cpConfirmPassword ? 'top-[-8px] left-4 text-[12px] text-slate-500' : 'top-1/2 -translate-y-1/2 left-4 text-[14px] text-slate-400 !bg-transparent'}
                  peer-focus:top-[-8px] peer-focus:translate-y-0 peer-focus:left-4 peer-focus:text-[12px] peer-focus:text-indigo-600 peer-focus:!bg-white`}
              >
                Confirm New Password
              </label>
              <button type="button" tabIndex="-1" onClick={() => setShowCpConfirmPassword(!showCpConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500 z-10">
                {showCpConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <DialogFooter className="mt-6">
              <button 
                type="button" 
                disabled={isChangingPassword}
                onClick={() => handleModalClose(false)} 
                className="h-[52px] px-6 rounded-full font-medium bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isChangingPassword}
                className="h-[52px] px-8 text-white rounded-full font-medium bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-80 flex items-center justify-center gap-2 shadow-[0_8px_16px_-4px_rgba(79,70,229,0.4)]"
              >
                {isChangingPassword ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating</> : 'Update Password'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
