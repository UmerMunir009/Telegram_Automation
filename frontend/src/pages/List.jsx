import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { 
    Trash2, User as UserIcon, Phone, Shield, 
    RefreshCcw, Loader2, Search, Database, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const List = ({ token }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteId, setDeleteId] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/user/get`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success || response.data.statusCode === 200) {
                setUsers(response.data.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch accounts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const handleDelete = async (id) => {
        try {
            const response = await axios.delete(`${backendUrl}/user/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success || response.data.statusCode === 200) {
                toast.success("Account permanently purged");
                setUsers(users.filter(user => user.id !== id));
                setDeleteId(null);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Purge failed");
        }
    };

    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.phone?.includes(searchTerm)
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <Database className="text-blue-500" />
                        Account Registry
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Manage active Telegram automation nodes</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search by alias or phone..."
                            className="bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none w-full sm:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={fetchUsers}
                        className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-500 hover:bg-blue-500/20 transition-all"
                    >
                        <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Table / List */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity</th>
                                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</th>
                                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network Bind</th>
                                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="p-8 text-center text-slate-600">Syncing with database...</td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-500">
                                            <AlertCircle size={40} className="opacity-20" />
                                            <p className="font-mono text-xs uppercase tracking-widest">No matching records found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/[0.01] transition-colors group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/5">
                                                    <UserIcon size={18} className="text-blue-400" />
                                                </div>
                                                <span className="text-white font-bold text-sm tracking-tight">{user.name || 'UNNAMED_NODE'}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 font-mono text-xs text-slate-300">{user.phone}</td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2">
                                                <Shield size={14} className={user.proxyId ? "text-emerald-500" : "text-slate-600"} />
                                                <span className="text-[11px] font-mono text-slate-400">
                                                    {user.proxyId ? 'SECURE_RELAY' : 'DIRECT_UPLINK'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                                                {user.accountStatus}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <button 
                                                onClick={() => setDeleteId(user.id)}
                                                className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-red-500/30 p-8 rounded-[2rem] max-w-sm w-full text-center"
                        >
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="text-red-500" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 uppercase">Confirm Purge</h3>
                            <p className="text-sm text-slate-400 mb-8">
                                This will permanently delete the session from the database. This action cannot be undone.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setDeleteId(null)}
                                    className="py-3 px-4 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleDelete(deleteId)}
                                    className="py-3 px-4 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-500 transition-all shadow-lg shadow-red-600/20"
                                >
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default List;