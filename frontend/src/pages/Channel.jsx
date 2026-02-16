import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import {
    Users, Link, Clock, Play, Terminal,
    Loader2, ShieldCheck, CheckSquare, Square, Search, Layers, Cpu, List
} from 'lucide-react';

const Channel = ({ token }) => {
    const [accounts, setAccounts] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [channelUrlsRaw, setChannelUrlsRaw] = useState('');
    const [delay, setDelay] = useState(60);
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    
    const stopSignal = useRef(false);

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
        const urls = channelUrlsRaw
            .split(/[\n,]+/)
            .map(u => u.trim())
            .filter(u => u.includes('t.me/'));

        if (urls.length === 0) return toast.error("Enter valid URLs");
        if (selectedIds.length === 0) return toast.error("Select accounts");

        setIsRunning(true);
        stopSignal.current = false;
        setLogs([]);
        addLog(`ROUND-ROBIN START: Mapping ${selectedIds.length} accounts to ${urls.length} targets.`, "process");

        const targetAccounts = accounts.filter(a => selectedIds.includes(a.id));
        setProgress({ current: 0, total: targetAccounts.length });

        for (let i = 0; i < targetAccounts.length; i++) {
            if (stopSignal.current) {
                addLog("TERMINATED: Sequence stopped by user.", "error");
                break;
            }

            const account = targetAccounts[i];
            const channelIndex = i % urls.length;
            const currentUrl = urls[channelIndex];
            const displayUrl = currentUrl.replace('https://t.me/', '');

            addLog(`ACTION: ${account.name} joining ${displayUrl}`, "process");

            try {
                const response = await axios.post(`${backendUrl}/telegram/join/group`, {
                    phone: account.phone,
                    channelUrl: currentUrl
                }, { headers: { Authorization: `Bearer ${token}` } });

                if (response.data.success) {
                    addLog(`SUCCESS: ${account.name} joined.`, "success");
                }
            } catch (error) {
                const errorMsg = error.response?.data?.message || "Join Failed";
                addLog(`CRITICAL: ${account.name} - ${errorMsg}`, "error");
            }

            setProgress({ current: i + 1, total: targetAccounts.length });

            if (i < targetAccounts.length - 1 && !stopSignal.current) {
                const jitter = Math.floor(Math.random() * 11) - 5;
                const totalWait = Math.max(1, delay + jitter);
                addLog(`THROTTLING: Cooling down ${totalWait}s...`);
                
                for (let j = 0; j < totalWait; j++) {
                    if (stopSignal.current) break;
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }

        setIsRunning(false);
        stopSignal.current = false;
        addLog("SEQUENCE ENDED: Engine entering standby.", "info");
    };

    return (
        <div className="min-h-screen p-2 sm:p-0 font-sans text-white">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                            <Layers className="text-white" size={24} />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-blue-400">
                            MULTI_CHANNEL_JOINER
                        </h1>
                    </div>
                    <p className="text-blue-300/60 text-xs font-mono tracking-widest uppercase">Sequential Account Rotation Engine</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 group">
                    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex flex-wrap items-center gap-4 justify-between">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/50" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search nodes..."
                                    className="w-full bg-blue-900/20 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button onClick={toggleSelectAll} className="px-5 py-3 rounded-2xl bg-blue-600 text-xs font-bold uppercase transition-all">
                                {selectedIds.length === filteredAccounts.length ? "Deselect All" : "Select Visible"}
                            </button>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto">
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-white/5">
                                    {filteredAccounts.map((acc) => (
                                        <tr key={acc.id} onClick={() => toggleSelectOne(acc.id)} className={`cursor-pointer transition-all ${selectedIds.includes(acc.id) ? 'bg-blue-500/20' : 'hover:bg-white/5'}`}>
                                            <td className="p-5 w-12">
                                                <div className={`w-6 h-6 rounded-lg border-2 ${selectedIds.includes(acc.id) ? 'bg-blue-500 border-blue-400' : 'border-white/10'}`}>
                                                    {selectedIds.includes(acc.id) && <CheckSquare size={14} />}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">{acc.name?.charAt(0)}</div>
                                                    <div>
                                                        <p className="font-bold">{acc.name}</p>
                                                        <p className="text-[11px] font-mono text-blue-300/50">{acc.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-8">
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] shadow-xl space-y-6">
                        <div className="space-y-4">
                            <div className="group relative">
                                <label className="text-[10px] font-bold text-blue-300 uppercase block mb-1">Target URLs (One per line)</label>
                                <textarea
                                    placeholder="https://t.me/channel1&#10;https://t.me/channel2"
                                    className="w-full h-32 bg-blue-950/40 border border-white/10 rounded-2xl p-4 text-sm font-mono text-cyan-400 focus:border-blue-400 transition-all outline-none resize-none"
                                    value={channelUrlsRaw}
                                    onChange={(e) => setChannelUrlsRaw(e.target.value)}
                                    disabled={isRunning}
                                />
                            </div>

                            <div className="group relative">
                                <label className="text-[10px] font-bold text-blue-300 uppercase block mb-1">Delay Between Joins (Seconds)</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
                                    <input
                                        type="number"
                                        className="w-full bg-blue-950/40 border border-white/10 rounded-2xl py-4 pl-12 text-sm outline-none"
                                        value={delay}
                                        onChange={(e) => setDelay(parseInt(e.target.value))}
                                        disabled={isRunning}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={startJoiningProcess}
                                    disabled={isRunning || selectedIds.length === 0}
                                    className={`flex-1 py-5 rounded-2xl font-black text-sm uppercase transition-all flex items-center justify-center gap-3 ${isRunning ? 'bg-slate-700' : 'bg-blue-600 hover:bg-blue-500'}`}
                                >
                                    {isRunning ? <Loader2 className="animate-spin" /> : <Play size={16} />}
                                    {isRunning ? `Joining ${progress.current}/${progress.total}` : 'Initiate Deployment'}
                                </button>

                                {isRunning && (
                                    <button
                                        onClick={() => { stopSignal.current = true; }}
                                        className="px-6 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all animate-pulse"
                                    >
                                        <Square size={20} fill="currentColor" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0f172a]/80 border border-blue-500/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[400px]">
                        <div className="p-4 border-b border-white/5 bg-blue-500/10 flex items-center gap-2 text-[10px] font-bold text-blue-300 uppercase tracking-widest">
                            <Terminal size={14} className="animate-pulse" /> Live System Feed
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 font-mono text-[11px] space-y-2">
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-3 animate-in fade-in duration-500">
                                    <span className="text-blue-500">[{log.timestamp}]</span>
                                    <span className={log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : 'text-blue-100'}>
                                        {'>'} {log.message}
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