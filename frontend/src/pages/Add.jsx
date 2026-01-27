import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { 
    Phone, User as UserIcon, Globe, Shield, Loader2, Cpu, 
    CheckCircle2, Terminal, Send, X, Lock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Add = ({ token }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [proxyId, setProxyId] = useState('');
    const [proxies, setProxies] = useState([]);
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [phoneCodeHash, setPhoneCodeHash] = useState('');
    const [requires2FA, setRequires2FA] = useState(false);
    
    const [loader, setLoader] = useState(false);
    const [fetchingProxies, setFetchingProxies] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [logs, setLogs] = useState(["SYSTEM_READY: Awaiting deployment parameters..."]);
    const terminalEndRef = useRef(null);

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs(prev => [...prev, `[${time}] ${msg}`]);
    };

    const hardResetFlow = (customMsg) => {
        setOtp('');
        setPassword('');
        setRequires2FA(false);
        setShowOtpModal(false);
        setPhoneCodeHash('');
        addLog(customMsg || "SESSION_TERMINATED: Security protocol forced reset. Restart flow.");
    };

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    useEffect(() => {
        const fetchAvailableProxies = async () => {
            setFetchingProxies(true);
            addLog("SYNCING_NETWORK_NODES...");
            try {
                const response = await axios.get(`${backendUrl}/proxy/get`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.data.success || response.data.statusCode === 200) {
                    setProxies(response.data.data || []);
                    addLog(`VIRTUAL_RELAYS_FOUND: ${response.data.data?.length || 0} units online.`);
                }
            } catch (error) {
                addLog("CRITICAL_ERROR: Proxy synchronization failed.");
            } finally {
                setFetchingProxies(false);
            }
        };
        fetchAvailableProxies();
    }, [token]);

    const handleInitialSubmit = async (e) => {
        e.preventDefault();
        if (!phone.startsWith('+')) return toast.warning("International prefix required (e.g. +1)");
        if (proxyId === '') return toast.warning("Please select a network path");

        setLoader(true);
        addLog(`INITIATING_HANDSHAKE: Target ${phone}`);

        try {
            const response = await axios.post(
                `${backendUrl}/telegram/login`, 
                { name, phone, proxyId: proxyId || null }, 
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success) {
                setPhoneCodeHash(response.data.data.phoneCodeHash);
                addLog("HANDSHAKE_COMPLETE: Challenge issued.");
                setShowOtpModal(true);
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Handshake failed';
            addLog(`UPLINK_ERROR: ${msg.toUpperCase()}`);
            toast.error(msg);
        } finally {
            setLoader(false);
        }
    };

    const handleOtpVerify = async () => {
    if (!otp) return toast.error("OTP is required");
    setLoader(true);

    try {
        const response = await axios.post(`${backendUrl}/telegram/verify`, {
            phone,
            code: otp,
            phoneCodeHash,
            password: password || null 
        }, { headers: { 'Authorization': `Bearer ${token}` } });

        if (response.data.success) {
            addLog("SESSION_ESTABLISHED: Node deployment successful.");
            toast.success('Account linked successfully');
            setTimeout(() => {
                setShowOtpModal(false);
                setName(''); setPhone(''); setOtp(''); setProxyId(''); setPassword('');
                setRequires2FA(false);
            }, 1500);
        } else if (response.data.requires2FA) {
            setRequires2FA(true);
            addLog("2FA_CHALLENGE: Cloud Password required.");
            toast.info("This account has 2FA. Please enter your Cloud Password.");
        }
    } catch (error) {
        const errData = error.response?.data;
        const msg = errData?.message || "Verification failed";

        if (error.response?.status === 402) {
            addLog(`AUTH_RETRY: INVALID_PASSWORD`);
            toast.error("Incorrect Cloud Password. Please try again.");
        } else if (error.response?.status === 403 || errData?.killed) {
            toast.error(msg);
            hardResetFlow(`SECURITY_RESET: ${msg.toUpperCase()}`);
        } else {
            addLog(`AUTH_ERROR: ${msg.toUpperCase()}`);
            toast.error(msg);
        }
    } finally {
        setLoader(false);
    }
};

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:items-end justify-between gap-4 border-b border-white/5 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <Cpu className="text-blue-500 w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Add Account</h1>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Telegram automation node provisioning</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <form onSubmit={handleInitialSubmit} className="lg:col-span-7 space-y-6">
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Identity Alias</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        onChange={(e) => setName(e.target.value)} value={name} required
                                        className="w-full bg-black/40 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 focus:border-blue-500 outline-none transition-all"
                                        placeholder="ALFA_UNIT_01"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        onChange={(e) => setPhone(e.target.value)} value={phone} required
                                        className="w-full bg-black/40 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 focus:border-blue-500 outline-none transition-all font-mono"
                                        placeholder="+1..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 space-y-4">
                            <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest px-1">Network Path Binding</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                <div
                                    onClick={() => setProxyId('')}
                                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${proxyId === '' ? 'bg-blue-500/10 border-blue-500' : 'bg-black/40 border-white/5'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Globe size={14} className={proxyId === '' ? 'text-blue-500' : 'text-slate-500'} />
                                        <span className="text-[11px] font-bold text-white">PUBLIC_IP_ROUTING</span>
                                    </div>
                                </div>
                                {proxies.map((p) => (
                                    <div
                                        key={p.id} onClick={() => setProxyId(p.id)}
                                        className={`cursor-pointer p-4 rounded-2xl border transition-all ${proxyId === p.id ? 'bg-blue-500/10 border-blue-500' : 'bg-black/40 border-white/5'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Shield size={14} className={proxyId === p.id ? 'text-blue-500' : 'text-slate-500'} />
                                                <span className="text-[11px] font-mono text-white">{p.host.substring(0, 15)}</span>
                                            </div>
                                            {proxyId === p.id && <CheckCircle2 size={14} className="text-blue-500" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            disabled={loader} type="submit"
                            className={`w-full mt-10 py-5 rounded-2xl font-black text-xs tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-3 ${loader ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                        >
                            {loader ? <Loader2 className="animate-spin" /> : <Send size={16} />}
                            {loader ? 'Processing...' : 'Execute Deployment'}
                        </button>
                    </div>
                </form>

                <div className="lg:col-span-5">
                    <div className="bg-black/60 border border-white/5 rounded-3xl p-6 flex flex-col h-[450px]">
                        <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                            <Terminal size={14} className="text-blue-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Process_Monitor</span>
                        </div>
                        <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 custom-scrollbar">
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-3">
                                    <span className="text-blue-900 shrink-0">#</span>
                                    <span className={log.includes('ERROR') || log.includes('TERMINATED') || log.includes('RESET') ? 'text-red-400' : 'text-slate-300'}>{log}</span>
                                </div>
                            ))}
                            <div ref={terminalEndRef} />
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showOtpModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 relative shadow-2xl"
                        >
                            <button onClick={() => setShowOtpModal(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={20} /></button>

                            <div className="text-center space-y-4 mb-8">
                                <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                                    <Lock className="text-blue-500" size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Node Verification</h3>
                                <p className="text-xs text-slate-500">Provide the synchronization code and cloud password (if applicable).</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">OTP Code</label>
                                    <input
                                        value={otp} onChange={e => setOtp(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-2xl p-4 text-center text-2xl font-black tracking-widest text-blue-500 outline-none focus:border-blue-500"
                                        maxLength={6} placeholder="000000"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cloud Password (2FA)</label>
                                    <input
                                        type="password"
                                        value={password} onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-2xl p-4 text-center text-lg font-bold text-white outline-none focus:border-blue-500"
                                        placeholder="Optional if 2FA off"
                                    />
                                </div>

                                <button
                                    onClick={handleOtpVerify} disabled={loader}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-3"
                                >
                                    {loader ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={16} />}
                                    {loader ? 'VERIFYING...' : 'Authorize & Deploy'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Add;