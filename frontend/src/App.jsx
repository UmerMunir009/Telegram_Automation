import React, { useEffect, useState } from 'react';
import NavBar from './components/NavBar';
import SideBar from './components/SideBar';
import { Routes, Route } from 'react-router-dom';
import Add from './pages/Add';
import List from './pages/List';
import Order from './pages/Channel';
import Nodes from './pages/Nodes';
import Login from './components/Login';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { LayoutDashboard } from 'lucide-react';

export const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const currency = '$';

const App = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      try {
        const decoded = jwtDecode(savedToken);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          return '';
        }
        return savedToken;
      } catch (e) {
        return '';
      }
    }
    return '';
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          setToken('');
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    try {
      const decoded = jwtDecode(token);
      const delay = (decoded.exp * 1000) - Date.now();
      if (delay <= 0) {
        setToken('');
      } else {
        const timer = setTimeout(() => {
          setToken('');
          toast.warning("Security Alert: Session Timed Out");
        }, delay);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      setToken('');
    }
  }, [token]);

  return (
    <div className='min-h-screen bg-[#020617] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black text-slate-200 selection:bg-blue-500/30 font-sans'>
      <ToastContainer theme="dark" position="top-right" autoClose={1500} />

      {token === '' ? (
        <Login setTheToken={setToken} />
      ) : (
        <div className="flex flex-col h-screen overflow-hidden">
          <NavBar setTheToken={setToken} setShowSidebar={setShowSidebar} />

          <div className='flex flex-1 overflow-hidden relative'>

            <aside className={`
              fixed md:relative z-50 h-full transition-all duration-500 ease-in-out
              bg-[#020617] md:bg-transparent
              ${showSidebar ? 'left-0 w-[280px] px-4' : '-left-full md:left-0 md:w-[20%] lg:w-[18%] md:px-4'}
            `}>
              <SideBar setShowSidebar={setShowSidebar} />
            </aside>

            {showSidebar && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
                onClick={() => setShowSidebar(false)}
              />
            )}

            <main className='flex-1 overflow-y-auto bg-slate-900/30 backdrop-blur-sm border-l border-t border-white/5 rounded-tl-3xl md:mx-4 md:mb-4 md:rounded-3xl shadow-2xl custom-scrollbar'>
              <div className="p-4 sm:p-8 max-w-7xl mx-auto">
                <Routes>
                  <Route path='/' element={
                    <div className='flex flex-col items-center justify-center min-h-[70vh] text-center animate-in fade-in duration-700'>
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
                        <LayoutDashboard size={80} className="relative text-blue-400 stroke-[1.5px]" />
                      </div>

                      <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
                        Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Portal</span>
                      </h1>

                      <p className="text-slate-400 max-w-xs mx-auto leading-relaxed">
                        Manage your telegram accounts and their related actions from dashboard.
                      </p>

                      <div className="mt-8 px-4 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-slate-500 uppercase tracking-widest">
                        System Operational
                      </div>
                    </div>
                  } />
                  <Route path='/add' element={<Add token={token} />} />
                  <Route path='/list' element={<List token={token} />} />
                  <Route path='/orders' element={<Order token={token} />} />
                  <Route path='/nodes' element={<Nodes token={token} />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;