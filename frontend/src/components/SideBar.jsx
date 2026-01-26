import React from 'react'
import { NavLink } from 'react-router-dom'
import { PlusCircle, LayoutGrid, ClipboardList, Settings, ShieldCheck, Zap, Globe } from 'lucide-react'

const SideBar = () => {
  const navLinkClasses = ({ isActive }) => 
    `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-500 relative group overflow-hidden ${
      isActive 
        ? 'bg-gradient-to-r from-blue-600/20 to-transparent text-white shadow-[inset_1px_1px_1px_rgba(255,255,255,0.1)]' 
        : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
    }`;

  return (
    <div className='w-full h-full flex flex-col gap-8 py-2'>
      
      <div className='px-4 mb-2'>
        <div className='bg-slate-900/80 border border-white/5 p-4 rounded-2xl flex items-center gap-3 shadow-xl'>
          <div className='relative'>
             <Zap size={20} className="text-blue-500 fill-blue-500/20" />
             <span className='absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse'></span>
          </div>
          <div className=''>
            <p className='text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] leading-none mb-1'>Core</p>
            <p className='text-xs font-bold text-white uppercase tracking-tighter'>Operations</p>
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-2 px-2'>
       

        <NavLink to='/add' className={navLinkClasses}>
          <PlusCircle size={20} strokeWidth={2} />
          <span className='text-sm font-medium tracking-wide '>Add Account</span>
          <div className="absolute left-0 w-[2px] h-4 bg-blue-500 rounded-full opacity-0 group-[.active]:opacity-100 group-[.active]:shadow-[0_0_8px_#3b82f6] transition-all" />
        </NavLink>

        <NavLink to='/list' className={navLinkClasses}>
          <LayoutGrid size={20} strokeWidth={2} />
          <span className='text-sm font-medium tracking-wide '>Accounts List</span>
          <div className="absolute left-0 w-[2px] h-4 bg-blue-500 rounded-full opacity-0 group-[.active]:opacity-100 group-[.active]:shadow-[0_0_8px_#3b82f6] transition-all" />
        </NavLink>

        <NavLink to='/orders' className={navLinkClasses}>
          <ClipboardList size={20} strokeWidth={2} />
          <span className='text-sm font-medium tracking-wide '>Join Group/Channel</span>
          <div className="absolute left-0 w-[2px] h-4 bg-blue-500 rounded-full opacity-0 group-[.active]:opacity-100 group-[.active]:shadow-[0_0_8px_#3b82f6] transition-all" />
        </NavLink>

        <NavLink to='/nodes' className={navLinkClasses}>
          <Globe size={20} strokeWidth={2} />
          <span className='text-sm font-medium tracking-wide '>Manage Nodes</span>
          <div className="absolute left-0 w-[2px] h-4 bg-blue-500 rounded-full opacity-0 group-[.active]:opacity-100 group-[.active]:shadow-[0_0_8px_#3b82f6] transition-all" />
        </NavLink>
      </div>

      <div className='mt-auto px-2'>
        <div className='bg-blue-500/5 rounded-2xl border border-blue-500/10 p-4 mb-4 hidden lg:block'>
            <div className='flex items-center gap-2 mb-2'>
                <ShieldCheck size={14} className='text-blue-400' />
                <span className='text-[10px] font-bold text-blue-400 uppercase tracking-widest'>Protected</span>
            </div>
            <p className='text-[10px] text-slate-500 leading-tight font-medium'>
                Proxy tunnel active. All requests are encrypted.
            </p>
        </div>
        
        <button className='w-full flex items-center gap-4 px-4 py-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer group'>
          <Settings size={20} className='group-hover:rotate-45 transition-transform duration-500' />
          <span className='text-sm font-medium hidden lg:block'>Settings</span>
        </button>
      </div>

    </div>
  )
}

export default SideBar