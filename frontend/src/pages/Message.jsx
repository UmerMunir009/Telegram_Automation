import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { 
    Send, Timer, MessageSquare, RefreshCcw, 
    Terminal, Zap, Loader2, Check, Square, Trash2, Layers
} from 'lucide-react';

const Messages = ({ token }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSenderIds, setSelectedSenderIds] = useState([]);
    const [receiverHandlesRaw, setReceiverHandlesRaw] = useState('');
    const [messageText, setMessageText] = useState('');
    const [delaySeconds, setDelaySeconds] = useState(10); 
    
    const [campaigns, setCampaigns] = useState([]);
    const stopSignals = useRef({});

    useEffect(() => {
        fetchAccounts();
    }, []);

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

    const addCampaignLog = (campaignId, msg, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString([], { hour12: false });
        setCampaigns(prev => prev.map(c => 
            c.id === campaignId 
            ? { ...c, logs: [...c.logs, { timestamp, msg, type }] } 
            : c
        ));
    };

    const toggleSender = (id) => {
        setSelectedSenderIds(prev => 
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const handleStopCampaign = (id) => {
        stopSignals.current[id] = true;
        addCampaignLog(id, "STOP SIGNAL RECEIVED. Ending deployment...", "error");
    };

    const removeCampaign = (id) => {
        setCampaigns(prev => prev.filter(c => c.id !== id));
        delete stopSignals.current[id];
    };

    const startNewCampaign = async () => {
        const handles = receiverHandlesRaw
            .split(/[\n,]+/)
            .map(h => h.trim())
            .filter(h => h !== '');

        if (selectedSenderIds.length === 0 || handles.length === 0 || !messageText) {
            toast.error("Please select senders, targets, and enter a message.");
            return;
        }

        const campaignId = Date.now();
        stopSignals.current[campaignId] = false;

        const newCampaign = {
            id: campaignId,
            timestamp: new Date().toLocaleTimeString(),
            targets: handles,
            senderIds: [...selectedSenderIds], 
            message: messageText,
            current: 0,
            total: handles.length,
            logs: [{ timestamp: new Date().toLocaleTimeString([], { hour12: false }), msg: "Campaign Initialized", type: 'info' }],
            status: 'running'
        };

        setCampaigns(prev => [newCampaign, ...prev]);
        
        setReceiverHandlesRaw('');
        setMessageText('');

        runDeployment(newCampaign);
    };

    const runDeployment = async (campaign) => {
        const { id, targets, senderIds, message } = campaign;

        for (let i = 0; i < targets.length; i++) {
            if (stopSignals.current[id]) break;

            const targetHandle = targets[i];
            const senderId = senderIds[i % senderIds.length];
            const senderAcc = accounts.find(a => a.id === senderId);
            const senderName = senderAcc?.name || senderAcc?.phone || "Node";

            try {
                addCampaignLog(id, `Sending to ${targetHandle} via node (${senderName})`, "info");
                
                const response = await axios.post(`${backendUrl}/telegram/send-message`, {
                    targetHandle: targetHandle,
                    message: message,
                    senderId: senderId
                }, { headers: { 'Authorization': `Bearer ${token}` } });

                if (response.data.success) {
                    addCampaignLog(id, `[OK] Delivered to ${targetHandle}`, "success");
                }
            } catch (error) {
                const errorMsg = error.response?.data?.message || "Internal Error";
                
                if (errorMsg.includes("PEER_FLOOD")) {
                    addCampaignLog(id, `[FAIL] ${targetHandle}: PEER_FLOOD (Account restricted/Privacy settings)`, "error");
                } else {
                    addCampaignLog(id, `[FAIL] ${targetHandle}: ${errorMsg}`, "error");
                }
            }

            setCampaigns(prev => prev.map(c => c.id === id ? { ...c, current: i + 1 } : c));

            if (i < targets.length - 1 && !stopSignals.current[id]) {
                const jitter = Math.floor(Math.random() * (delaySeconds * 0.4)) - (delaySeconds * 0.2);
                const finalDelay = Math.max(1, delaySeconds + jitter);
                await new Promise(resolve => setTimeout(resolve, finalDelay * 1000));
            }
        }

        addCampaignLog(id, "DEPLOYMENT SEQUENCE FINISHED.", "info");
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'finished' } : c));
    };

    return (
        <div className="min-h-screen text-slate-300 p-4 lg:p-8 ">
            <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
                
                <div className="col-span-12 lg:col-span-5 space-y-6">
                    <div className="border-b border-white/5 pb-6">
                        <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                            <Layers className="text-blue-500" /> CAMPAIGN HUB
                        </h1>
                        <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em]">Configure and launch multiple nodes</p>
                    </div>

                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-2">Node Selection</label>
                            <button onClick={fetchAccounts}><RefreshCcw size={14} className={loading ? "animate-spin" : ""} /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {accounts.map(acc => (
                                <button 
                                    key={acc.id} 
                                    onClick={() => toggleSender(acc.id)}
                                    className={`p-3 rounded-xl border text-left transition-all ${selectedSenderIds.includes(acc.id) ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-transparent'}`}
                                >
                                    <p className="text-[10px] font-bold text-white truncate">{acc.name || "Node"}</p>
                                    <p className="text-[9px] text-slate-500">{acc.phone}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                        <label className="text-[10px] font-bold text-emerald-400 uppercase block mb-3">Target Recipients</label>
                        <textarea 
                            value={receiverHandlesRaw} 
                            onChange={(e) => setReceiverHandlesRaw(e.target.value)}
                            className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-mono text-emerald-400 outline-none resize-none"
                            placeholder="@handle1, @handle2..."
                        />
                    </div>

                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                        <label className="text-[10px] font-bold text-purple-400 uppercase block mb-3">Transmission Message</label>
                        <textarea 
                            value={messageText} 
                            onChange={(e) => setMessageText(e.target.value)}
                            className="w-full h-24 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none resize-none"
                            placeholder="Message body..."
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 bg-slate-900/40 border border-white/5 rounded-2xl p-3 flex items-center gap-3">
                            <Timer size={16} className="text-slate-500" />
                            <input 
                                type="number" 
                                value={delaySeconds} 
                                onChange={(e) => setDelaySeconds(parseInt(e.target.value) || 1)}
                                className="bg-transparent w-full text-sm font-bold outline-none"
                            />
                        </div>
                        <button 
                            onClick={startNewCampaign}
                            className="px-8 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/40"
                        >
                            START CAMPAIGN
                        </button>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-7 space-y-4 h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Live Monitor ({campaigns.length})</h2>
                    
                    {campaigns.length === 0 && (
                        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[40px] opacity-20">
                            <Zap size={40} />
                            <p className="text-[10px] mt-4 font-bold tracking-[0.4em]">NO ACTIVE DEPLOYMENTS</p>
                        </div>
                    )}

                    {campaigns.map(camp => (
                        <div key={camp.id} className="bg-slate-900/80 border border-white/10 rounded-[32px] p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${camp.status === 'running' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
                                        <h3 className="font-black text-white text-sm uppercase tracking-tight">Campaign_{camp.id}</h3>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1">Launched at {camp.timestamp} • {camp.senderIds.length} Nodes</p>
                                </div>
                                <div className="flex gap-2">
                                    {camp.status === 'running' && (
                                        <button onClick={() => handleStopCampaign(camp.id)} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20">
                                            <Square size={16} fill="currentColor" />
                                        </button>
                                    )}
                                    <button onClick={() => removeCampaign(camp.id)} className="p-2 bg-white/5 text-slate-500 rounded-xl hover:text-white">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase">
                                    <span className="text-blue-400">Progress</span>
                                    <span className="text-white">{camp.current} / {camp.total}</span>
                                </div>
                                <div className="h-2 bg-black rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-700 ${camp.status === 'finished' ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                        style={{ width: `${(camp.current / camp.total) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="bg-black/50 rounded-2xl p-4 h-40 overflow-y-auto font-mono text-[10px] space-y-1 custom-scrollbar">
                                {camp.logs.map((log, idx) => (
                                    <div key={idx} className="flex gap-2 border-l border-white/5 pl-2">
                                        <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                                        <span className={log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : 'text-blue-400'}>
                                            {log.msg}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Messages;