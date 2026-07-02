import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { motion } from "framer-motion";
import { ClipboardList, PlusCircle, Users, Trophy, LogOut, ChevronLeft, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function AdminSidebar({ 
  sidebarOpen, 
  setSidebarOpen, 
  activeTab, 
  setActiveTab, 
  adminName, 
  handleLogout 
}) {
  return (
    <>
    <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
      <SidebarBody className="justify-between gap-0 bg-white border-r border-slate-100 shadow-sm z-50 p-0 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto w-full">
          
          {/* Header */}
          <div className="px-4 py-6 mb-2">
            <div className="flex items-center justify-between">
              <a href="#" className="flex items-center">
                <div className="w-10 h-10 ml-1 shrink-0 flex items-center justify-center">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6H20V9.5H13.5V19H10.5V9.5H4V6Z" fill="#4f46e5" />
                  </svg>
                </div>

                <motion.div 
                  animate={{ width: sidebarOpen ? "auto" : 0, opacity: sidebarOpen ? 1 : 0, marginLeft: sidebarOpen ? "12px" : "0px" }} 
                  className="flex flex-col whitespace-nowrap overflow-hidden"
                >
                  <span className="font-bold text-[18px] leading-tight text-slate-900 tracking-tight">TaskFlow</span>
                  <span className="text-[13px] font-medium text-slate-500 leading-tight">Admin</span>
                </motion.div>
              </a>
              <motion.button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                animate={{ width: sidebarOpen ? "32px" : 0, opacity: sidebarOpen ? 1 : 0 }}
                className="h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors shrink-0 overflow-hidden"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
              </motion.button>
            </div>
          </div>
          
          <div className="h-px bg-slate-100 w-full mb-6"></div>
          
          {/* Links */}
          <div className="flex flex-col gap-2 px-4">
            {[
              { id: 'taskBench', icon: <ClipboardList className="w-6 h-6 shrink-0" />, label: 'Task Bench' },
              { id: 'createTask', icon: <PlusCircle className="w-6 h-6 shrink-0" />, label: 'Create Task' },
              { id: 'userList', icon: <Users className="w-6 h-6 shrink-0" />, label: 'User Management' },
              { id: 'leaderboard', icon: <Trophy className="w-6 h-6 shrink-0" />, label: 'Leaderboard' },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <SidebarLink 
                  key={tab.id}
                  link={{ 
                    href: '#', 
                    label: tab.label, 
                    icon: (
                        <div className={cn("relative flex items-center justify-center shrink-0 w-6 h-6", isActive ? "text-indigo-600" : "text-slate-600")}>
                          {isActive && (
                            <div className="absolute left-[-28px] top-1/2 -translate-y-1/2 w-[4px] h-[34px] bg-indigo-600 rounded-r-md"></div>
                          )}
                          {tab.icon}
                        </div>
                    ) 
                  }}
                  onClick={(e) => { e.preventDefault(); setActiveTab(tab.id); }}
                  className={cn(
                    "rounded-2xl transition-all font-semibold py-[14px] px-3 relative w-full whitespace-nowrap",
                    isActive ? "bg-indigo-50/80 text-indigo-900" : "hover:bg-slate-50 text-slate-600"
                  )}
                />
              )
            })}
          </div>
        </div>
        
        {/* Bottom Footer */}
        <div className="mt-auto w-full flex flex-col pb-10">
          <div className="h-px bg-slate-100 w-full mb-4"></div>
          
          <div className="px-4 mb-4">
            <SidebarLink
              link={{ 
                label: "Logout", 
                href: "#", 
                icon: <div className="flex items-center justify-center shrink-0 w-6 h-6 text-slate-500"><LogOut className="w-6 h-6 shrink-0" /></div>
              }} 
              onClick={(e) => { e.preventDefault(); handleLogout(); }}
              className="hover:bg-slate-50 text-slate-500 rounded-2xl font-medium py-[14px] px-3 w-full whitespace-nowrap"
            />
          </div>
          
          <div className="px-4">
            <div className="bg-slate-50/80 rounded-[20px] p-1.5 flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer w-full whitespace-nowrap">
                <div className="flex items-center w-full overflow-hidden">
                  <div className="w-9 h-9 shrink-0 rounded-full bg-[#1e1e1e] flex items-center justify-center text-white font-medium text-[16px] relative">
                    {adminName.charAt(0).toUpperCase()}
                    <div className="absolute bottom-0 right-0 w-[10px] h-[10px] bg-emerald-500 border-2 border-white rounded-full"></div>
                  </div>
                  <motion.div 
                    animate={{ width: sidebarOpen ? "auto" : 0, opacity: sidebarOpen ? 1 : 0, marginLeft: sidebarOpen ? "12px" : "0px" }}
                    className="flex flex-col overflow-hidden whitespace-nowrap"
                  >
                    <span className="text-[14px] font-bold text-slate-800 truncate leading-tight">{adminName}</span>
                    <span className="text-[13px] font-medium text-slate-500 truncate leading-tight">Administrator</span>
                  </motion.div>
                </div>
                <motion.div animate={{ width: sidebarOpen ? "auto" : 0, opacity: sidebarOpen ? 1 : 0 }} className="shrink-0 overflow-hidden">
                  <ChevronDown className="w-4 h-4 text-slate-400 mr-2" />
                </motion.div>
            </div>
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
    
    {/* Mobile Bottom Navbar */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex justify-around items-center px-2 py-2">
        {[
          { id: 'taskBench', icon: <ClipboardList className="w-6 h-6" /> },
          { id: 'createTask', icon: <PlusCircle className="w-6 h-6" /> },
          { id: 'userList', icon: <Users className="w-6 h-6" /> },
          { id: 'leaderboard', icon: <Trophy className="w-6 h-6" /> },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all relative",
                isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              {tab.icon}
              {isActive && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600"></div>}
            </button>
          )
        })}
        
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>
    </div>
    </>
  );
}
