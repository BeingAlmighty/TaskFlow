'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  ClipboardList, PlusCircle, Users, Trophy, Shield, LogOut, 
  Clock, CheckCircle2, AlertCircle, Eye, EyeOff, Key, Send, Edit, PlayCircle, Star, Sparkles
} from 'lucide-react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import { 
  getTasks, createTask, assignPoints, endTaskWithoutPoints, addBonusPoints, updateTask
} from '../actions/tasks';
import { 
  getUsers, createUser, getDashboardStats, updateUserPassword, updateUserAvailability, getLeaderboard
} from '../actions/users';

export default function AdminDashboard() {
  const router = useRouter();
  const [adminName, setAdminName] = useState('');
  const [activeTab, setActiveTab] = useState('taskBench');
  const [stats, setStats] = useState({ totalTasks: 0, activeUsers: 0, pendingReview: 0 });
  
  // Data states
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  // Filter states
  const [taskFilter, setTaskFilter] = useState('all');
  const [taskUserFilter, setTaskUserFilter] = useState('all');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState('all');
  
  const [userAvailabilityFilter, setUserAvailabilityFilter] = useState('all');
  const [userAssignmentFilter, setUserAssignmentFilter] = useState('all');

  // Form states
  const [createTaskForm, setCreateTaskForm] = useState({ title: '', category: 'Strategy and Growth', description: '', points: 10, assigned_to: '' });
  const [createUserForm, setCreateUserForm] = useState({ username: '', password: '', role: 'user', category: 'Strategy and Growth' });

  // Modal states
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showAdminChangePassword, setShowAdminChangePassword] = useState(false);

  const [editTaskModalOpen, setEditTaskModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);
  const [editTaskForm, setEditTaskForm] = useState({ title: '', description: '', category: 'Strategy and Growth', points: 10, assigned_to: '' });
  
  const [showCreateUserPassword, setShowCreateUserPassword] = useState(false);

  useEffect(() => {
    const role = sessionStorage.getItem('role');
    const storedUsername = sessionStorage.getItem('username');
    if (!role || role !== 'admin') {
      router.push('/');
      return;
    }
    setAdminName(storedUsername || 'Admin');
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    const [statsRes, tasksRes, usersRes, leaderboardRes] = await Promise.all([
      getDashboardStats(),
      getTasks(),
      getUsers(),
      getLeaderboard()
    ]);
    if (statsRes.success) setStats(statsRes.stats);
    if (tasksRes.success) setTasks(tasksRes.tasks);
    if (usersRes.success) setUsers(usersRes.users.filter(u => u.role !== 'admin'));
    if (leaderboardRes.success) setLeaderboard(leaderboardRes.users);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/');
  };

  // Task Filters
  const filteredTasks = tasks.filter(task => {
    const matchStatus = taskFilter === 'all' || task.status === taskFilter;
    const matchUser = taskUserFilter === 'all' || (task.assigned_user_id && task.assigned_user_id.toString() === taskUserFilter);
    const matchCategory = taskCategoryFilter === 'all' || task.category === taskCategoryFilter;
    return matchStatus && matchUser && matchCategory;
  });

  // User Filters
  const filteredUsers = users.filter(user => {
    const matchAvail = userAvailabilityFilter === 'all' || user.availability === userAvailabilityFilter;
    let matchAssign = true;
    if (userAssignmentFilter === 'assigned') matchAssign = user.active_tasks > 0;
    if (userAssignmentFilter === 'unassigned') matchAssign = user.active_tasks === 0;
    return matchAvail && matchAssign;
  });

  // Available Users for Assignment
  const availableUsersForTask = users.filter(u => u.availability === 'available' && u.category === createTaskForm.category);
  const availableUsersForEditTask = users.filter(u => u.availability === 'available' && u.category === editTaskForm.category);

  // Task Actions
  const handleCreateTask = async (e) => {
    e.preventDefault();
    const res = await createTask(createTaskForm.title, createTaskForm.description, createTaskForm.category, createTaskForm.points, createTaskForm.assigned_to);
    if (res.error) toast.error(res.error);
    else {
      toast.success('Task created successfully!');
      setCreateTaskForm({ title: '', category: 'Strategy and Growth', description: '', points: 10, assigned_to: '' });
      loadDashboardData();
      setActiveTab('taskBench');
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    const res = await updateTask(
      selectedTaskForEdit.id, 
      editTaskForm.title, 
      editTaskForm.description, 
      editTaskForm.category, 
      editTaskForm.points, 
      editTaskForm.assigned_to
    );
    if (res.error) toast.error(res.error);
    else {
      toast.success('Task updated successfully!');
      setEditTaskModalOpen(false);
      loadDashboardData();
    }
  };

  const handleCompleteTask = async (taskId) => {
    const basePoints = tasks.find(t => t.id === taskId)?.points || 0;
    const input = prompt(`Enter bonus points (0-50). Base points: ${basePoints}`, '0');
    if (input === null) return;
    const bonus = parseInt(input) || 0;
    
    const res = await assignPoints(taskId, basePoints, bonus, 'Admin verified task');
    if (res.error) toast.error(res.error);
    else {
      toast.success('Task marked as completed!');
      loadDashboardData();
    }
  };

  const handleEndTask = async (taskId) => {
    if (!confirm('Are you sure you want to end this task? It will be marked as failed (0 points).')) return;
    const res = await endTaskWithoutPoints(taskId, 'failed', 'Ended by admin');
    if (res.error) toast.error(res.error);
    else {
      toast.success('Task ended (failed).');
      loadDashboardData();
    }
  };

  const handleAwardBonus = async (taskId) => {
    const input = prompt('Enter additional bonus points to award:', '0');
    if (input === null) return;
    const bonus = parseInt(input);
    if (isNaN(bonus) || bonus <= 0) return;

    const res = await addBonusPoints(taskId, bonus, 'Admin bonus');
    if (res.error) toast.error(res.error);
    else {
      toast.success(`Awarded ${bonus} bonus points!`);
      loadDashboardData();
    }
  };

  // User Actions
  const handleCreateUser = async (e) => {
    e.preventDefault();
    const res = await createUser(createUserForm.username, createUserForm.password, createUserForm.role, createUserForm.category);
    if (res.error) toast.error(res.error);
    else {
      toast.success('User created successfully!');
      setCreateUserForm({ username: '', password: '', role: 'user', category: 'Strategy and Growth' });
      loadDashboardData();
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const res = await updateUserPassword(selectedUserForPassword.id, newPassword);
    if (res.error) toast.error(res.error);
    else {
      toast.success('Password changed successfully!');
      setChangePasswordModalOpen(false);
      setNewPassword('');
      setShowAdminChangePassword(false);
    }
  };

  const handleToggleAvailability = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';
    const res = await updateUserAvailability(userId, newStatus);
    if (res.error) toast.error(res.error);
    else {
      toast.success(`User is now ${newStatus}`);
      loadDashboardData();
    }
  };

  const renderStatusBadge = (status) => {
    const statusMap = {
      'assigned': { bg: 'bg-indigo-100', color: 'text-indigo-700', border: 'border-indigo-200' },
      'to_be_reviewed': { bg: 'bg-purple-100', color: 'text-purple-700', border: 'border-purple-200', label: 'submitted' },
      'completed': { bg: 'bg-emerald-50', color: 'text-emerald-700', border: 'border-emerald-200' },
      'failed': { bg: 'bg-rose-50', color: 'text-rose-700', border: 'border-rose-200' },
      'unassigned': { bg: 'bg-slate-100', color: 'text-slate-600', border: 'border-slate-200' }
    };
    const s = statusMap[status] || statusMap['unassigned'];
    return (
      <span className={`${s.bg} ${s.color} border ${s.border} px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider`}>
        {s.label || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen relative font-sans text-slate-800" style={{ background: '#f8fafc' }}>
      <div className="admin-bg opacity-30"></div>

      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-2xl border-b border-indigo-500/10" style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.95) 0%, rgba(49,46,129,0.95) 100%)', color: 'white' }}>
        <div className="max-w-[1400px] mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center text-xl font-bold tracking-tight">
            <ClipboardList className="mr-3 w-6 h-6 text-indigo-300" />
            TaskFlow Admin
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 text-sm font-medium">
              <Shield className="w-4 h-4 mr-2 text-indigo-300" />
              <span>{adminName}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center text-sm font-medium px-4 py-2 rounded-xl transition-all duration-300 hover:bg-white/10 border border-transparent hover:border-white/20"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-8 relative z-10">
        
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(79,70,229,0.08)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</span>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100">
                <ClipboardList className="w-5 h-5" />
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">{stats.totalTasks}</div>
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1"><ClipboardList className="w-3 h-3"/> All tasks in system</div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(79,70,229,0.08)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Users</span>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 border border-purple-100">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">{stats.activeUsers}</div>
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Available for tasks</div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(79,70,229,0.08)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pending Review</span>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">{stats.pendingReview}</div>
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1"><Eye className="w-3 h-3"/> Awaiting review</div>
          </div>
        </div>

        {/* Tab System */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-white/50 backdrop-blur-xl border border-slate-200 rounded-2xl inline-flex shadow-sm">
            {[
              { id: 'taskBench', icon: ClipboardList, label: 'Task Bench' },
              { id: 'createTask', icon: PlusCircle, label: 'Create Task' },
              { id: 'userList', icon: Users, label: 'User Management' },
              { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-slate-200/60 animate-[fadeIn_0.3s_ease-in-out]">
            
            {/* Task Bench Tab */}
            {activeTab === 'taskBench' && (
              <div>
                <div className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 tracking-tight">
                  <ClipboardList className="text-indigo-600 w-6 h-6" /> Task Management Center
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <div>
                    <label className="block mb-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Filter by Status</label>
                    <select 
                      className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all font-medium text-slate-700"
                      value={taskFilter} onChange={e => setTaskFilter(e.target.value)}
                    >
                      <option value="all">All Tasks</option>
                      <option value="unassigned">Unassigned</option>
                      <option value="assigned">Assigned</option>
                      <option value="to_be_reviewed">Submitted (Pending Review)</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed/Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Filter by User</label>
                    <select 
                      className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all font-medium text-slate-700"
                      value={taskUserFilter} onChange={e => setTaskUserFilter(e.target.value)}
                    >
                      <option value="all">All Users</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Filter by Category</label>
                    <select 
                      className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all font-medium text-slate-700"
                      value={taskCategoryFilter} onChange={e => setTaskCategoryFilter(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      <option value="Strategy and Growth">Strategy and Growth</option>
                      <option value="Human Resource Management">Human Resource Management</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Content and Designing">Content and Designing</option>
                      <option value="Technical">Technical</option>
                      <option value="Expansion strategist">Expansion strategist</option>
                      <option value="Fund raising poc">Fund raising poc</option>
                      <option value="Legal compliance executive">Legal compliance executive</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <th className="p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Task Details</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Category</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Assigned To</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Status</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Points</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTasks.length === 0 ? (
                          <tr><td colSpan="6" className="p-8 text-center text-slate-500 font-medium">No tasks found matching your filters.</td></tr>
                        ) : (
                          filteredTasks.map(task => (
                            <tr key={task.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                              <td className="p-4">
                                <div className="font-bold text-slate-800">{task.title}</div>
                                <div className="text-sm text-slate-500 mt-1 max-w-xs truncate">{task.description}</div>
                              </td>
                              <td className="p-4 font-medium text-slate-600">{task.category}</td>
                              <td className="p-4">
                                {task.assigned_user_id ? (
                                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs border border-indigo-200">
                                      {task.assignedUserName?.charAt(0).toUpperCase()}
                                    </div>
                                    {task.assignedUserName}
                                  </div>
                                ) : <span className="text-slate-400 italic font-medium">Unassigned</span>}
                              </td>
                              <td className="p-4">{renderStatusBadge(task.status)}</td>
                              <td className="p-4">
                                <div className="font-bold text-slate-700">{task.points}</div>
                                {task.bonus_points > 0 && <div className="text-xs text-purple-600 font-bold">+{task.bonus_points} bonus</div>}
                              </td>
                              <td className="p-4">
                                <div className="flex flex-wrap gap-2">
                                  {['unassigned', 'assigned'].includes(task.status) && (
                                    <button 
                                      onClick={() => { 
                                        setSelectedTaskForEdit(task); 
                                        setEditTaskForm({ 
                                          title: task.title, 
                                          description: task.description, 
                                          category: task.category || 'Strategy and Growth',
                                          points: task.points, 
                                          assigned_to: task.assigned_user_id || '' 
                                        }); 
                                        setEditTaskModalOpen(true); 
                                      }}
                                      className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200"
                                    ><Edit className="w-3.5 h-3.5"/> Edit</button>
                                  )}
                                  {task.status === 'to_be_reviewed' && (
                                    <button 
                                      onClick={() => handleCompleteTask(task.id)}
                                      className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                                    ><CheckCircle2 className="w-3.5 h-3.5"/> Verify</button>
                                  )}
                                  {['assigned', 'to_be_reviewed'].includes(task.status) && (
                                    <button 
                                      onClick={() => handleEndTask(task.id)}
                                      className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 bg-white text-rose-600 hover:bg-rose-50 border border-rose-200"
                                    ><AlertCircle className="w-3.5 h-3.5"/> End</button>
                                  )}
                                  {task.status === 'completed' && (
                                    <button 
                                      onClick={() => handleAwardBonus(task.id)}
                                      className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200"
                                    ><Sparkles className="w-3.5 h-3.5"/> Bonus</button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Create Task Tab */}
            {activeTab === 'createTask' && (
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 tracking-tight">
                    <PlusCircle className="text-indigo-600 w-6 h-6" /> Create New Task
                  </div>
                  <form onSubmit={handleCreateTask} className="space-y-6">
                    <div>
                      <label className="block mb-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Task Title</label>
                      <input 
                        type="text" required value={createTaskForm.title} onChange={e => setCreateTaskForm({...createTaskForm, title: e.target.value})}
                        className="w-full p-3.5 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all font-medium text-slate-800"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block mb-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Category</label>
                        <select 
                          value={createTaskForm.category} onChange={e => setCreateTaskForm({...createTaskForm, category: e.target.value, assigned_to: ''})}
                          className="w-full p-3.5 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all font-medium text-slate-800"
                        >
                          <option value="Strategy and Growth">Strategy and Growth</option>
                          <option value="Human Resource Management">Human Resource Management</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Content and Designing">Content and Designing</option>
                          <option value="Technical">Technical</option>
                          <option value="Expansion strategist">Expansion strategist</option>
                          <option value="Fund raising poc">Fund raising poc</option>
                          <option value="Legal compliance executive">Legal compliance executive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Base Points</label>
                        <input 
                          type="number" min="1" max="100" required value={createTaskForm.points} onChange={e => setCreateTaskForm({...createTaskForm, points: e.target.value === '' ? '' : parseInt(e.target.value)})}
                          className="w-full p-3.5 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all font-medium text-slate-800"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Assign To (Must be available)</label>
                      <select 
                        value={createTaskForm.assigned_to} onChange={e => setCreateTaskForm({...createTaskForm, assigned_to: e.target.value})}
                        className="w-full p-3.5 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all font-medium text-slate-800"
                      >
                        <option value="">Leave Unassigned</option>
                        {availableUsersForTask.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                      </select>
                      {availableUsersForTask.length === 0 && <p className="text-xs font-semibold text-rose-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> No available users in this category.</p>}
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Description</label>
                      <textarea 
                        required rows="4" value={createTaskForm.description} onChange={e => setCreateTaskForm({...createTaskForm, description: e.target.value})}
                        className="w-full p-3.5 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all resize-y min-h-[120px] font-medium text-slate-800"
                      ></textarea>
                    </div>
                    <button 
                      type="submit" 
                      className="px-8 py-3.5 text-white rounded-xl font-bold hover:-translate-y-0.5 transition-all shadow-md hover:shadow-lg flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                    ><Send className="w-4 h-4"/> Publish Task</button>
                  </form>
                </div>

                <div className="lg:w-1/3 mt-8 lg:mt-0">
                  <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 sticky top-28">
                    <div className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                      <Sparkles className="text-indigo-500 w-5 h-5" /> Best Practices
                    </div>
                    <ul className="space-y-4 text-sm text-slate-700 font-medium">
                      <li className="flex gap-3"><div className="mt-0.5 text-indigo-500"><CheckCircle2 className="w-4 h-4"/></div> Be concise but descriptive in titles.</li>
                      <li className="flex gap-3"><div className="mt-0.5 text-indigo-500"><CheckCircle2 className="w-4 h-4"/></div> Ensure category matching so the right team sees it.</li>
                      <li className="flex gap-3"><div className="mt-0.5 text-indigo-500"><CheckCircle2 className="w-4 h-4"/></div> Base points should reflect complexity.</li>
                      <li className="flex gap-3"><div className="mt-0.5 text-indigo-500"><CheckCircle2 className="w-4 h-4"/></div> You can only assign to users currently marked as Available.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* User Management Tab */}
            {activeTab === 'userList' && (
              <div>
                <div className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 tracking-tight">
                  <Users className="text-indigo-600 w-6 h-6" /> Team Directory
                </div>

                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 mb-8">
                  <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider">Onboard New Member</h3>
                  <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input type="text" placeholder="Username" required value={createUserForm.username} onChange={e => setCreateUserForm({...createUserForm, username: e.target.value})} className="p-3 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 font-medium text-slate-800 transition-all"/>
                    
                    <div className="relative">
                      <input 
                        type={showCreateUserPassword ? "text" : "password"} 
                        placeholder="Password" 
                        required 
                        value={createUserForm.password} 
                        onChange={e => setCreateUserForm({...createUserForm, password: e.target.value})} 
                        className="w-full p-3 pr-10 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 font-medium text-slate-800 transition-all"
                      />
                      <button type="button" tabIndex="-1" onClick={() => setShowCreateUserPassword(!showCreateUserPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                        {showCreateUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <select value={createUserForm.category} onChange={e => setCreateUserForm({...createUserForm, category: e.target.value})} className="p-3 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 font-medium text-slate-800 transition-all">
                      <option value="Strategy and Growth">Strategy and Growth</option>
                      <option value="Human Resource Management">Human Resource Management</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Content and Designing">Content and Designing</option>
                      <option value="Technical">Technical</option>
                      <option value="Expansion strategist">Expansion strategist</option>
                      <option value="Fund raising poc">Fund raising poc</option>
                      <option value="Legal compliance executive">Legal compliance executive</option>
                    </select>
                    <button type="submit" className="text-white rounded-xl font-bold hover:-translate-y-0.5 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-700">
                      <PlusCircle className="w-4 h-4"/> Add Member
                    </button>
                  </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block mb-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Filter by Status</label>
                    <select className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 font-medium text-slate-700 transition-all" value={userAvailabilityFilter} onChange={e => setUserAvailabilityFilter(e.target.value)}>
                      <option value="all">All Statuses</option>
                      <option value="available">Available</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Filter by Workload</label>
                    <select className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 font-medium text-slate-700 transition-all" value={userAssignmentFilter} onChange={e => setUserAssignmentFilter(e.target.value)}>
                      <option value="all">All Members</option>
                      <option value="assigned">Currently Assigned</option>
                      <option value="unassigned">No Active Tasks</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <th className="p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Member</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Category</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Status</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Workload</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Management</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 ? (
                          <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium">No members found.</td></tr>
                        ) : (
                          filteredUsers.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                              <td className="p-4 font-bold text-slate-800">{u.username}</td>
                              <td className="p-4 font-medium text-slate-600">{u.category}</td>
                              <td className="p-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${u.availability === 'available' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                  {u.availability || 'unknown'}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.active_tasks > 0 ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'text-slate-500'}`}>
                                  {u.active_tasks} Active
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-wrap gap-2">
                                  <button 
                                    onClick={() => handleToggleAvailability(u.id, u.availability)}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50"
                                  ><PlayCircle className="w-3.5 h-3.5"/> Toggle</button>
                                  <button 
                                    onClick={() => { setSelectedUserForPassword(u); setChangePasswordModalOpen(true); }}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                                  ><Key className="w-3.5 h-3.5"/> Password</button>
                                  <button 
                                    onClick={() => { setTaskUserFilter(u.id.toString()); setActiveTab('taskBench'); }}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 bg-slate-800 text-white hover:bg-slate-700 shadow-sm"
                                  ><Eye className="w-3.5 h-3.5"/> Tasks</button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <div>
                <div className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 tracking-tight">
                  <Trophy className="text-indigo-600 w-6 h-6" /> Performance Rankings
                </div>

                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <th className="p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Rank</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Member</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Total Score</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Bonus Points</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.length === 0 ? (
                          <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium">No performance data available.</td></tr>
                        ) : (
                          leaderboard.map((u, i) => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                              <td className="p-4">
                                {i === 0 ? <span className="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold bg-indigo-600 text-white shadow-md shadow-indigo-200">1</span> :
                                 i === 1 ? <span className="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold bg-indigo-400 text-white">2</span> :
                                 i === 2 ? <span className="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold bg-indigo-300 text-white">3</span> :
                                 <span className="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold bg-slate-100 text-slate-500">{i + 1}</span>}
                              </td>
                              <td className="p-4 font-bold text-slate-800">{u.username}</td>
                              <td className="p-4 font-black text-indigo-600 text-lg">{u.totalScore}</td>
                              <td className="p-4 text-purple-600 font-bold">{u.bonusPoints}</td>
                              <td className="p-4 text-slate-600 font-medium">{u.completedTasks} tasks</td>
                            </tr>
                          ))
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

      {/* Change Password Modal */}
      <Dialog open={changePasswordModalOpen} onOpenChange={(open) => { setChangePasswordModalOpen(open); if(!open) setShowAdminChangePassword(false); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-800">Update Credentials</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-6 mt-4">
            <div className="space-y-2 relative">
              <Label className="font-semibold text-slate-600 uppercase tracking-wider text-xs">New Password for {selectedUserForPassword?.username}</Label>
              <div className="relative">
                <Input 
                  type={showAdminChangePassword ? "text" : "password"} 
                  required 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  className="py-6 pr-10 border-2 border-slate-200 rounded-xl focus-visible:ring-indigo-500 font-medium" 
                />
                <button type="button" tabIndex="-1" onClick={() => setShowAdminChangePassword(!showAdminChangePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                  {showAdminChangePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setChangePasswordModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2.5 text-white rounded-xl font-bold shadow-md hover:-translate-y-0.5 transition-all bg-indigo-600 hover:bg-indigo-700">
                Update Password
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Modal */}
      <Dialog open={editTaskModalOpen} onOpenChange={setEditTaskModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-800">Edit Task Definition</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditTask} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="font-semibold text-slate-600 uppercase tracking-wider text-xs">Title</Label>
              <Input required value={editTaskForm.title} onChange={e => setEditTaskForm({...editTaskForm, title: e.target.value})} className="border-2 border-slate-200 rounded-xl focus-visible:ring-indigo-500 font-medium" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold text-slate-600 uppercase tracking-wider text-xs">Category</Label>
                <select 
                  value={editTaskForm.category} 
                  onChange={e => setEditTaskForm({...editTaskForm, category: e.target.value, assigned_to: ''})}
                  className="w-full p-2 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-500 font-medium text-slate-800"
                >
                  <option value="Strategy and Growth">Strategy and Growth</option>
                  <option value="Human Resource Management">Human Resource Management</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Content and Designing">Content and Designing</option>
                  <option value="Technical">Technical</option>
                  <option value="Expansion strategist">Expansion strategist</option>
                  <option value="Fund raising poc">Fund raising poc</option>
                  <option value="Legal compliance executive">Legal compliance executive</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-slate-600 uppercase tracking-wider text-xs">Base Points</Label>
                <Input type="number" required min="1" value={editTaskForm.points} onChange={e => setEditTaskForm({...editTaskForm, points: e.target.value === '' ? '' : parseInt(e.target.value)})} className="border-2 border-slate-200 rounded-xl focus-visible:ring-indigo-500 font-medium" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-slate-600 uppercase tracking-wider text-xs">Reallocate / Assign To</Label>
              <select 
                value={editTaskForm.assigned_to} 
                onChange={e => setEditTaskForm({...editTaskForm, assigned_to: e.target.value})}
                className="w-full p-2 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-500 font-medium text-slate-800"
              >
                <option value="">Leave Unassigned</option>
                {/* Include current user if they are assigned but not available, to avoid weird selections */}
                {selectedTaskForEdit?.assigned_user_id && !availableUsersForEditTask.find(u => u.id === selectedTaskForEdit.assigned_user_id) && (
                   <option value={selectedTaskForEdit.assigned_user_id}>
                     Current: {selectedTaskForEdit.assignedUserName}
                   </option>
                )}
                {availableUsersForEditTask.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-slate-600 uppercase tracking-wider text-xs">Description</Label>
              <textarea required className="w-full p-3 border-2 border-slate-200 rounded-xl min-h-[100px] outline-none focus:border-indigo-500 font-medium text-slate-800" value={editTaskForm.description} onChange={e => setEditTaskForm({...editTaskForm, description: e.target.value})}></textarea>
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setEditTaskModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2.5 text-white rounded-xl font-bold shadow-md hover:-translate-y-0.5 transition-all bg-indigo-600 hover:bg-indigo-700">
                Save Changes
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
