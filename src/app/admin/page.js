'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { logout } from '@/app/actions/auth';
import { useAuth } from '@/components/AuthProvider';
import { 
  ClipboardList, PlusCircle, Users, Trophy, Shield, LogOut, 
  Clock, CheckCircle2, AlertCircle, Eye, EyeOff, Key, Send, Edit, PlayCircle, Star, Sparkles, Menu, ChevronLeft, ChevronDown, Search, Bell, UploadCloud, FileSpreadsheet, X, User, MessageSquare
} from 'lucide-react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import AdminSidebar from '@/components/admin/AdminSidebar';

import { 
  getTasks, createTask, bulkCreateTasks, assignPoints, endTaskWithoutPoints, addBonusPoints, updateTask
} from '../actions/tasks';
import { 
  getUsers, createUser, getDashboardStats, updateUserPassword, updateUserAvailability, getLeaderboard
} from '../actions/users';
import { 
  useTasks, useUsers, useLeaderboard, useDashboardStats 
} from '@/lib/hooks';

// Utility for fuzzy matching
const levenshtein = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i][j - 1] + 1,
        matrix[i - 1][j] + 1,
        matrix[i - 1][j - 1] + indicator
      );
    }
  }
  return matrix[a.length][b.length];
};

const getClosestCategory = (inputCategory, validCategories) => {
  let closest = validCategories[0];
  let minDistance = Infinity;
  for (const cat of validCategories) {
    const dist = levenshtein(inputCategory.toLowerCase(), cat.toLowerCase());
    if (dist < minDistance) {
      minDistance = dist;
      closest = cat;
    }
  }
  return closest;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [adminName, setAdminName] = useState('');
  const [activeTab, setActiveTab] = useState('taskBench');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // SWR Hooks
  const { tasks, isLoading: tasksLoading, mutateTasks } = useTasks();
  const { users, isLoading: usersLoading, mutateUsers } = useUsers();
  const { leaderboard, isLoading: leaderboardLoading, mutateLeaderboard } = useLeaderboard();
  const { stats, isLoading: statsLoading, mutateStats } = useDashboardStats();

  // Filter states
  const [taskFilter, setTaskFilter] = useState('all');
  const [taskUserFilter, setTaskUserFilter] = useState('all');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState('all');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  
  const [userAvailabilityFilter, setUserAvailabilityFilter] = useState('all');
  const [userCategoryFilter, setUserCategoryFilter] = useState('all');

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
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyingTask, setVerifyingTask] = useState(null);
  const [verifyBonusPoints, setVerifyBonusPoints] = useState('');
  
  const [endTaskModalOpen, setEndTaskModalOpen] = useState(false);
  const [endingTask, setEndingTask] = useState(null);

  const { user, refreshUser, broadcastAuthChange, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/login');
        return;
      }
      setAdminName(user.username || 'Admin');
    }
  }, [router, user, isAuthLoading]);

  const loadDashboardData = async () => {
    mutateTasks();
    mutateUsers();
    mutateLeaderboard();
    mutateStats();
  };

  const handleLogout = async () => {
    await logout();
    await refreshUser();
    broadcastAuthChange();
    router.push('/login');
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
    const matchCategory = userCategoryFilter === 'all' || user.category === userCategoryFilter;
    return matchAvail && matchCategory;
  });

  // Available Users for Assignment
  const availableUsersForTask = users.filter(u => u.availability === 'available' && u.category === createTaskForm.category);
  const availableUsersForEditTask = users.filter(u => u.availability === 'available' && u.category === editTaskForm.category);

  // Task Actions

  const downloadTemplate = () => {
    const validCategories = [
      "Strategy and Growth",
      "Human Resource Management",
      "Marketing",
      "Content and Designing",
      "Technical",
      "Expansion strategist",
      "Fund raising poc",
      "Legal compliance executive"
    ];
    
    // Create worksheet data
    const wsData = [
      ["Title", "Description", "Category", "Points", "Username"],
      ["Example Task 1", "This is an example description", validCategories[0], "15", "anmol"],
      ["Example Task 2", "Another task description", validCategories[1], "20", "udit"]
    ];
    
    // Add categories list to the side so users can see them
    wsData[0].push("", "Available Categories (For Reference):");
    validCategories.forEach((cat, index) => {
      if (wsData[index + 1]) {
        wsData[index + 1].push("", cat);
      } else {
        const newRow = ["", "", "", "", "", "", cat];
        wsData.push(newRow);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    ws['!cols'] = [
      { wch: 20 }, // Title
      { wch: 30 }, // Description
      { wch: 25 }, // Category
      { wch: 10 }, // Points
      { wch: 15 }, // Username
      { wch: 5 },  // Spacer
      { wch: 30 }  // Available Categories
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Task_Import_Template.xlsx");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        let successCount = 0;
        const validCategories = [
          "Strategy and Growth",
          "Human Resource Management",
          "Marketing",
          "Content and Designing",
          "Technical",
          "Expansion strategist",
          "Fund raising poc",
          "Legal compliance executive"
        ];

        const newTasks = [];

        data.forEach((row) => {
          if (!row.Title) return;
          
          let assignedUserId = null;
          if (row.Username) {
            const foundUser = users.find(u => u.username.toLowerCase() === row.Username.toString().toLowerCase());
            if (foundUser && foundUser.availability === 'available') {
              assignedUserId = foundUser.id;
            }
          }

          const matchedCategory = row.Category ? getClosestCategory(row.Category.toString(), validCategories) : 'Strategy and Growth';

          newTasks.push({
            title: row.Title,
            description: row.Description || '',
            category: matchedCategory,
            assigned_user_id: assignedUserId,
            points: parseInt(row.Points) || 10
          });
          successCount++;
        });

        if (successCount > 0) {
          toast.loading("Importing tasks...");
          const res = await bulkCreateTasks(newTasks);
          toast.dismiss();
          
          if (res.error) {
            toast.error(res.error);
          } else {
            toast.success(`Successfully imported ${successCount} tasks!`);
            loadDashboardData();
            setActiveTab('taskBench');
          }
        } else {
          toast.error("No valid tasks found in the file.");
        }
      } catch (err) {
        toast.error("Failed to parse the file.");
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; // reset input
  };

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

  const handleCompleteTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setVerifyingTask(task);
      setVerifyBonusPoints('');
      setVerifyModalOpen(true);
    }
  };

  const submitVerification = async () => {
    if (!verifyingTask) return;
    const bonus = parseInt(verifyBonusPoints) || 0;
    
    const res = await assignPoints(verifyingTask.id, verifyingTask.points, bonus, 'Admin verified task');
    if (res.error) toast.error(res.error);
    else {
      toast.success('Task marked as completed!');
      setVerifyModalOpen(false);
      loadDashboardData();
    }
  };

  const handleEndTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setEndingTask(task);
      setEndTaskModalOpen(true);
    }
  };

  const submitEndTask = async () => {
    if (!endingTask) return;
    const res = await endTaskWithoutPoints(endingTask.id, 'failed', 'Ended by admin');
    if (res.error) toast.error(res.error);
    else {
      toast.success('Task ended (failed).');
      setEndTaskModalOpen(false);
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

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={cn("h-screen w-full flex flex-col md:flex-row bg-slate-50 overflow-hidden font-sans text-slate-800")}>
      
      {/* Sidebar Component */}
      <AdminSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminName={adminName}
        handleLogout={handleLogout}
      />

      {/* Main Dashboard Content */}
      <div className="flex flex-1 flex-col overflow-y-auto w-full relative pb-24 md:pb-0">
        <div className="admin-bg opacity-30 absolute inset-0 pointer-events-none"></div>
        
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full relative z-10">
          
          {/* Top Header */}
          <div className="flex flex-col mb-8 gap-5 bg-white/60 backdrop-blur-xl p-5 md:p-6 rounded-[24px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] items-center text-center">
            <div className="flex flex-col items-center justify-center w-full">
              <h1 className="text-2xl md:text-[28px] font-black text-slate-800 tracking-tight leading-tight">
                {activeTab === 'taskBench' ? 'Task Bench' : 
                 activeTab === 'userList' ? 'Team Directory' : 
                 activeTab === 'leaderboard' ? 'Leaderboard' : 
                 activeTab === 'createTask' ? 'Create Task' :
                 activeTab === 'bulkImport' ? 'Bulk Import' : 'Dashboard'}
              </h1>
              <p className="text-[13px] md:text-sm text-slate-500 mt-2 font-medium max-w-md">
                {activeTab === 'taskBench' ? 'Manage and track tasks across your workspace.' : 
                 activeTab === 'userList' ? 'Manage users and roles across your workspace.' : 
                 activeTab === 'leaderboard' ? 'View top performers and points.' : 
                 activeTab === 'bulkImport' ? 'Automate task creation via Excel.' : 'Create a new task for your workspace.'}
              </p>
            </div>
            
            <div className="flex items-center justify-center w-full mt-2 md:mt-0">
              {activeTab !== 'leaderboard' && (
              <div className="relative w-full md:w-auto group flex justify-center">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10" />
                <input 
                  type="text" 
                  placeholder={activeTab === 'userList' ? 'Search users...' : 'Search tasks...'} 
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  className="pl-12 pr-14 py-3.5 md:py-3 bg-white/80 border border-slate-200/80 rounded-2xl text-[14px] outline-none focus:bg-white focus:border-indigo-400 focus:ring-[4px] focus:ring-indigo-500/10 transition-all w-full md:w-[360px] shadow-sm placeholder:text-slate-400 font-medium text-slate-700"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 tracking-widest shadow-sm z-10">
                  ⌘K
                </div>
                
                {/* Search Results Dropdown */}
                {globalSearchQuery && (
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full md:w-[400px] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 max-h-[400px] flex flex-col">
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Search Results
                    </div>
                    <div className="overflow-y-auto p-2 flex-1">
                      {activeTab === 'userList' ? (
                        users.filter(u => u.username.toLowerCase().includes(globalSearchQuery.toLowerCase())).length > 0 ? (
                          users.filter(u => u.username.toLowerCase().includes(globalSearchQuery.toLowerCase())).map(user => (
                            <div key={user.id} className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-100 flex flex-col gap-1 mb-1">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">{user.username.charAt(0).toUpperCase()}</div>
                                  <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{user.username}</h4>
                                </div>
                                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wide">{user.role}</span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1">{user.category}</p>
                              <div className="mt-1 text-xs text-slate-400">
                                {user.availability === 'available' ? '🟢 Available' : '🔴 Unavailable'} • {user.active_tasks} active tasks
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-sm text-slate-500">
                            No users found for "{globalSearchQuery}"
                          </div>
                        )
                      ) : (
                        tasks.filter(t => t.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) || (t.description && t.description.toLowerCase().includes(globalSearchQuery.toLowerCase()))).length > 0 ? (
                          tasks.filter(t => t.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) || (t.description && t.description.toLowerCase().includes(globalSearchQuery.toLowerCase()))).map(task => {
                            const assignedUser = users.find(u => u.id === task.assigned_user_id);
                            return (
                              <div key={task.id} className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-100 flex flex-col gap-1 mb-1">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{task.title}</h4>
                                  <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wide">{task.status.replace(/_/g, ' ')}</span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2">{task.description || 'No description provided.'}</p>
                                {assignedUser && (
                                  <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                    <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">{assignedUser.username.charAt(0).toUpperCase()}</div>
                                    {assignedUser.username}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-8 text-center text-sm text-slate-500">
                            No tasks found for "{globalSearchQuery}"
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 shadow-sm border border-slate-200/70 flex items-center gap-4 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500">Total Tasks</div>
                <div className="text-2xl font-bold text-slate-800 leading-tight tracking-tight">{stats.totalTasks}</div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 shadow-sm border border-slate-200/70 flex items-center gap-4 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500">Active Users</div>
                <div className="text-2xl font-bold text-slate-800 leading-tight tracking-tight">{stats.activeUsers}</div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 shadow-sm border border-slate-200/70 flex items-center gap-4 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-50 text-amber-600 border border-amber-100/50">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500">Pending Review</div>
                <div className="text-2xl font-bold text-slate-800 leading-tight tracking-tight">{stats.pendingReview}</div>
              </div>
            </div>
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
                    <Select value={taskFilter} onValueChange={setTaskFilter}>
                      <SelectTrigger className="w-full p-3 h-auto justify-center gap-2 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus-visible:border-indigo-500 focus-visible:ring-[3px] focus-visible:ring-indigo-500/10 transition-all font-medium text-slate-700">
                        <SelectValue placeholder="All Tasks">
                          {taskFilter === 'all' ? 'All Tasks' : 
                           taskFilter === 'unassigned' ? 'Unassigned' :
                           taskFilter === 'assigned' ? 'Assigned' :
                           taskFilter === 'to_be_reviewed' ? 'Submitted (Pending Review)' :
                           taskFilter === 'completed' ? 'Completed' :
                           taskFilter === 'failed' ? 'Failed/Cancelled' : 'All Tasks'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white/80 backdrop-blur-xl border border-slate-100 shadow-xl rounded-xl">
                        <SelectItem value="all" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">All Tasks</SelectItem>
                        <SelectItem value="unassigned" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Unassigned</SelectItem>
                        <SelectItem value="assigned" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Assigned</SelectItem>
                        <SelectItem value="to_be_reviewed" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Submitted (Pending Review)</SelectItem>
                        <SelectItem value="completed" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Completed</SelectItem>
                        <SelectItem value="failed" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Failed/Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Filter by User</label>
                    <Select value={taskUserFilter} onValueChange={setTaskUserFilter}>
                      <SelectTrigger className="w-full p-3 h-auto justify-center gap-2 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus-visible:border-indigo-500 focus-visible:ring-[3px] focus-visible:ring-indigo-500/10 transition-all font-medium text-slate-700">
                        <SelectValue placeholder="All Users">
                          {taskUserFilter === 'all' ? 'All Users' : users.find(u => u.id === taskUserFilter)?.username || 'All Users'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white/80 backdrop-blur-xl border border-slate-100 shadow-xl rounded-xl">
                        <SelectItem value="all" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">All Users</SelectItem>
                        {users.map(u => <SelectItem key={u.id} value={u.id} className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">{u.username}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Filter by Category</label>
                    <Select value={taskCategoryFilter} onValueChange={setTaskCategoryFilter}>
                      <SelectTrigger className="w-full p-3 h-auto justify-center gap-2 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus-visible:border-indigo-500 focus-visible:ring-[3px] focus-visible:ring-indigo-500/10 transition-all font-medium text-slate-700">
                        <SelectValue placeholder="All Categories">
                          {taskCategoryFilter === 'all' ? 'All Categories' : taskCategoryFilter}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white/80 backdrop-blur-xl border border-slate-100 shadow-xl rounded-xl max-h-60 overflow-y-auto">
                        <SelectItem value="all" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">All Categories</SelectItem>
                        <SelectItem value="Strategy and Growth" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Strategy and Growth</SelectItem>
                        <SelectItem value="Human Resource Management" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Human Resource Management</SelectItem>
                        <SelectItem value="Marketing" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Marketing</SelectItem>
                        <SelectItem value="Content and Designing" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Content and Designing</SelectItem>
                        <SelectItem value="Technical" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Technical</SelectItem>
                        <SelectItem value="Expansion strategist" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Expansion strategist</SelectItem>
                        <SelectItem value="Fund raising poc" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Fund raising poc</SelectItem>
                        <SelectItem value="Legal compliance executive" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Legal compliance executive</SelectItem>
                      </SelectContent>
                    </Select>
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
                                  <div className="font-semibold text-slate-700">
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
                        <Select 
                          value={createTaskForm.category} 
                          onValueChange={val => setCreateTaskForm({...createTaskForm, category: val, assigned_to: ''})}
                        >
                          <SelectTrigger className="w-full p-3.5 h-auto justify-between gap-2 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus-visible:border-indigo-500 focus-visible:ring-[3px] focus-visible:ring-indigo-500/10 transition-all font-medium text-slate-800">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 backdrop-blur-xl border border-slate-100 shadow-xl rounded-xl max-h-60 overflow-y-auto z-[60]">
                            <SelectItem value="Strategy and Growth" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Strategy and Growth</SelectItem>
                            <SelectItem value="Human Resource Management" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Human Resource Management</SelectItem>
                            <SelectItem value="Marketing" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Marketing</SelectItem>
                            <SelectItem value="Content and Designing" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Content and Designing</SelectItem>
                            <SelectItem value="Technical" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Technical</SelectItem>
                            <SelectItem value="Expansion strategist" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Expansion strategist</SelectItem>
                            <SelectItem value="Fund raising poc" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Fund raising poc</SelectItem>
                            <SelectItem value="Legal compliance executive" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Legal compliance executive</SelectItem>
                          </SelectContent>
                        </Select>
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
                      <Select 
                        value={createTaskForm.assigned_to || "Unassigned"} 
                        onValueChange={val => setCreateTaskForm({...createTaskForm, assigned_to: val === "Unassigned" ? "" : val})}
                      >
                        <SelectTrigger className="w-full p-3.5 h-auto justify-between gap-2 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus-visible:border-indigo-500 focus-visible:ring-[3px] focus-visible:ring-indigo-500/10 transition-all font-medium text-slate-800">
                          <SelectValue placeholder="Leave Unassigned" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 backdrop-blur-xl border border-slate-100 shadow-xl rounded-xl max-h-60 overflow-y-auto z-[60]">
                          <SelectItem value="unassigned" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Leave Unassigned</SelectItem>
                          {availableUsersForTask.map(u => <SelectItem key={u.id} value={u.id} className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">{u.username}</SelectItem>)}
                        </SelectContent>
                      </Select>
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
                      <UploadCloud className="text-indigo-500 w-5 h-5" /> Bulk Import
                    </div>
                    <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
                      Have a lot of tasks? Automate your workflow by uploading an Excel or CSV file containing all your tasks, descriptions, and assignments.
                    </p>
                    <button 
                      onClick={() => setActiveTab('bulkImport')}
                      className="w-full py-3 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-bold hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Go to Bulk Import
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Import Tab */}
            {activeTab === 'bulkImport' && (
              <div className="flex flex-col gap-6">
                <div className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2 tracking-tight">
                  <UploadCloud className="text-indigo-600 w-6 h-6" /> Bulk Import Tasks
                </div>
                <div className="bg-white p-12 rounded-3xl border-2 border-slate-200 border-dashed shadow-sm flex flex-col items-center justify-center min-h-[400px] hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <FileSpreadsheet className="w-10 h-10 text-indigo-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">Upload Excel or CSV</h3>
                  <p className="text-sm text-slate-500 mb-8 text-center max-w-md leading-relaxed">
                    Automate task creation instantly. Ensure your file has columns for <strong>Title</strong>, <strong>Description</strong>, <strong>Category</strong>, <strong>Points</strong>, and <strong>Username</strong>.
                  </p>
                  <div className="flex gap-4 items-center">
                    <label className="cursor-pointer bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 flex items-center gap-2">
                      <UploadCloud className="w-5 h-5"/> Browse Files
                      <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                    </label>
                    <button 
                      onClick={downloadTemplate}
                      className="bg-white text-indigo-600 border-2 border-indigo-100 px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-50 hover:border-indigo-200 transition-all hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-5 h-5"/> Download Template
                    </button>
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
                  <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <input type="text" placeholder="Username" required value={createUserForm.username} onChange={e => setCreateUserForm({...createUserForm, username: e.target.value})} className="h-12 px-4 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 font-medium text-slate-800 transition-all w-full"/>
                    
                    <div className="relative">
                      <input 
                        type={showCreateUserPassword ? "text" : "password"} 
                        placeholder="Password" 
                        required 
                        value={createUserForm.password} 
                        onChange={e => setCreateUserForm({...createUserForm, password: e.target.value})} 
                        className="w-full h-12 px-4 pr-10 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 font-medium text-slate-800 transition-all"
                      />
                      <button type="button" tabIndex="-1" onClick={() => setShowCreateUserPassword(!showCreateUserPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                        {showCreateUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <Select 
                      value={createUserForm.category} 
                      onValueChange={val => setCreateUserForm({...createUserForm, category: val})}
                    >
                      <SelectTrigger className="h-12 px-4 justify-between gap-2 border-2 border-slate-200 rounded-xl text-sm outline-none focus-visible:border-indigo-500 font-medium text-slate-800 transition-all bg-white w-full">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl border border-slate-100 shadow-xl rounded-xl max-h-60 overflow-y-auto z-[60]">
                        <SelectItem value="Strategy and Growth" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Strategy and Growth</SelectItem>
                        <SelectItem value="Human Resource Management" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Human Resource Management</SelectItem>
                        <SelectItem value="Marketing" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Marketing</SelectItem>
                        <SelectItem value="Content and Designing" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Content and Designing</SelectItem>
                        <SelectItem value="Technical" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Technical</SelectItem>
                        <SelectItem value="Expansion strategist" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Expansion strategist</SelectItem>
                        <SelectItem value="Fund raising poc" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Fund raising poc</SelectItem>
                        <SelectItem value="Legal compliance executive" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Legal compliance executive</SelectItem>
                      </SelectContent>
                    </Select>
                    <button type="submit" className="h-12 w-full text-white rounded-xl font-bold hover:-translate-y-0.5 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                      <PlusCircle className="w-4 h-4"/> Add Member
                    </button>
                  </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block mb-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Filter by Status</label>
                    <Select value={userAvailabilityFilter} onValueChange={setUserAvailabilityFilter}>
                      <SelectTrigger className="w-full p-3 h-auto justify-center gap-2 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus-visible:border-indigo-500 focus-visible:ring-[3px] focus-visible:ring-indigo-500/10 transition-all font-medium text-slate-700">
                        <SelectValue placeholder="All Statuses">
                          {userAvailabilityFilter === 'all' ? 'All Statuses' : 
                           userAvailabilityFilter === 'available' ? 'Available' :
                           userAvailabilityFilter === 'unavailable' ? 'Unavailable' : 'All Statuses'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white/80 backdrop-blur-xl border border-slate-100 shadow-xl rounded-xl">
                        <SelectItem value="all" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">All Statuses</SelectItem>
                        <SelectItem value="available" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Available</SelectItem>
                        <SelectItem value="unavailable" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Filter by Role</label>
                    <Select value={userCategoryFilter} onValueChange={setUserCategoryFilter}>
                      <SelectTrigger className="w-full p-3 h-auto justify-center gap-2 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus-visible:border-indigo-500 focus-visible:ring-[3px] focus-visible:ring-indigo-500/10 transition-all font-medium text-slate-700">
                        <SelectValue placeholder="All Roles">
                          {userCategoryFilter === 'all' ? 'All Roles' : userCategoryFilter}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white/80 backdrop-blur-xl border border-slate-100 shadow-xl rounded-xl max-h-60 overflow-y-auto">
                        <SelectItem value="all" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">All Roles</SelectItem>
                        <SelectItem value="Strategy and Growth" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Strategy and Growth</SelectItem>
                        <SelectItem value="Human Resource Management" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Human Resource Management</SelectItem>
                        <SelectItem value="Marketing" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Marketing</SelectItem>
                        <SelectItem value="Content and Designing" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Content and Designing</SelectItem>
                        <SelectItem value="Technical" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Technical</SelectItem>
                        <SelectItem value="Expansion strategist" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Expansion strategist</SelectItem>
                        <SelectItem value="Fund raising poc" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Fund raising poc</SelectItem>
                        <SelectItem value="Legal compliance executive" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Legal compliance executive</SelectItem>
                      </SelectContent>
                    </Select>
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
                <Select 
                  value={editTaskForm.category} 
                  onValueChange={val => setEditTaskForm({...editTaskForm, category: val, assigned_to: ''})}
                >
                  <SelectTrigger className="w-full p-2 h-auto justify-between border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus-visible:border-indigo-500 font-medium text-slate-800">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border border-slate-100 shadow-xl rounded-xl z-[60]">
                    <SelectItem value="Strategy and Growth" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Strategy and Growth</SelectItem>
                    <SelectItem value="Human Resource Management" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Human Resource Management</SelectItem>
                    <SelectItem value="Marketing" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Marketing</SelectItem>
                    <SelectItem value="Content and Designing" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Content and Designing</SelectItem>
                    <SelectItem value="Technical" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Technical</SelectItem>
                    <SelectItem value="Expansion strategist" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Expansion strategist</SelectItem>
                    <SelectItem value="Fund raising poc" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Fund raising poc</SelectItem>
                    <SelectItem value="Legal compliance executive" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Legal compliance executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-slate-600 uppercase tracking-wider text-xs">Base Points</Label>
                <Input type="number" required min="1" value={editTaskForm.points} onChange={e => setEditTaskForm({...editTaskForm, points: e.target.value === '' ? '' : parseInt(e.target.value)})} className="border-2 border-slate-200 rounded-xl focus-visible:ring-indigo-500 font-medium" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-slate-600 uppercase tracking-wider text-xs">Reallocate / Assign To</Label>
              <Select 
                value={editTaskForm.assigned_to || "unassigned"} 
                onValueChange={val => setEditTaskForm({...editTaskForm, assigned_to: val === "unassigned" ? "" : val})}
              >
                <SelectTrigger className="w-full p-2 h-auto justify-between border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus-visible:border-indigo-500 font-medium text-slate-800">
                  <SelectValue placeholder="Leave Unassigned" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border border-slate-100 shadow-xl rounded-xl max-h-60 overflow-y-auto z-[60]">
                  <SelectItem value="unassigned" className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">Leave Unassigned</SelectItem>
                  {selectedTaskForEdit?.assigned_user_id && !availableUsersForEditTask.find(u => u.id === selectedTaskForEdit.assigned_user_id) && (
                     <SelectItem value={selectedTaskForEdit.assigned_user_id} className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">
                       Current: {selectedTaskForEdit.assignedUserName}
                     </SelectItem>
                  )}
                  {availableUsersForEditTask.map(u => <SelectItem key={u.id} value={u.id} className="cursor-pointer font-medium py-2 rounded-lg hover:bg-slate-50 focus:bg-indigo-50 focus:text-indigo-700">{u.username}</SelectItem>)}
                </SelectContent>
              </Select>
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
      {/* Verify Task Modal */}
      {verifyModalOpen && verifyingTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-indigo-600" /> Verify Submission
              </h2>
              <button 
                onClick={() => setVerifyModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-slate-50">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800">{verifyingTask.title}</h3>
                <p className="text-slate-500 mt-1">{verifyingTask.description}</p>
                <div className="flex gap-4 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full">
                    {verifyingTask.points} Base Points
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200 text-slate-700 font-bold text-xs rounded-full">
                    <User className="w-3.5 h-3.5"/> 
                    {users.find(u => u.id === verifyingTask.assigned_user_id)?.username || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-6 mb-8">
                <strong className="flex items-center gap-2 text-purple-800 mb-2 text-sm uppercase tracking-wider font-bold">
                  <MessageSquare className="w-4 h-4" /> User Remarks
                </strong>
                <p className="text-purple-900/90 font-medium whitespace-pre-wrap">{verifyingTask.remarks || "No remarks provided by the user."}</p>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Bonus Points (Optional)</label>
                <input 
                  type="number" min="0" max="100" placeholder="0" 
                  value={verifyBonusPoints} onChange={e => setVerifyBonusPoints(e.target.value)}
                  className="w-full p-3.5 border-2 border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all font-medium text-slate-800"
                />
                <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Leave empty or 0 if no bonus should be awarded.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
              <button 
                onClick={() => setVerifyModalOpen(false)}
                className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={submitVerification}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve & Complete
              </button>
            </div>
          </div>
        </div>
      )}
          {/* End Task Modal */}
      {endTaskModalOpen && endingTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-rose-50">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-rose-800 tracking-tight">End Task</h2>
                <p className="text-sm text-rose-600 font-medium">This action cannot be undone.</p>
              </div>
            </div>
            
            <div className="p-6 bg-white">
              <p className="text-slate-600 font-medium text-center">
                Are you sure you want to end <strong className="text-slate-800">"{endingTask.title}"</strong>? 
                <br/><br/>
                It will be marked as <strong className="text-rose-600 uppercase text-xs tracking-wide bg-rose-50 px-2 py-1 rounded">failed</strong> and the user will receive <strong className="text-slate-800">0 points</strong>.
              </p>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setEndTaskModalOpen(false)}
                className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={submitEndTask}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" /> End Task Now
              </button>
            </div>
          </div>
        </div>
      )}
</div>
  );
}
