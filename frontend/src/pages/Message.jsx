import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { 
    Send, Timer, MessageSquare, RefreshCcw, 
    Terminal, Zap, Loader2, Check, Square, UserPlus
} from 'lucide-react';

const Messages = ({ token }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSenderIds, setSelectedSenderIds] = useState([]);
    
    const [receiverHandlesRaw, setReceiverHandlesRaw] = useState('');
    const [messageText, setMessageText] = useState('');
    const [delaySeconds, setDelaySeconds] = useState(10); 
    const [logs, setLogs] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    
    const logEndRef = useRef(null);
    const stopSignal = useRef(false); 

    useEffect(() => {
        fetchAccounts();
    }, []);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${backendUrl}/user/get`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAccounts(response.data.data || []);
        } catch (error) {
            toast.error("Failed to fetch sender accounts");
        } finally {
            setLoading(false);
        }
    };

    const addLog = (msg, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString([], { hour12: false });
        setLogs(prev => [...prev, { timestamp, msg, type }]);
    };

    const toggleSender = (id) => {
        setSelectedSenderIds(prev => 
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const handleStop = () => {
        stopSignal.current = true;
        addLog("STOP SIGNAL RECEIVED. Finishing current task...", "error");
    };

    const handleStartSequence = async () => {
        const handles = receiverHandlesRaw
            .split(/[\n,]+/)
            .map(h => h.trim())
            .filter(h => h !== '');

        if (selectedSenderIds.length === 0 || handles.length === 0) {
            toast.error("Select at least one sender and add recipient handles");
            return;
        }
        
        stopSignal.current = false;
        setIsSending(true);
        setProgress({ current: 0, total: handles.length });
        addLog(`INITIALIZING DEPLOYMENT TO ${handles.length} TARGETS...`, "info");

        for (let i = 0; i < handles.length; i++) {
            if (stopSignal.current) {
                addLog("SEQUENCE HALTED BY USER", "error");
                break;
            }

            const targetHandle = handles[i];
            const senderId = selectedSenderIds[i % selectedSenderIds.length];
            const senderAcc = accounts.find(a => a.id === senderId);
            const senderName = senderAcc?.name || senderAcc?.phone || "Unknown Node";

            try {
                addLog(`Sending message: ${targetHandle} via node (${senderName})`, "info");
                
                const response = await axios.post(`${backendUrl}/telegram/send-message`, {
                    targetHandle: targetHandle,
                    message: messageText,
                    senderId: senderId
                }, { headers: { 'Authorization': `Bearer ${token}` } });

                if (response.data.success) {
                    addLog(`[OK] Successfully delivered to ${targetHandle}`, "success");
                }
            } catch (error) {
                const errorMsg = error.response?.data?.message || "Internal Protocol Error";
                addLog(`[FAIL] ${targetHandle}: ${errorMsg}`, "error");
                
                if (errorMsg.includes("AUTH_KEY_UNREGISTERED")) {
                    addLog(`CRITICAL: Node (${senderName}) session expired.`, "error");
                }
            }

            setProgress(prev => ({ ...prev, current: i + 1 }));

            if (i < handles.length - 1 && !stopSignal.current) {
                const jitter = Math.floor(Math.random() * (delaySeconds * 0.4)) - (delaySeconds * 0.2);
                const finalDelay = Math.max(1, delaySeconds + jitter);
                
                addLog(`Cooldown: ${finalDelay.toFixed(1)}s...`);
                await new Promise(resolve => setTimeout(resolve, finalDelay * 1000));
            }
        }

        setIsSending(false);
        addLog("DEPLOYMENT SEQUENCE FINISHED.", "info");
        toast.info("Task completed.");
    };

    return (
        <div className="min-h-screen text-slate-300 p-4 lg:p-8 ">
            <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
                
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-6">
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                                <Send className="text-blue-500" /> AUTO-MESSAGE SENDER
                            </h1>
                            <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em]">Sequential Handle Deployment</p>
                        </div>
                        <button onClick={fetchAccounts} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                            <RefreshCcw size={18} className={loading ? "animate-spin text-blue-400" : ""} />
                        </button>
                    </div>

                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-2">
                                <span className="w-5 h-5 bg-blue-500 text-black rounded-full flex items-center justify-center text-[10px]">01</span>
                                Select Sending Nodes (From DB)
                            </label>
                            <span className="text-[10px] text-slate-500">{selectedSenderIds.length} Senders Active</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {accounts.map(acc => (
                                <button 
                                    key={acc.id}
                                    onClick={() => toggleSender(acc.id)}
                                    className={`p-3 rounded-xl border text-left transition-all ${
                                        selectedSenderIds.includes(acc.id) 
                                        ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.1)]' 
                                        : 'bg-white/5 border-transparent hover:border-white/10'
                                    }`}
                                >
                                    <p className="text-[10px] font-bold text-white truncate">{acc.name || "Node"}</p>
                                    <p className="text-[9px] text-slate-500">{acc.phone}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-2">
                                <span className="w-5 h-5 bg-emerald-500 text-black rounded-full flex items-center justify-center text-[10px]">02</span>
                                Bulk Recipient Handles
                            </label>
                            <span className="text-[9px] text-slate-500">One @username  per line</span>
                        </div>
                        <textarea 
                            value={receiverHandlesRaw}
                            onChange={(e) => setReceiverHandlesRaw(e.target.value)}
                            className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none resize-none"
                            placeholder="@username1&#10;@username2&#10;+123456789"
                        />
                    </div>

                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                        <label className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-2 mb-4">
                            <MessageSquare size={14} /> Message Content
                        </label>
                        <textarea 
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white focus:border-purple-500 outline-none resize-none"
                            placeholder="Enter the transmission text here..."
                        />
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 space-y-6">
                    
                    <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20  top-6">
                        <div className="flex justify-between items-start mb-6">
                            <div className="bg-white/20 p-2 rounded-xl">
                                {isSending ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} fill="currentColor" />}
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase opacity-60">Status</p>
                                <p className="text-sm font-black tracking-widest">{isSending ? "SENDING" : "STANDBY"}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                                    <span>Progress</span>
                                    <span>{progress.current} / {progress.total}</span>
                                </div>
                                <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-white transition-all duration-500" 
                                        style={{ width: `${(progress.current / progress.total) * 100 || 0}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-end gap-4">
                                <div className="flex-1">
                                    <label className="text-[9px] font-bold uppercase opacity-60 block mb-1">Delay (Sec)</label>
                                    <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                                        <Timer size={14} />
                                        <input 
                                            type="number" 
                                            min="1"
                                            onKeyDown={(e) => ["e", "E", "-", "+"].includes(e.key) && e.preventDefault()}
                                            value={delaySeconds} 
                                            onChange={(e) => setDelaySeconds(Math.max(1, parseInt(e.target.value) || 0))}
                                            className="bg-transparent w-full outline-none text-xs font-bold"
                                        />
                                    </div>
                                </div>
                                
                                {isSending ? (
                                    <button 
                                        onClick={handleStop}
                                        className="h-12 w-24 bg-red-500 text-white rounded-2xl flex items-center justify-center font-bold text-xs hover:bg-red-600 transition-colors"
                                    >
                                        <Square size={14} fill="white" className="mr-2" /> STOP
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleStartSequence}
                                        disabled={selectedSenderIds.length === 0 || !receiverHandlesRaw || !messageText}
                                        className="h-12 w-24 bg-white text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xs hover:scale-105 transition-transform disabled:opacity-50"
                                    >
                                        DEPLOY
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-black border border-white/5 rounded-3xl overflow-hidden flex flex-col h-[520px]">
                        <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-slate-400">
                                <Terminal size={14} /> System_Log
                            </span>
                            <button onClick={() => setLogs([])} className="text-[9px] text-slate-500 hover:text-white transition-colors">CLEAR</button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-2 font-mono text-[10px]">
                            {logs.length === 0 && (
                                <div className="h-full flex items-center justify-center opacity-10 text-center px-4">
                                    <p className="uppercase tracking-widest text-[8px]">Waiting for sequence initiation...</p>
                                </div>
                            )}
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-2 leading-relaxed border-l border-white/5 pl-2">
                                    <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                                    <span className={
                                        log.type === 'error' ? 'text-red-500' : 
                                        log.type === 'success' ? 'text-emerald-400' : 'text-blue-400'
                                    }>
                                        {log.msg}
                                    </span>
                                </div>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Messages;