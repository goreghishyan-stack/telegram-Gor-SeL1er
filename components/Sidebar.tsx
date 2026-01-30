
import React, { useState } from 'react';
import { ChatThread, User, Theme } from '../types';

interface SidebarProps {
  threads: ChatThread[];
  activeThreadId: string;
  onSelectThread: (id: string) => void;
  onOpenAddFriend: () => void;
  currentUser: User | null;
  onOpenMenu: () => void;
  theme: Theme;
  onlineUsers: User[];
}

const Sidebar: React.FC<SidebarProps> = ({ threads, activeThreadId, onSelectThread, onOpenAddFriend, onOpenMenu, currentUser, theme, onlineUsers }) => {
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');

  const filteredThreads = threads.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`w-full h-full flex flex-col select-none relative ${isDark ? 'bg-[#17212b]' : 'bg-white'}`}>
      {/* Account Identity Header */}
      <div className={`p-4 pb-2 flex items-center gap-3 ${isDark ? 'bg-[#242f3d]/30' : 'bg-gray-50/50'}`}>
        <img src={currentUser?.avatar} className="w-10 h-10 rounded-full border-2 border-[#5288c1] shadow-lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
              <div className={`text-[13px] font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}>{currentUser?.username}</div>
              {currentUser?.username.toLowerCase() === 'sel1er' && <i className="fa-solid fa-crown text-yellow-500 text-[10px]"></i>}
          </div>
          <div className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${isDark ? 'text-white' : 'text-black'}`}>
            {currentUser?.username.toLowerCase() === 'sel1er' ? 'Основатель' : 'Пользователь'}
          </div>
        </div>
      </div>

      {/* Search Header */}
      <div className="p-3 flex items-center gap-2">
        <button onClick={onOpenMenu} className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-all hover:bg-black/5 dark:hover:bg-white/5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}><i className="fa-solid fa-bars text-lg"></i></button>
        <div className="relative flex-1">
          <input type="text" placeholder="Поиск" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full text-sm rounded-[12px] py-2 px-10 focus:outline-none transition-all border ${isDark ? 'bg-[#242f3d] border-transparent text-white focus:bg-[#1c2733]' : 'bg-[#f1f1f1] border-transparent text-black focus:bg-white focus:border-[#5288c1]'}`} />
          <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-1 px-2 space-y-0.5 custom-scrollbar">
        {filteredThreads.map((thread) => {
          const isActive = activeThreadId === thread.id;
          const lastMsg = thread.messages[thread.messages.length - 1];
          const isOnline = thread.targetUserId ? onlineUsers.some(u => u.id === thread.targetUserId) : thread.isOnline;
          const isFounder = thread.name.toLowerCase() === 'sel1er';
          
          return (
            <div key={thread.id} onClick={() => onSelectThread(thread.id)} className={`flex items-center gap-3 p-3 rounded-[12px] cursor-pointer transition-all duration-200 relative ${isActive ? (isDark ? 'bg-[#2b5278]' : 'bg-[#5288c1] shadow-md') : (isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100')}`}>
              <div className="relative flex-shrink-0">
                <img src={thread.avatar} className="w-[54px] h-[54px] rounded-full object-cover border border-black/5" />
                {isOnline && <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-[3px] rounded-full ${isDark ? 'border-[#17212b]' : 'border-white'}`}></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className={`font-bold text-[15px] truncate ${isActive ? 'text-white' : (isDark ? 'text-white' : 'text-black')}`}>{thread.name}</h3>
                    {isFounder && <i className={`fa-solid fa-crown ${isActive ? 'text-white' : 'text-yellow-500'} text-[10px]`}></i>}
                  </div>
                  <span className={`text-[11px] font-medium ${isActive ? 'text-white/80' : 'text-gray-400'}`}>{lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</span>
                </div>
                <p className={`text-[13.5px] truncate ${isActive ? 'text-white/90' : 'text-gray-400'}`}>{thread.isTyping ? <span className="animate-pulse">печатает...</span> : (lastMsg ? lastMsg.text : thread.description)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={onOpenAddFriend} className="absolute bottom-6 right-6 w-14 h-14 bg-[#5288c1] hover:bg-[#6499d2] text-white rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-90 hover:scale-105 z-40"><i className="fa-solid fa-pencil text-xl"></i></button>
    </div>
  );
};

export default Sidebar;
