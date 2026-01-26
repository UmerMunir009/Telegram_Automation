import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { 
    Users, Link, Clock, Play, Terminal, 
    Loader2, ShieldCheck, CheckSquare, Square, Search, Layers, Cpu
} from 'lucide-react';
// https://t.me/Test1_group_Joiner
const Channel = ({ token }) => {
    const [accounts, setAccounts] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [channelUrl, setChannelUrl] = useState('');
    const [delay, setDelay] = useState(60);
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    
    const terminalEndRef = useRef(null);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const fetchAccounts = async () => {
        try {
            const response = await axios.get(`${backendUrl}/user/get`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.statusCode === 200) {
                const activeOnes = response.data.data.filter(acc => acc.accountStatus === 'active');
                setAccounts(activeOnes);
            }
        } catch (error) {
            addLog("SYSTEM_ERROR: Connection to Node Registry failed.", "error");
        }
    };

    useEffect(() => { fetchAccounts(); }, [token]);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { timestamp, message, type }]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredAccounts.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredAccounts.map(a => a.id));
        }
    };

    const toggleSelectOne = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredAccounts = accounts.filter(a => 
        a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.phone?.includes(searchTerm)
    );

    const startJoiningProcess = async () => {
        if (!channelUrl.includes('t.me/')) return toast.error("Invalid Telegram URL");
        console.log("Valid URL detected.");
        if (selectedIds.length === 0) return toast.error("Please select target accounts");
        console.log("STARTING CHANNEL JOIN PROCESS");
        setIsRunning(true);
        setLogs([]);
        addLog(`BOOTING ENGINE: Target Link [${channelUrl}]`, "process");
        
        const targetAccounts = accounts.filter(a => selectedIds.includes(a.id));
        setProgress({ current: 0, total: targetAccounts.length });

        for (let i = 0; i < targetAccounts.length; i++) {
            const account = targetAccounts[i];
            addLog(`NODE_READY: Executing join for ${account.name}`, "process");

            try {
                const response = await axios.post(`${backendUrl}/telegram/join/group`, {
                    phone: account.phone,
                    channelUrl: channelUrl
                }, { headers: { Authorization: `Bearer ${token}` } });

                if (response.data.success) addLog(`SUCCESS: ${account.name} initialized.`, "success");
            } catch (error) {
                addLog(`CRITICAL: ${account.name} - ${error.response?.data?.message || "Internal Fail"}`, "error");
            }

            setProgress(prev => ({ ...prev, current: i + 1 }));

            if (i < targetAccounts.length - 1) {
                const totalWait = delay + (Math.floor(Math.random() * 11) - 5);
                addLog(`THROTTLING: Cooling down for ${totalWait}s...`);
                await new Promise(r => setTimeout(r, totalWait * 1000));
            }
        }
        setIsRunning(false);
        addLog("SEQUENCE FINISHED: Engine entering standby.", "success");
    };

    return (
        <div className="min-h-screen p-2 sm:p-0 font-sans text-white">
            
            {/* Header Section */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/50">
                            <Layers className="text-white" size={24} />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-blue-400">
                            CHANNEL_JOINER
                        </h1>
                    </div>
                    <p className="text-blue-300/60 text-xs font-mono tracking-widest uppercase">Autonomous Multi-Account Sync</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-blue-300 uppercase">Active Clusters</p>
                            <p className="text-2xl font-black">{accounts.length}</p>
                        </div>
                        <Cpu className="text-blue-400 opacity-50" size={32} />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Account Selection Card */}
                <div className="lg:col-span-7 group">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all hover:border-blue-500/30">
                        <div className="p-6 border-b border-white/10 bg-white/5 flex flex-wrap items-center gap-4 justify-between">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/50" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search by name or phone..."
                                    className="w-full bg-blue-900/20 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 ring-blue-500/40 transition-all placeholder:text-blue-300/30"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={toggleSelectAll}
                                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-xs font-bold uppercase tracking-tighter transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
                            >
                                {selectedIds.length === filteredAccounts.length ? <CheckSquare size={16} /> : <Square size={16} />}
                                {selectedIds.length === filteredAccounts.length ? "Deselect All" : "Select Visible"}
                            </button>
                        </div>

                        <div className="max-h-[550px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <tbody className="divide-y divide-white/5">
                                    {filteredAccounts.map((acc) => (
                                        <tr 
                                            key={acc.id} 
                                            onClick={() => toggleSelectOne(acc.id)}
                                            className={`group cursor-pointer transition-all ${selectedIds.includes(acc.id) ? 'bg-blue-500/20' : 'hover:bg-white/5'}`}
                                        >
                                            <td className="p-5 w-12">
                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.includes(acc.id) ? 'bg-blue-500 border-blue-400' : 'border-white/10'}`}>
                                                    {selectedIds.includes(acc.id) && <CheckSquare size={14} />}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-bold text-sm">
                                                        {acc.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-blue-50">{acc.name}</p>
                                                        <p className="text-[11px] font-mono text-blue-300/50">{acc.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 text-right">
                                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${acc.proxyId ? 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10' : 'border-blue-500/30 text-blue-300 bg-blue-500/10'}`}>
                                                    {acc.proxyId ? 'SOCKS5' : 'DIRECT'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Control Panel & Terminal */}
                <div className="lg:col-span-5 space-y-8">
                    
                    {/* Input Config */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-xl space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="text-blue-400" size={20} />
                            <h2 className="text-sm font-black uppercase tracking-widest text-blue-100">Engine Config</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="group relative">
                                <label className="text-[10px] font-bold text-blue-300 uppercase ml-2 mb-1 block opacity-60">Telegram Target URL</label>
                                <div className="relative">
                                    <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="https://t.me/your_channel"
                                        className="w-full bg-blue-950/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-blue-400 transition-all shadow-inner"
                                        value={channelUrl}
                                        onChange={(e) => setChannelUrl(e.target.value)}
                                        disabled={isRunning}
                                    />
                                </div>
                            </div>

                            <div className="group relative">
                                <label className="text-[10px] font-bold text-blue-300 uppercase ml-2 mb-1 block opacity-60">Execution Delay (Seconds)</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
                                    <input 
                                        type="number" 
                                        className="w-full bg-blue-950/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-blue-400 transition-all shadow-inner"
                                        value={delay}
                                        onChange={(e) => setDelay(parseInt(e.target.value))}
                                        disabled={isRunning}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={startJoiningProcess}
                                disabled={isRunning || selectedIds.length === 0}
                                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 relative overflow-hidden group ${
                                    isRunning 
                                    ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
                                    : 'bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-white shadow-xl shadow-blue-500/40 active:scale-[0.98]'
                                }`}
                            >
                                {isRunning ? <Loader2 className="animate-spin" /> : <Play fill="white" size={16} />}
                                {isRunning ? `Processing ${progress.current}/${progress.total}` : 'Initiate Deployment'}
                            </button>
                        </div>
                    </div>

                    {/* Blue Terminal */}
                    <div className="bg-[#0f172a]/80 backdrop-blur-md border border-blue-500/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[350px]">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-blue-500/10">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-300 uppercase tracking-widest">
                                <Terminal size={14} className="animate-pulse" /> Live System Feed
                            </div>
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                                <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-5 font-mono text-[11px] space-y-2 bg-gradient-to-b from-transparent to-blue-900/10">
                            {logs.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-blue-300/20">
                                    <Terminal size={40} className="mb-2" />
                                    <p className="uppercase tracking-widest">Waiting for launch...</p>
                                </div>
                            )}
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-3 leading-relaxed animate-in fade-in duration-500">
                                    <span className="text-blue-500 font-bold">[{log.timestamp}]</span>
                                    <span className={
                                        log.type === 'error' ? 'text-red-400' : 
                                        log.type === 'success' ? 'text-emerald-400' : 
                                        log.type === 'process' ? 'text-cyan-400' : 'text-blue-100'
                                    }>
                                        <span className="opacity-50 mr-1"> {'>'} </span> {log.message}
                                    </span>
                                </div>
                            ))}
                            <div ref={terminalEndRef} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Channel;