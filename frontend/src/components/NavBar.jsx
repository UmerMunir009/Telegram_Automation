import React from 'react'
import { LogOut, Activity, Menu, User } from 'lucide-react';

const NavBar = ({ setTheToken, setShowSidebar }) => {
  const handleLogout = () => {
    localStorage.removeItem('token')
    setTheToken('')
  }

  return (
    <nav className="sticky top-0 z-50 w-full px-4 md:px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-2xl px-4 md:px-6 py-3 shadow-2xl">
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSidebar(true)}
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-2 group cursor-default">
            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <Activity size={20} className="text-white" />
            </div>
            <span className="text-xs md:text-xl font-bold tracking-tighter text-white uppercase ">
              TG<span className="text-blue-500 ml-1">Muli-Account Automation</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          

          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 bg-slate-800/50 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/50 text-slate-300 hover:text-red-500 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-300 cursor-pointer"
          >
            <span className="hidden md:inline uppercase tracking-tighter">Terminate</span>
            <LogOut size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>
    </nav>
  )
}

export default NavBar