import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { Globe, RefreshCcw, Search, Plus, Trash2, Zap, Server, X, Loader2 } from 'lucide-react';

const Nodes = ({ token }) => {
    const [nodes, setNodes] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rawData, setRawData] = useState('');
    const [protocol, setProtocol] = useState('socks5');
    const [submitting, setSubmitting] = useState(false);

    const fetchNodes = async () => {
        try {
            if (!token) return;
            setLoading(true);
            const response = await axios.get(`${backendUrl}/proxy/get`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.statusCode === 200) {
                setNodes(response.data.data || []);
            }
        } catch (error) {
            toast.error("Network Link Failure");
        } finally {
            setLoading(false);
        }
    };

    const handleAddProxy = async (e) => {
        e.preventDefault();
        if (!rawData.trim()) return toast.warning("Please enter proxy data");

        setSubmitting(true);
        try {
            const response = await axios.post(`${backendUrl}/proxy/add`, 
                { rawData, protocol }, 
                { headers: { 'Authorization': `Bearer ${token}` }}
            );

            if (response.data.statusCode === 201) {
                toast.success(response.data.message);
                setRawData('');
                setIsModalOpen(false);
                fetchNodes();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add proxies");
        } finally {
            setSubmitting(false);
        }
    };

    const deleteProxy = async (id) => {
        if (!window.confirm("Terminate this network relay?")) return;
        try {
            const response = await axios.delete(`${backendUrl}/proxy/delete/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.statusCode === 200) {
                toast.success("Relay Terminated");
                fetchNodes();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Deletion Failed");
        }
    };

    useEffect(() => { fetchNodes(); }, [token]);

    return (
        <div className="min-h-screen text-slate-300 p-4 lg:p-10 font-mono relative">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                        <Server className="text-blue-500" /> PROXY_CORE
                    </h1>
                    <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Network Management</p>
                </div>
                
                <div className="flex gap-3">
                    <button onClick={fetchNodes} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-slate-400 hover:bg-white/10 transition-all text-xs font-bold">
                        <RefreshCcw size={14} className={loading ? "animate-spin" : ""} /> RE_SCAN
                    </button>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 border border-blue-400/50 px-4 py-2 rounded-xl text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all text-xs font-bold"
                    >
                        <Plus size={14} /> Add New Proxy
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
                <div className="grid grid-cols-12 bg-white/5 p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-white/5">
                    <div className="col-span-5 lg:col-span-4">Node_Address / Port</div>
                    <div className="col-span-3 text-center">Protocol</div>
                    <div className="col-span-2 text-center hidden lg:block">Channel_Load</div>
                    <div className="col-span-4 lg:col-span-3 text-right">Actions</div>
                </div>

                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                    {nodes.length === 0 ? (
                        <div className="p-20 text-center opacity-20">
                            <Search size={48} className="mx-auto mb-4" />
                            <p className="text-sm">NO_ACTIVE_RELAYS_FOUND</p>
                        </div>
                    ) : (
                        nodes.map((node, index) => (
                            <div key={node.id || index} className="grid grid-cols-12 p-6 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors group">
                                <div className="col-span-5 lg:col-span-4 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 text-blue-500 group-hover:rotate-12 transition-transform"><Globe size={18} /></div>
                                    <div>
                                        <p className="text-white font-bold text-sm tracking-tight">{node.host}</p>
                                        <p className="text-[10px] text-slate-500 font-mono">PORT: {node.port}</p>
                                    </div>
                                </div>
                                <div className="col-span-3 text-center">
                                    <span className="text-[10px] font-bold px-2 py-1 bg-black/40 border border-white/10 rounded uppercase text-slate-400">{node.protocol || 'SOCKS5'}</span>
                                </div>
                                <div className="col-span-2 text-center hidden lg:block">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className={`text-[10px] font-bold ${node.usageCount >= 2 ? 'text-red-500' : 'text-blue-500'}`}>{node.usageCount}/2</span>
                                        <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all ${node.usageCount >= 2 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${(node.usageCount / 2) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-4 lg:col-span-3 flex justify-end gap-2">
                                    <button className="p-2 hover:bg-blue-500/10 rounded-lg text-slate-500 hover:text-blue-400 transition-colors"><Zap size={16} /></button>
                                    <button onClick={() => deleteProxy(node.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                <Plus className="text-blue-500" size={20} /> Add New Proxy
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddProxy} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Protocol Type</label>
                                <select 
                                    value={protocol} 
                                    onChange={(e) => setProtocol(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500"
                                >
                                    <option value="socks5">SOCKS5</option>
                                    <option value="http">HTTP</option>
                                    <option value="https">HTTPS</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Raw Data (host:port:user:pass)</label>
                                <textarea 
                                    required
                                    rows={5}
                                    placeholder="192.168.1.1:8080:username:password&#10;192.168.1.2:8080"
                                    value={rawData}
                                    onChange={(e) => setRawData(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white font-mono outline-none focus:border-blue-500 resize-none placeholder:text-slate-700"
                                />
                                <p className="text-[9px] text-slate-500 italic">*Supports bulk input (one per line)</p>
                            </div>

                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex justify-center items-center gap-2"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={16} /> : "ADD PROXY"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Nodes;