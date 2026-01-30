
import React, { useState, useEffect } from 'react';
import { User, BotType, ChatThread, Theme } from '../types';

interface AddFriendModalProps {
  onClose: () => void;
  onAdd: (thread: ChatThread) => void;
  onlineUsers: User[];
  theme: Theme;
}

const MOCK_BOTS = [
  { name: 'Gemini Artist', bio: 'Генерация изображений по описанию 🎨', type: BotType.ARTIST },
  { name: 'Gemini Search', bio: 'Поиск актуальной информации в сети 🔎', type: BotType.SEARCH },
  { name: 'Gemini Voice', bio: 'Голосовой собеседник 🎤', type: BotType.VOICE },
];

const AddFriendModal: React.FC<AddFriendModalProps> = ({ onClose, onAdd, onlineUsers, theme }) => {
  const [search, setSearch] = useState('');
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<User[]>([]);
  const isDark = theme === 'dark';

  const fetchUsers = () => {
    const usersStr = localStorage.getItem('tele_users_db');
    if (usersStr) {
      setAllRegisteredUsers(JSON.parse(usersStr));
    }
  };

  useEffect(() => {
    fetchUsers();
    window.addEventListener('storage', fetchUsers);
    const interval = setInterval(fetchUsers, 1500);
    return () => {
      window.removeEventListener('storage', fetchUsers);
      clearInterval(interval);
    };
  }, []);

  const handleAddUser = (user: any) => {
    const isHuman = user.id && !user.id.startsWith('bot_');
    const newThread: ChatThread = {
      id: isHuman ? `human_${user.id}` : user.id,
      botType: isHuman ? BotType.HUMAN : user.botType || BotType.ASSISTANT,
      name: user.username,
      avatar: user.avatar,
      description: user.isCreator ? 'Основатель TeleGemini 👑' : (isHuman ? (user.bio || 'Пользователь TeleGemini') : user.bio),
      messages: [],
      isOnline: onlineUsers.some(ou => ou.id === user.id),
      targetUserId: isHuman ? user.id : undefined
    };
    onAdd(newThread);
    onClose();
  };

  const filteredUsers = allRegisteredUsers.filter(u => {
    const s = search.toLowerCase();
    return u.username.toLowerCase().includes(s);
  });

  const onlineList = filteredUsers.filter(u => onlineUsers.some(ou => ou.id === u.id));
  const offlineList = filteredUsers.filter(u => !onlineUsers.some(ou => ou.id === u.id));

  const filteredBots = MOCK_BOTS.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`${isDark ? 'bg-[#17212b] border-white/5' : 'bg-white border-gray-200'} w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl border animate-in slide-in-from-bottom-8 duration-500`}>
        <div className={`p-5 border-b ${isDark ? 'border-[#0e1621] bg-[#242f3d]/50' : 'border-gray-100 bg-gray-50'} flex justify-between items-center`}>
          <div>
            <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Создать чат</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Выберите собеседника</p>
          </div>
          <button onClick={onClose} className={`w-8 h-8 rounded-full ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'} flex items-center justify-center transition-colors`}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div className="p-4">
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Поиск пользователей..."
              value={search}
              // Fix: Changed setSearchQuery to setSearch to match the state hook definition.
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className={`w-full ${isDark ? 'bg-[#0e1621] text-white border-white/5' : 'bg-gray-100 text-black border-gray-200'} rounded-2xl py-3 px-10 focus:outline-none focus:ring-2 focus:ring-[#5288c1]/50 border transition-all text-sm`}
            />
            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
          </div>

          <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            {/* Online Members */}
            {onlineList.length > 0 && (
              <div>
                <p className="text-[10px] text-green-500 font-black uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    В сети
                </p>
                <div className="space-y-0.5">
                  {onlineList.map(u => (
                    <UserRow key={u.id} user={u} isDark={isDark} onClick={() => handleAddUser(u)} isOnline={true} />
                  ))}
                </div>
              </div>
            )}

            {/* AI Bots */}
            <div>
              <p className="text-[10px] text-[#5288c1] font-black uppercase tracking-widest mb-3 px-2">ИИ Помощники</p>
              <div className="space-y-0.5">
                {filteredBots.map((bot) => (
                  <div key={bot.name} onClick={() => handleAddUser({id: 'bot_'+bot.name.replace(/\s+/g, '_'), username: bot.name, avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${bot.name}`, bio: bot.bio, botType: bot.type})} className={`flex items-center gap-3 p-2.5 ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'} rounded-xl cursor-pointer group`}>
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#5288c1] to-[#3a6186] p-2 flex-shrink-0">
                        <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${bot.name}`} className="w-full h-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-black'}`}>{bot.name}</div>
                      <div className="text-[10px] text-gray-500 truncate">{bot.bio}</div>
                    </div>
                    <span className="bg-[#5288c1]/10 text-[#5288c1] text-[8px] font-black px-1.5 py-0.5 rounded border border-[#5288c1]/20">BOT</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Offline Members */}
            {offlineList.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3 px-2">Другие участники</p>
                <div className="space-y-0.5">
                  {offlineList.map(u => (
                    <UserRow key={u.id} user={u} isDark={isDark} onClick={() => handleAddUser(u)} isOnline={false} />
                  ))}
                </div>
              </div>
            )}
            
            {filteredUsers.length === 0 && filteredBots.length === 0 && (
                <div className="text-center py-12 opacity-30">
                    <i className="fa-solid fa-ghost text-5xl mb-4 block"></i>
                    <p className="text-sm font-bold uppercase tracking-widest">Пусто...</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Fix: Typing UserRow as React.FC to correctly allow standard props like 'key' when rendered in lists.
const UserRow: React.FC<{ user: any, isDark: boolean, onClick: () => void, isOnline: boolean }> = ({ user, isDark, onClick, isOnline }) => (
    <div onClick={onClick} className={`flex items-center gap-3 p-2.5 ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'} rounded-xl cursor-pointer group transition-all`}>
        <div className="relative flex-shrink-0">
            <img src={user.avatar} className="w-11 h-11 rounded-full border border-black/5 object-cover" />
            {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#17212b]"></span>}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
                <div className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-black'}`}>{user.username}</div>
                {user.isCreator && <i className="fa-solid fa-crown text-yellow-500 text-[10px]"></i>}
            </div>
            <div className="text-[10px] text-gray-500 truncate">@{user.username.toLowerCase()}</div>
        </div>
        <i className="fa-solid fa-chevron-right text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-all mr-2"></i>
    </div>
);

export default AddFriendModal;
