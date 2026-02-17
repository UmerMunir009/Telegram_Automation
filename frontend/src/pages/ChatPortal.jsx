import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { User, MessageSquare, Send, Zap, Loader2, ChevronLeft, ArrowLeft, Menu } from 'lucide-react';

const ChatPortal = ({ token }) => {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [selectedChatTitle, setSelectedChatTitle] = useState("");
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [loading, setLoading] = useState({ accounts: false, chats: false, messages: false });
    const [isSending, setIsSending] = useState(false);

    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const fetchAccounts = async () => {
            setLoading(prev => ({ ...prev, accounts: true }));
            try {
                const res = await axios.get(`${backendUrl}/user/get`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.data.statusCode === 200 || res.data.success) {
                    setAccounts(res.data.data);
                }
            } catch (err) { console.error("Fetch Error:", err); }
            setLoading(prev => ({ ...prev, accounts: false }));
        };
        fetchAccounts();
    }, [token]);

    const fetchChats = async (phone) => {
        setSelectedAccount(phone);
        setChats([]);
        setSelectedChat(null);
        setLoading(prev => ({ ...prev, chats: true }));
        try {
            const res = await axios.get(`${backendUrl}/telegram/account/chats/${phone}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data.success) setChats(res.data.chats);
        } catch (err) { console.error(err); }
        setLoading(prev => ({ ...prev, chats: false }));
    };

    const fetchMessages = async (chat) => {
        setSelectedChat(chat.id);
        setSelectedChatTitle(chat.title);
        setLoading(prev => ({ ...prev, messages: true }));
        try {
            const res = await axios.get(`${backendUrl}/telegram/chat/messages/${selectedAccount}/${chat.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data.success) setMessages(res.data.history.reverse());
        } catch (err) { console.error(err); }
        setLoading(prev => ({ ...prev, messages: false }));
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !selectedAccount || !selectedChat) return;
        setIsSending(true);
        try {
            const res = await axios.post(`${backendUrl}/telegram/chat/send/${selectedAccount}`,
                { chatId: selectedChat, message: inputMessage },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (res.data.success) {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    text: inputMessage,
                    out: true,
                    date: Math.floor(Date.now() / 1000)
                }]);
                setInputMessage("");
            }
        } catch (err) { console.error("Send Error:", err); } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-[85vh] md:h-[82vh] bg-slate-950/40 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">

            <div className={`
                ${selectedChat ? 'hidden md:flex' : 'flex'} 
                w-full md:w-[350px] lg:w-[400px] flex-col border-r border-white/5 bg-slate-900/20 h-full
            `}>

                <div className="p-4 md:p-5 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        {selectedAccount && (
                            <button
                                onClick={() => { setSelectedAccount(null); setChats([]); }}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-blue-400"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                            {selectedAccount ? "Messages" : "Accounts"}
                        </h2>
                    </div>
                    <div className="md:hidden">
                        <Zap size={20} className="text-blue-500" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar touch-pan-y">
                    {!selectedAccount ? (
                        <div className="p-3 md:p-4 grid grid-cols-1 gap-2 md:gap-3">
                            {loading.accounts ? (
                                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-400" /></div>
                            ) : (
                                accounts.map(acc => (
                                    <div
                                        key={acc.id}
                                        onClick={() => fetchChats(acc.phone)}
                                        className="group flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl bg-slate-800/40 border border-white/5 hover:border-blue-500/50 hover:bg-slate-800 transition-all cursor-pointer"
                                    >
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg text-sm md:text-base">
                                            {acc.name?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-slate-100 font-semibold truncate">{acc.name || "Unknown"}</p>
                                            <p className="text-[10px] md:text-xs text-slate-500 font-mono truncate">{acc.phone}</p>
                                        </div>
                                        <ChevronLeft size={16} className="text-slate-600 group-hover:text-blue-400 rotate-180 transition-colors" />
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col min-h-full">
                            {loading.chats ? (
                                <div className="flex flex-col items-center justify-center p-10 gap-3">
                                    <Loader2 className="animate-spin text-blue-400" />
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Syncing Cloud...</span>
                                </div>
                            ) : (
                                chats.map(chat => (
                                    <div
                                        key={chat.id}
                                        onClick={() => fetchMessages(chat)}
                                        className={`p-3 md:p-4 cursor-pointer border-b border-white/5 transition-all flex flex-col gap-0.5 md:gap-1
                                        ${selectedChat === chat.id ? 'bg-blue-600/20 border-l-4 border-l-blue-400' : 'hover:bg-white/5'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-sm md:text-base text-slate-200 truncate pr-2">{chat.title}</span>
                                            {chat.unreadCount > 0 && (
                                                <span className="bg-blue-500 text-white text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-full">{chat.unreadCount}</span>
                                            )}
                                        </div>
                                        <p className="text-[11px] md:text-xs text-slate-500 truncate italic">{chat.lastMessage}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className={`
                ${!selectedChat ? 'hidden md:flex' : 'flex'} 
                flex-1 flex-col bg-gradient-to-br from-slate-900 to-[#020617] relative h-full
            `}>
                {selectedChat ? (
                    <>
                        <div className="p-4 md:p-5 border-b border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedChat(null)}
                                    className="md:hidden p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-blue-400"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30 font-bold text-sm md:text-base">
                                    {selectedChatTitle.substring(0, 1)}
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-white font-bold leading-none truncate text-sm md:text-base">{selectedChatTitle}</h3>
                                    <span className="hidden sm:inline-block text-[9px] md:text-[10px] text-blue-400 uppercase tracking-widest font-bold mt-1">Encrypted Connection</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedChat(null)} className="hidden md:block text-slate-500 hover:text-white transition-colors">
                                <ArrowLeft size={18} />
                            </button>
                        </div>

                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-3 md:gap-4 custom-scrollbar touch-pan-y"
                            style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/carbon-fibre.png')`, backgroundAttachment: 'fixed' }}
                        >
                            {loading.messages ? (
                                <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-blue-500" /></div>
                            ) : (
                                messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-xl md:rounded-3xl text-[13px] md:text-sm leading-relaxed shadow-xl border
                    ${msg.out
                                                ? 'self-end bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none border-blue-400/30'
                                                : 'self-start bg-slate-800 text-slate-200 rounded-tl-none border-white/5'}`}
                                    >
                                        {msg.text}
                                        <div className={`text-[8px] md:text-[9px] mt-1.5 md:mt-2 opacity-60 flex items-center gap-1 ${msg.out ? 'justify-end' : 'justify-start'}`}>
                                            {new Date(msg.date * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 md:p-6 bg-slate-950/50 border-t border-white/10 shrink-0">
                            <div className={`flex items-center gap-2 md:gap-3 bg-slate-800/80 rounded-xl md:rounded-2xl px-3 md:px-5 py-2 md:py-3 border transition-all shadow-2xl
    ${isSending ? 'opacity-70 border-white/5' : 'border-white/10 focus-within:border-blue-500/50'}`}>

                                <input
                                    type="text"
                                    value={inputMessage}
                                    disabled={isSending}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder={isSending ? "Sending..." : "Type a message..."}
                                    className="bg-transparent flex-1 outline-none text-[13px] md:text-sm text-slate-200 placeholder-slate-500 disabled:cursor-not-allowed"
                                />

                                <button
                                    onClick={handleSendMessage}
                                    disabled={isSending || !inputMessage.trim()}
                                    className={`p-2 md:p-3 rounded-lg md:rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center
        ${isSending || !inputMessage.trim()
                                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                            : 'bg-blue-500 text-white hover:bg-blue-400 hover:scale-105 shadow-blue-500/20'}`}
                                >
                                    {isSending ? (
                                        <Loader2 size={16} className="animate-spin md:w-[18px] md:h-[18px]" />
                                    ) : (
                                        <Send size={16} className="md:w-[18px] md:h-[18px]" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 md:p-10">
                        <div className="relative mb-6 md:mb-8">
                            <div className="absolute inset-0 bg-blue-500/20 blur-[60px] md:blur-[100px] rounded-full"></div>
                            <div className="relative w-20 h-20 md:w-28 md:h-28 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-2xl rotate-12">
                                <Zap size={40} className="text-white md:size-14 -rotate-12 animate-pulse" />
                            </div>
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black text-white mb-3 md:mb-4 tracking-tight">
                            M-Link <span className="text-blue-500">Chat Center</span>
                        </h2>
                        <p className="text-slate-400 text-sm md:text-lg max-w-sm leading-relaxed mb-6 md:mb-8">
                            Select an account and conversation to manage live cloud dialogs.
                        </p>
                        <div className="hidden sm:flex gap-4">
                            <div className="px-4 py-2 rounded-full border border-white/5 bg-white/5 text-[10px] text-slate-500 uppercase tracking-tighter">MTProto Secure</div>
                            <div className="px-4 py-2 rounded-full border border-white/5 bg-white/5 text-[10px] text-slate-500 uppercase tracking-tighter">Multi-Session</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPortal;