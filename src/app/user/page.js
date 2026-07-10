'use client';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { logout } from '@/app/actions/auth';
import { useAuth } from '@/components/AuthProvider';
import { 
  LogOut, ClipboardList, Trophy, User as UserIcon, Calendar, MessageSquare, AlertCircle, PlayCircle, Send, CheckCircle2, Clock, Crown, Medal, Star, Gift, Shield
} from 'lucide-react';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { getUserTasks, submitTaskForReview } from '../actions/tasks';
import { getLeaderboard, updateUserAvailability } from '../actions/users';

import { useUserTasks, useLeaderboard } from '@/lib/hooks';

export default function UserDashboard() {
  const router = useRouter();
  const { user, refreshUser, broadcastAuthChange, isLoading: isAuthLoading } = useAuth();
  
  const { tasks, isLoading: tasksLoading, mutateUserTasks } = useUserTasks(user?.id);
  const { leaderboard, isLoading: leaderboardLoading, mutateLeaderboard } = useLeaderboard();
  
  const [activeTab, setActiveTab] = useState('myTasks');

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user || user.role !== 'user') {
        router.push('/login');
        return;
      }
    }
  }, [router, user, isAuthLoading]);

  const loadAllData = async (userId) => {
    mutateUserTasks();
    mutateLeaderboard();
  };

  const handleLogout = async () => {
    await logout();
    await refreshUser();
    broadcastAuthChange();
    router.push('/login');
  };

  const handleAvailabilityChange = async (newStatus) => {
    if (newStatus === 'unavailable') {
      setPendingAvailability(newStatus);
      setAvailabilityModalOpen(true);
      return;
    }
    await processAvailabilityChange(newStatus);
  };

  const processAvailabilityChange = async (newStatus) => {
    const res = await updateUserAvailability(user.id, newStatus);
    if (res.error) {
      toast.error(res.error);
    } else {
      await refreshUser();
      broadcastAuthChange();
      toast.success(`Availability updated to ${newStatus}`);
    }
  };

  // Submit Task Feature
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitForm, setSubmitForm] = useState({ taskId: '', remarks: '' });
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [pendingAvailability, setPendingAvailability] = useState(null);


  const handleSubmitTask = async (e) => {
    e.preventDefault();
    const res = await submitTaskForReview(submitForm.taskId, submitForm.remarks || 'Task submitted for review by user');
    if (res.error) toast.error(res.error);
    else {
      toast.success('Task submitted for review successfully!');
      setSubmitModalOpen(false);
      loadAllData(user.id);
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'assigned':
        return { label: 'Active', bg: 'bg-indigo-100', text: 'text-indigo-700', icon: PlayCircle };
      case 'to_be_reviewed':
        return { label: 'Under Review', bg: 'bg-purple-100', text: 'text-purple-700', icon: Clock };
      case 'completed':
        return { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 };
      case 'failed':
        return { label: 'Ended', bg: 'bg-rose-50', text: 'text-rose-700', icon: AlertCircle };
      default:
        return { label: status, bg: 'bg-slate-100', text: 'text-slate-600', icon: ClipboardList };
    }
  };

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative font-sans text-slate-800" style={{ background: '#f8fafc' }}>
      <div className="user-bg opacity-30"></div>

      {/* Premium Glassmorphic Header */}
      <div className="px-4 md:px-8 pt-4 md:pt-8 max-w-[1400px] mx-auto w-full relative z-20">
        <header className="flex flex-row items-center justify-between bg-white/60 backdrop-blur-xl p-4 md:px-6 rounded-[24px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center text-slate-800 text-lg md:text-xl font-black tracking-tight">
            <UserIcon className="w-5 h-5 md:w-6 md:h-6 mr-2 text-indigo-600" />
            <span>User Portal</span>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex items-center text-sm">
              <span className="font-bold text-slate-800 mr-2 md:mr-3">{user.username}</span>
              <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider border border-indigo-100/50">
                {user.category || 'No Category'}
              </span>
            </div>

            <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>

            <button 
              onClick={handleLogout}
              className="flex items-center justify-center p-2 rounded-xl transition-all duration-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600"
              title="Logout"
            >
              <LogOut className="w-5 h-5 md:w-[18px] md:h-[18px]" />
            </button>
          </div>
        </header>
      </div>

      <div className="max-w-[1400px] mx-auto p-4 md:p-8 relative z-10">
        {/* Top Controls: Tabs (Center) & Availability (Right) */}
        <div className="mb-10 flex flex-col md:flex-row items-center justify-between relative gap-6 md:gap-0">
          
          {/* Spacer for perfect centering on desktop */}
          <div className="hidden md:block w-[320px]"></div>

          {/* Tab System */}
          <div className="flex bg-white/50 p-1.5 rounded-2xl backdrop-blur-xl shadow-sm border border-slate-200 gap-2 w-full md:w-auto max-w-sm mx-auto md:mx-0">
            {[
              { id: 'myTasks', icon: ClipboardList, label: 'My Tasks' },
              { id: 'leaderboard', icon: Crown, label: 'Leaderboard' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex justify-center items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 tracking-wide ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-transparent text-slate-600 hover:bg-white hover:text-indigo-600'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          {/* Availability Toggle */}
          <div className="w-full md:w-[320px] flex justify-center md:justify-end">
            <div className="flex items-center bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200 gap-4 transition-all duration-300 hover:border-indigo-300 hover:shadow-md">
              <label className="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${user.availability === 'available' ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400'}`}></div>
                Status
              </label>
              <Select 
                value={user.availability} 
                onValueChange={handleAvailabilityChange}
              >
                <SelectTrigger className="px-4 py-2 h-auto justify-between gap-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800 cursor-pointer transition-all outline-none focus-visible:border-indigo-500 focus-visible:bg-white min-w-[150px] text-sm">
                  <SelectValue placeholder="Availability">
                    {user.availability === 'available' ? 'Available' : 'Unavailable'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border border-slate-100 shadow-xl rounded-xl z-[60]">
                  <SelectItem value="available" className="cursor-pointer font-medium py-2 rounded-lg">Available</SelectItem>
                  <SelectItem value="unavailable" className="cursor-pointer font-medium py-2 rounded-lg">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

          <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-5 md:p-8 lg:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-slate-200/60 animate-[slideUp_0.3s_ease-out]">
            
            {/* My Tasks Tab */}
            {activeTab === 'myTasks' && (
              <div>
                <div className="text-3xl font-bold text-slate-800 mb-8 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 tracking-tight text-center md:text-left">
                  <ClipboardList className="w-8 h-8 text-indigo-600" /> Active Assignments
                </div>

                {tasks.length === 0 ? (
                  <div className="text-center py-20 px-8 bg-slate-50 border border-slate-200 rounded-[24px]">
                    <ClipboardList className="w-16 h-16 mx-auto mb-5 text-indigo-200" />
                    <h3 className="text-2xl font-bold text-slate-700 mb-2 tracking-tight">No Tasks Assigned</h3>
                    <p className="text-slate-500 font-medium max-w-md mx-auto">You don't have any tasks right now. Make sure your status is set to Available.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {tasks.map(task => {
                      const statusInfo = getStatusDisplay(task.status);
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <div key={task.id} className="bg-white rounded-[20px] p-6 md:p-8 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 relative group">
                          
                          <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-5">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{task.title}</h3>
                                <span className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider">
                                  {task.category || 'General'}
                                </span>
                              </div>
                              <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-3xl whitespace-pre-wrap">{task.description}</p>
                            </div>
                            
                            <div className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-[11px] uppercase tracking-wider ${statusInfo.bg} ${statusInfo.text} border border-slate-200/50`}>
                              <StatusIcon className="w-3.5 h-3.5" /> {statusInfo.label}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-6 pt-5 border-t border-slate-100">
                            {/* Assigned Date */}
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <div className="text-sm font-medium text-slate-600">
                                <span className="text-slate-400 mr-1">Assigned:</span> 
                                {new Date(task.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            </div>
                            
                            {/* Reward */}
                            <div className="flex items-center gap-2">
                              <Trophy className={`w-4 h-4 ${task.status === 'completed' ? 'text-indigo-500' : 'text-slate-400'}`} />
                              <div className={`text-sm font-medium ${task.status === 'completed' ? 'text-indigo-600' : 'text-slate-600'}`}>
                                <span className="text-slate-400 mr-1">Reward:</span> 
                                {task.status === 'completed' 
                                  ? (task.bonus_points > 0 ? `${task.total_points} pts` : `${task.points} pts`) 
                                  : `${task.points} pts`}
                              </div>
                            </div>
                          </div>

                          {task.remarks && (
                            <div className="mt-5 p-4 rounded-r-xl rounded-l-sm bg-slate-50 border-l-2 border-indigo-400">
                              <p className="text-sm text-slate-700"><strong className="font-semibold text-slate-900">Remarks:</strong> {task.remarks}</p>
                            </div>
                          )}

                          {task.status === 'assigned' && (
                            <div className="mt-6 flex justify-end">
                              <button 
                                onClick={() => { setSubmitForm({ taskId: task.id, remarks: '' }); setSubmitModalOpen(true); }}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
                              >
                                <Send className="w-4 h-4" /> Submit Task
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <div>
                <div className="text-3xl font-bold text-slate-800 mb-8 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 tracking-tight text-center md:text-left">
                  <Crown className="w-8 h-8 text-indigo-600" /> Team Leaderboard
                </div>

                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-5 font-bold text-slate-500 text-xs uppercase tracking-wider"><div className="flex items-center gap-2"><Medal className="w-4 h-4 text-indigo-400"/> Rank</div></th>
                          <th className="p-5 font-bold text-slate-500 text-xs uppercase tracking-wider"><div className="flex items-center gap-2"><UserIcon className="w-4 h-4 text-indigo-400"/> Member</div></th>
                          <th className="p-5 font-bold text-slate-500 text-xs uppercase tracking-wider"><div className="flex items-center gap-2"><Star className="w-4 h-4 text-indigo-400"/> Total Score</div></th>
                          <th className="p-5 font-bold text-slate-500 text-xs uppercase tracking-wider"><div className="flex items-center gap-2"><Gift className="w-4 h-4 text-indigo-400"/> Bonus Points</div></th>
                          <th className="p-5 font-bold text-slate-500 text-xs uppercase tracking-wider"><div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400"/> Completed</div></th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.length === 0 ? (
                          <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium">No data available.</td></tr>
                        ) : (
                          leaderboard.map((u, i) => {
                            const isCurrentUser = u.id.toString() === user.id.toString();
                            
                            let className = "border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0";
                            if (isCurrentUser) {
                              className = "bg-indigo-50/50 border-l-4 border-l-indigo-500 border-b border-slate-100 hover:bg-indigo-50";
                            }

                            let rankBadgeClass = "inline-flex items-center justify-center w-8 h-8 rounded-full font-bold shadow-sm ";
                            if (i === 0) { rankBadgeClass += "bg-indigo-600 text-white shadow-indigo-200"; }
                            else if (i === 1) { rankBadgeClass += "bg-indigo-400 text-white"; }
                            else if (i === 2) { rankBadgeClass += "bg-indigo-300 text-white"; }
                            else { rankBadgeClass += "bg-slate-100 text-slate-500"; }

                            return (
                              <tr key={u.id} className={className}>
                                <td className="p-5">
                                  <span className={rankBadgeClass}>{i + 1}</span>
                                </td>
                                <td className="p-5 font-bold text-slate-800">
                                  {u.username} {isCurrentUser && <span className="ml-2 text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">You</span>}
                                </td>
                                <td className="p-5 font-black text-indigo-600 text-xl">{u.totalScore}</td>
                                <td className="p-5 text-purple-600 font-bold">{u.bonusPoints}</td>
                                <td className="p-5 text-slate-600 font-medium">{u.completedTasks} tasks</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>

      
      {/* Availability Confirm Modal */}
      <Dialog open={availabilityModalOpen} onOpenChange={setAvailabilityModalOpen}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border border-slate-100 shadow-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-800 text-center mb-2">Set Status to Unavailable?</DialogTitle>
          </DialogHeader>
          <div className="text-center text-slate-600 mb-6">
            Are you sure you want to set your status to Unavailable? You will not be assigned new tasks while unavailable.
          </div>
          <DialogFooter className="flex sm:justify-center gap-3">
            <button 
              onClick={() => {
                setAvailabilityModalOpen(false);
                setPendingAvailability(null);
              }}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                setAvailabilityModalOpen(false);
                processAvailabilityChange(pendingAvailability);
              }}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Confirm
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Task Modal */}
      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-800 font-bold tracking-tight text-xl"><Send className="w-5 h-5 text-indigo-500" /> Submit Assignment</DialogTitle>
            <DialogDescription className="font-medium text-slate-500">Send your work to the admin for review.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTask} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="font-bold text-slate-600 uppercase tracking-wider text-xs">Remarks (Optional)</Label>
              <Textarea 
                rows={6} 
                placeholder="Add any notes about your completed work..." 
                value={submitForm.remarks} 
                onChange={e => setSubmitForm({...submitForm, remarks: e.target.value})} 
                className="resize-y border-2 border-slate-200 rounded-xl focus-visible:ring-indigo-500 font-medium break-all whitespace-pre-wrap"
              />
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
              <button type="button" onClick={() => setSubmitModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">Cancel</button>
              <button type="submit" className="w-full sm:w-auto px-6 py-2.5 text-white rounded-xl font-bold shadow-md hover:-translate-y-0.5 transition-all bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2">
                Submit <Send className="w-3.5 h-3.5" />
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
