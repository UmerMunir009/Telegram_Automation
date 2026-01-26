import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { 
    Phone, User as UserIcon, Globe, Shield, Loader2, Cpu, 
    Info, CheckCircle2, Terminal, Send, X, Lock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Add = ({ token }) => {
    // Form States
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [proxyId, setProxyId] = useState('');
    const [proxies, setProxies] = useState([]);
    
    // Auth Flow States
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [phoneCodeHash, setPhoneCodeHash] = useState('');
    const [requires2FA, setRequires2FA] = useState(false);

    // UI States
    const [loader, setLoader] = useState(false);
    const [fetchingProxies, setFetchingProxies] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [logs, setLogs] = useState(["SYSTEM_READY: Awaiting deployment parameters..."]);
    const terminalEndRef = useRef(null);

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs(prev => [...prev, `[${time}] ${msg}`]);
    };

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // Fetch Proxies on Mount
    useEffect(() => {
        const fetchAvailableProxies = async () => {
            setFetchingProxies(true);
            addLog("SYNCING_NETWORK_NODES...");
            try {
                const response = await axios.get(`${backendUrl}/proxy/get`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.data.statusCode === 200 || response.data.success) {
                    const data = response.data.data || [];
                    setProxies(data);
                    addLog(`VIRTUAL_RELAYS_FOUND: ${data.length} units online.`);
                }
            } catch (error) {
                addLog("CRITICAL_ERROR: Proxy synchronization failed.");
                toast.error("Network Error: Could not sync proxy list");
            } finally {
                setFetchingProxies(false);
            }
        };
        fetchAvailableProxies();
    }, [token]);

    /**
     * STEP 1: Initiation
     * Calls /telegram/login to trigger OTP
     */
    const handleInitialSubmit = async (e) => {
        e.preventDefault();
        if (!phone.startsWith('+')) {
            return toast.warning("International prefix required (e.g. +1)");
        }

        if (proxyId ==='') {
            return toast.warning("Please select a network path binding option");
        }


        setLoader(true);
        addLog(`INITIATING_TELEGRAM_HANDSHAKE: Target ${phone}`);

        try {
            const response = await axios.post(
                `${backendUrl}/telegram/login`, 
                { name, phone, proxyId: proxyId || null }, 
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success) {
                // IMPORTANT: Save the hash for the verification step
                setPhoneCodeHash(response.data.data.phoneCodeHash);
                addLog("HANDSHAKE_COMPLETE: Telegram challenge issued.");
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

    /**
     * STEP 2: Verification
     * Calls /telegram/verify with OTP and optional 2FA password
     */
    const handleOtpVerify = async () => {
        if (!otp && !requires2FA) return toast.error("OTP is required");
        
        setLoader(true);
        addLog(requires2FA ? "ATTEMPTING_PASSWORD_INJECTION..." : "INJECTING_AUTH_TOKEN...");
        
        try {
            const response = await axios.post(`${backendUrl}/telegram/verify`, {
                phone,
                code: otp,
                phoneCodeHash,
                password: password || null
            }, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });

            if (response.data.success) {
                addLog("SESSION_ESTABLISHED: Node deployment successful.");
                toast.success('Account linked successfully');
                
                // Reset State
                setTimeout(() => {
                    setShowOtpModal(false);
                    setName(''); setPhone(''); setOtp(''); setProxyId(''); setPassword('');
                    setRequires2FA(false);
                    addLog("SYSTEM_IDLE: Standing by.");
                }, 2000);
            } else if (response.data.requires2FA) {
                // If backend detects 2FA is needed, pivot UI
                addLog("SIGNAL_INTERCEPTED: Cloud Password (2FA) required.");
                setRequires2FA(true);
                toast.info("Please enter your Telegram Cloud Password");
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Verification failed";
            addLog(`AUTH_FAILED: ${msg.toUpperCase()}`);
            toast.error(msg);
        } finally {
            setLoader(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <Cpu className="text-blue-500 w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Add Account</h1>
                    </div>
                    <p className="text-slate-500 text-sm font-medium tracking-wide">Telegram automation node provisioning</p>
                </div>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> 
                        System Online
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Form */}
                <form onSubmit={handleInitialSubmit} className="lg:col-span-7 space-y-6">
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Shield size={120} />
                        </div>

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
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Network Path Binding</label>
                                {fetchingProxies && <Loader2 size={12} className="animate-spin text-blue-500" />}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                <div
                                    onClick={() => setProxyId('')}
                                    className={`cursor-pointer group relative p-4 rounded-2xl border transition-all duration-300 ${proxyId === '' ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg transition-colors ${proxyId === '' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                            <Globe size={14} />
                                        </div>
                                        <div>
                                            <p className={`text-[11px] font-bold uppercase tracking-tight ${proxyId === '' ? 'text-blue-400' : 'text-slate-300'}`}>SELECT ONE</p>
                                            <p className="text-[9px] text-slate-500 font-mono">PUBLIC_IP_ROUTING</p>
                                        </div>
                                    </div>
                                </div>

                                {proxies.map((p) => (
                                    <div
                                        key={p.id} onClick={() => setProxyId(p.id)}
                                        className={`cursor-pointer group relative p-4 rounded-2xl border transition-all duration-300 ${proxyId === p.id ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${proxyId === p.id ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                                    <Shield size={14} />
                                                </div>
                                                <div>
                                                    <p className={`text-[11px] font-bold font-mono ${proxyId === p.id ? 'text-blue-400' : 'text-slate-300'}`}>{p.host.substring(0, 15)}</p>
                                                    <p className="text-[9px] text-slate-500 font-mono italic">SOCKS5 : {p.port}</p>
                                                </div>
                                            </div>
                                            {proxyId === p.id && <CheckCircle2 size={14} className="text-blue-500" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            disabled={loader} type="submit"
                            className={`w-full mt-10 py-5 rounded-2xl font-black text-xs tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-3 ${loader ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'}`}
                        >
                            {loader ? <Loader2 className="animate-spin" /> : <Send size={16} />}
                            {loader ? 'Processing...' : 'Execute Deployment'}
                        </button>
                    </div>
                </form>

                {/* Terminal Monitor */}
                <div className="lg:col-span-5">
                    <div className="bg-black/60 border border-white/5 rounded-3xl p-6 flex flex-col h-[450px] sticky top-8">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <div className="flex items-center gap-2">
                                <Terminal size={14} className="text-blue-500" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Process_Monitor</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 pr-2 custom-scrollbar">
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-left-1 duration-300">
                                    <span className="text-blue-900 shrink-0 select-none">#</span>
                                    <span className={log.includes('ERROR') ? 'text-red-400' : 'text-slate-300'}>{log}</span>
                                </div>
                            ))}
                            <div ref={terminalEndRef} />
                        </div>
                    </div>
                </div>
            </div>

            {/* OTP / 2FA Modal */}
            <AnimatePresence>
                {showOtpModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-md bg-slate-900 border border-blue-500/30 rounded-[2rem] p-10 shadow-2xl relative"
                        >
                            <button onClick={() => setShowOtpModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={20} /></button>

                            <div className="text-center space-y-4 mb-8">
                                <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                                    <Lock className="text-blue-500" size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                                    {requires2FA ? 'Identity Verification' : 'Challenge Required'}
                                </h3>
                                <p className="text-xs text-slate-500 px-4">
                                    {requires2FA ? 'Enter your Telegram Cloud Password to finalize encryption.' : 'Enter the synchronization code sent to your Telegram account.'}
                                </p>
                            </div>

                            {!requires2FA ? (
                                <input
                                    value={otp} onChange={e => setOtp(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-2xl p-5 text-center text-3xl font-black tracking-[0.5em] text-blue-500 outline-none focus:border-blue-500 mb-8"
                                    maxLength={6} placeholder="00000"
                                />
                            ) : (
                                <input
                                    type="password"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-2xl p-5 text-center text-xl font-bold tracking-widest text-blue-500 outline-none focus:border-blue-500 mb-8"
                                    placeholder="CLOUD_PASSWORD"
                                />
                            )}

                            <button
                                onClick={handleOtpVerify} disabled={loader}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20"
                            >
                                {loader ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={16} />}
                                {loader ? 'VERIFYING...' : requires2FA ? 'Authorize Session' : 'Verify & Link Node'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Add;