'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState({ id: '', username: '', category: '', availability: 'available' });
  const [tasks, setTasks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('myTasks');

  useEffect(() => {
    const role = sessionStorage.getItem('role');
    const id = sessionStorage.getItem('userId');
    const username = sessionStorage.getItem('username');
    const category = sessionStorage.getItem('category');
    const availability = sessionStorage.getItem('availability') || 'available';
    
    if (!role || role !== 'user') {
      router.push('/');
      return;
    }
    setUser({ id, username, category, availability });
    loadAllData(id);
  }, [router]);

  const loadAllData = async (userId) => {
    const [tasksRes, leaderboardRes] = await Promise.all([
      getUserTasks(userId),
      getLeaderboard()
    ]);
    
    if (tasksRes.success) setTasks(tasksRes.tasks);
    if (leaderboardRes.success) setLeaderboard(leaderboardRes.users);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/');
  };

  const handleAvailabilityChange = async (newStatus) => {
    if (newStatus === 'unavailable') {
      if (!confirm('Are you sure you want to set your status to Unavailable? You will not be assigned new tasks while unavailable.')) {
        return;
      }
    }

    const res = await updateUserAvailability(user.id, newStatus);
    if (res.error) {
      toast.error(res.error);
    } else {
      setUser({ ...user, availability: newStatus });
      sessionStorage.setItem('availability', newStatus);
      toast.success(`Availability updated to ${newStatus}`);
    }
  };

  // Submit Task Feature
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitForm, setSubmitForm] = useState({ taskId: '', remarks: '' });

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

  return (
    <div className="min-h-screen relative font-sans text-slate-800" style={{ background: '#f8fafc' }}>
      <div className="user-bg opacity-30"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl border-b border-indigo-500/10 shadow-[0_4px_30px_rgba(0,0,0,0.05)]" style={{ background: 'linear-gradient(135deg, rgba(30,27,75,0.95) 0%, rgba(49,46,129,0.95) 100%)' }}>
        <div className="max-w-[1400px] mx-auto px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center text-white text-2xl font-bold tracking-tight">
            <UserIcon className="w-7 h-7 mr-3 text-indigo-400" />
            User Portal
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center bg-white/10 px-5 py-2.5 rounded-2xl backdrop-blur-md text-slate-200 font-medium border border-white/10">
              <Shield className="w-4 h-4 mr-2 text-indigo-300" />
              <span className="opacity-80 mr-1">Welcome,</span> <span className="font-bold text-white mr-2 tracking-wide">{user.username}</span> 
              <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 rounded-md text-xs font-bold uppercase tracking-wider border border-indigo-400/20">{user.category || 'No Category'}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center font-bold px-5 py-2.5 rounded-xl transition-all duration-300 hover:bg-white/10 border border-transparent hover:border-white/20 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Availability Banner */}
      <div className="bg-white/60 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_2px_15px_rgba(0,0,0,0.02)] py-5 flex justify-center items-center relative z-10">
        <div className="flex flex-col sm:flex-row items-center bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200 gap-4 transition-all duration-300 hover:border-indigo-300 hover:shadow-md">
          <label className="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wider">
            <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${user.availability === 'available' ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400'}`}></div>
            Status
          </label>
          <select 
            value={user.availability} 
            onChange={(e) => handleAvailabilityChange(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800 cursor-pointer transition-all focus:outline-none focus:border-indigo-500 focus:bg-white min-w-[140px] text-sm"
          >
            <option value="available">Available for Tasks</option>
            <option value="unavailable">Away / Unavailable</option>
          </select>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-8 relative z-10">
        {/* Tab System */}
        <div className="mb-10">
          <div className="flex bg-white/50 p-1.5 rounded-2xl backdrop-blur-xl shadow-sm border border-slate-200 gap-2 mb-8 max-w-sm mx-auto">
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

          <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-8 lg:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-slate-200/60 animate-[slideUp_0.3s_ease-out]">
            
            {/* My Tasks Tab */}
            {activeTab === 'myTasks' && (
              <div>
                <div className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3 tracking-tight">
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
                        <div key={task.id} className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md relative overflow-hidden group">
                          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-500 opacity-80"></div>
                          
                          <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{task.title}</h3>
                                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider">
                                  {task.category || 'General'}
                                </span>
                              </div>
                            </div>
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider ${statusInfo.bg} ${statusInfo.text} border border-slate-200/50`}>
                              <StatusIcon className="w-4 h-4" /> {statusInfo.label}
                            </div>
                          </div>

                          <p className="text-slate-600 leading-relaxed mb-8 font-medium whitespace-pre-wrap">{task.description}</p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-indigo-500 shadow-sm">
                                <Calendar className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 text-sm uppercase tracking-wider">Assigned Date</div>
                                <div className="text-slate-500 font-medium">{new Date(task.created_at || Date.now()).toLocaleDateString()}</div>
                              </div>
                            </div>
                            
                            <div className={`flex items-center gap-4 p-5 rounded-2xl border ${task.status === 'completed' ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                              <div className={`w-10 h-10 rounded-full bg-white border ${task.status === 'completed' ? 'border-indigo-200 text-indigo-600 shadow-sm' : 'border-slate-200 text-slate-400 shadow-sm'} flex items-center justify-center`}>
                                <Trophy className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 text-sm uppercase tracking-wider">Reward</div>
                                <div className={`font-bold ${task.status === 'completed' ? 'text-indigo-600' : 'text-slate-500'}`}>
                                  {task.status === 'completed' 
                                    ? (task.bonus_points > 0 ? `${task.total_points} pts (${task.points} + ${task.bonus_points} bonus)` : `${task.points} pts`) 
                                    : `${task.points} pts (Pending)`}
                                </div>
                              </div>
                            </div>
                          </div>

                          {task.remarks && (
                            <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 mt-4">
                              <strong className="flex items-center gap-2 text-purple-800 mb-2 text-sm uppercase tracking-wider font-bold"><MessageSquare className="w-4 h-4" /> Admin Feedback</strong>
                              <p className="text-purple-900/80 font-medium">{task.remarks}</p>
                            </div>
                          )}

                          {task.status === 'assigned' && (
                            <div className="text-right mt-8 border-t border-slate-100 pt-6">
                              <button 
                                onClick={() => { setSubmitForm({ taskId: task.id, remarks: '' }); setSubmitModalOpen(true); }}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:-translate-y-0.5 shadow-md hover:shadow-lg bg-indigo-600 hover:bg-indigo-700"
                              >
                                <Send className="w-4 h-4" /> Submit for Review
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
                <div className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3 tracking-tight">
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
                            
                            // Row styling based on position and current user
                            let className = "border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0";
                            if (isCurrentUser) {
                              className = "bg-indigo-50/50 border-l-4 border-l-indigo-500 border-b border-slate-100 hover:bg-indigo-50";
                            }

                            // Rank badge styling
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
      </div>

      {/* Submit Task Modal */}
      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-800 font-bold tracking-tight text-xl"><Send className="w-5 h-5 text-indigo-500" /> Submit Assignment</DialogTitle>
            <DialogDescription className="font-medium text-slate-500">Send your work to the admin for review.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTask} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="font-bold text-slate-600 uppercase tracking-wider text-xs">Remarks (Optional)</Label>
              <Textarea 
                rows={4} 
                placeholder="Add any notes about your completed work..." 
                value={submitForm.remarks} 
                onChange={e => setSubmitForm({...submitForm, remarks: e.target.value})} 
                className="resize-y border-2 border-slate-200 rounded-xl focus-visible:ring-indigo-500 font-medium"
              />
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setSubmitModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2.5 text-white rounded-xl font-bold shadow-md hover:-translate-y-0.5 transition-all bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
                Submit <Send className="w-3.5 h-3.5" />
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
