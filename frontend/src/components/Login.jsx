import React, { useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { Lock, Mail, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = ({ setTheToken }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await axios.post(`${backendUrl}/admin-login`, { email, password });

            if (response.data.accessToken) {
                setTheToken(response.data.accessToken);
                toast.success("Authentication Successful");
            } else {
                toast.error(response.data.message || "Unauthorized Access");
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Connection to server failed';
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center w-full bg-[#0f172a] relative overflow-hidden px-4">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-blue-600 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-20"></div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md z-10"
            >
                {/* Branding Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl mb-4 border border-blue-500/20">
                        <ShieldCheck className="w-10 h-10 text-blue-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Admin Portal</h1>
                    <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest font-semibold">TG-Automation Bot</p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Work Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input 
                                    type="email" 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    value={email} 
                                    placeholder="name@company.com" 
                                    required 
                                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-slate-600" 
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    onChange={(e) => setPassword(e.target.value)} 
                                    value={password} 
                                    placeholder="••••••••" 
                                    required  
                                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-3.5 pl-11 pr-12 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-slate-600" 
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                            disabled={isLoading}
                            className={`w-full relative py-4 rounded-xl font-bold text-white transition-all overflow-hidden
                                ${isLoading 
                                    ? 'bg-slate-800 cursor-not-allowed text-slate-500' 
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] shadow-lg shadow-blue-500/20'
                                }`}
                            type="submit"
                        >
                            <div className="flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <span>Sign In to Dashboard</span>
                                )}
                            </div>
                        </button>
                    </form>
                </div>

                {/* Footer Info */}
                <p className="text-center mt-8 text-slate-500 text-xs">
                    &copy; 2026 TG-Automation Bot. Secured with end-to-end encryption.
                </p>
            </motion.div>
        </div>
    );
};

export default Login;