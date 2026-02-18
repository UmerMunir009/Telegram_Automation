import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { Send, Zap, Loader2, ArrowLeft, Search, MoreVertical, Paperclip, Smile, X, CheckCheck, Waypoints, Check } from 'lucide-react';

const ChatPortal = ({ token }) => {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [chats, setChats] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedChat, setSelectedChat] = useState(null);
    const [selectedChatTitle, setSelectedChatTitle] = useState("");
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");

    const [loading, setLoading] = useState({ accounts: false, chats: false, messages: false });
    const [isSending, setIsSending] = useState(false);

    const scrollRef = useRef(null);
    const avatarColors = ['bg-orange-500', 'bg-blue-500', 'bg-red-400', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500'];

    const filteredChats = chats.filter(chat =>
        chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAccounts = accounts.filter(acc =>
        acc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.phone?.includes(searchQuery)
    );

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
                if (res.data.success || res.data.statusCode === 200) {
                    setAccounts(res.data.data);
                }
            } catch (err) { console.error(err); }
            setLoading(prev => ({ ...prev, accounts: false }));
        };
        fetchAccounts();
    }, [token]);

    const fetchChats = async (phone) => {
        setSelectedAccount(phone);
        setSearchQuery("");
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
        setMessages([]);
        setSelectedChat(chat.id);
        setSelectedChatTitle(chat.title);
        setLoading(prev => ({ ...prev, messages: true }));
        try {
            const res = await axios.get(`${backendUrl}/telegram/chat/messages/${selectedAccount}/${chat.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data.success) setMessages(res.data.history.reverse());
        } catch (err) {
            console.error("Message Fetch Error:", err);
            setMessages([]);
        }
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
                    id: res.data.sentMessage.id,
                    text: inputMessage,
                    out: true,
                    seen: false, 
                    date: res.data.sentMessage.date
                }]);
                setInputMessage("");
            }
        } catch (err) { console.error(err); } finally {
            setIsSending(false);
        }
    };



    return (
        <div className="fixed inset-0 bg-[#0f0f0f] flex items-center justify-center overflow-hidden font-sans p-0 md:p-4">
            <div className="flex w-full h-full md:max-w-[1400px] md:h-[85vh] bg-[#1c1c1c] text-white overflow-hidden md:rounded-xl shadow-2xl border border-white/5">

                <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[350px] lg:w-[400px] bg-[#1c1c1c] border-r border-white/10`}>
                    <div className="p-4 border-b border-white/5 flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            {selectedAccount ? (
                                <button onClick={() => { setSelectedAccount(null); setChats([]); }} className="p-2 hover:bg-white/5 rounded-full text-gray-400">
                                    <ArrowLeft size={20} />
                                </button>
                            ) : (
                                <div className="text-blue-500 font-bold text-lg flex items-center gap-2 px-2">
                                    <Waypoints size={20} fill="currentColor" /> Telegram
                                </div>
                            )}
                        </div>
                        <div className="bg-[#242424] flex items-center px-4 py-2 rounded-lg border border-transparent focus-within:border-blue-500/50 transition-all">
                            <Search size={18} className="text-gray-500 mr-3" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search"
                                className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-600"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading.accounts || loading.chats ? (
                            <div className="flex flex-col items-center justify-center h-32 gap-3">
                                <Loader2 className="animate-spin text-blue-500" size={24} />
                                <span className="text-xs text-gray-500 font-medium">Fetching chats...</span>
                            </div>
                        ) : !selectedAccount ? (
                            filteredAccounts.map((acc, i) => (
                                <div key={acc.id} onClick={() => fetchChats(acc.phone)} className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5">
                                    <div className={`w-12 h-12 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center font-bold text-lg shrink-0`}>
                                        {acc.name?.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate text-[15px]">{acc.name || "Unknown"}</h3>
                                        <p className="text-[12px] text-gray-500 mt-0.5">{acc.phone}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            filteredChats.map((chat, i) => (
                                <div key={chat.id} onClick={() => fetchMessages(chat)} className={`flex items-center gap-4 px-5 py-3 cursor-pointer transition-all ${selectedChat === chat.id ? 'bg-[#3390ec]' : 'hover:bg-white/5'}`}>
                                    <div className={`w-12 h-12 rounded-full ${selectedChat === chat.id ? 'bg-white/20' : avatarColors[i % avatarColors.length]} flex items-center justify-center font-bold text-lg shrink-0`}>
                                        {chat.title?.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <h3 className="font-semibold truncate text-[15px]">{chat.title}</h3>
                                            <span className={`text-[11px] ${selectedChat === chat.id ? 'text-white/70' : 'text-gray-500'}`}>18:45</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className={`text-[13px] truncate flex-1 ${selectedChat === chat.id ? 'text-white/80' : 'text-gray-400'}`}>
                                                {chat.lastMessage || "Media"}
                                            </p>
                                            {chat.unreadCount > 0 && selectedChat !== chat.id && (
                                                <div className="ml-2 bg-[#31a54f] text-white text-[10px] font-bold min-w-[20px] h-[20px] flex items-center justify-center rounded-full px-1 shadow-sm">
                                                    {chat.unreadCount}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className={`${!selectedChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col relative bg-[#0e1621]`}>
                    {selectedChat ? (
                        <>
                            <div className="h-[65px] bg-[#1c1c1c] border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-20 shadow-md">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <button onClick={() => setSelectedChat(null)} className="md:hidden p-2 text-gray-400 hover:bg-white/5 rounded-full">
                                        <ArrowLeft size={22} />
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold shrink-0">
                                        {selectedChatTitle?.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className="truncate">
                                        <h3 className="font-bold text-[16px] truncate leading-tight">{selectedChatTitle}</h3>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2.5 text-gray-400 hover:bg-white/10 rounded-full"><Search size={20} /></button>
                                    <button className="p-2.5 text-gray-400 hover:bg-white/10 rounded-full"><MoreVertical size={20} /></button>
                                </div>
                            </div>

                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-6 flex flex-col gap-2 relative"
                                style={{
                                    backgroundImage: `url('https://i.pinimg.com/originals/85/70/f6/8570f6339d318933fa3068d60239611e.jpg')`,
                                    backgroundBlendMode: 'soft-light',
                                    backgroundSize: '500px',
                                    backgroundColor: '#0e1621'
                                }}
                            >
                                {loading.messages ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-4">
                                        <div className="p-4 bg-[#1c1c1c]/90 rounded-2xl shadow-2xl border border-white/5">
                                            <Loader2 className="animate-spin text-blue-500" size={32} />
                                        </div>
                                        <span className="text-sm font-medium text-white/50 tracking-wide">Loading history...</span>
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`relative max-w-[80%] sm:max-w-[550px] p-3 px-4 rounded-2xl text-[15px] shadow-sm 
        ${msg.out
                                                    ? 'self-end bg-[#2b5278] text-white rounded-br-none bubble-out'
                                                    : 'self-start bg-[#182533] text-white rounded-bl-none bubble-in'}`}
                                        >
                                            <div className="break-words pr-12 leading-relaxed">{msg.text}</div>

                                            <div className="text-[10px] text-white/40 absolute bottom-2 right-3 flex items-center gap-1">
                                                {new Date(msg.date * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}

                                                {msg.out && (
                                                    msg.seen ? (
                                                        <CheckCheck size={14} className="text-blue-400" />
                                                    ) : (
                                                        <Check size={14} className="text-gray-400" />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="bg-[#1c1c1c] p-4 flex justify-center border-t border-white/5">
                                <div className="max-w-[900px] w-full flex items-center gap-4">
                                    <div className="flex-1 bg-[#242424] rounded-xl flex items-center px-4 py-1">
                                        <button className="p-2 text-gray-500 hover:text-blue-500"><Smile size={24} /></button>
                                        <textarea
                                            rows="1"
                                            value={inputMessage}
                                            disabled={isSending || loading.messages}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                                            placeholder="Type a message..."
                                            className="bg-transparent flex-1 outline-none text-[15px] py-3 px-2 resize-none max-h-[120px] text-white placeholder-gray-600"
                                        />
                                        <button className="p-2 text-gray-500 hover:text-blue-500"><Paperclip size={22} /></button>
                                    </div>
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={isSending || !inputMessage.trim() || loading.messages}
                                        className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-lg shrink-0 disabled:opacity-50"
                                    >
                                        {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-1" />}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-[#111921]">
                            <div className="bg-[#229ED9] p-3 rounded-full inline-flex items-center justify-center shadow-xl">
                                <Waypoints size={32} color="white" strokeWidth={2.5} style={{ transform: 'rotate(-10deg) translateX(2px)' }} />
                            </div>
                            <h2 className="text-xl font-bold mb-2 mt-4">Welcome to Telegram</h2>
                            <p className="text-gray-500 text-sm text-center">Select an account and a conversation from the left<br />to start managing your messages.</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .bubble-out::after { content: ''; position: absolute; right: -8px; bottom: 0; width: 0; height: 0; border-left: 10px solid #2b5278; border-top: 10px solid transparent; }
                .bubble-in::after { content: ''; position: absolute; left: -8px; bottom: 0; width: 0; height: 0; border-right: 10px solid #182533; border-top: 10px solid transparent; }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
            `}</style>
        </div>
    );
};

export default ChatPortal;