
import React, { useState } from 'react';
import { User, Theme, Language, BackgroundType } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (updated: User) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  language: Language;
  setLanguage: (l: Language) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, onUpdateUser, theme, setTheme, language, setLanguage }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'chat' | 'privacy'>('profile');
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar);
  const [bio, setBio] = useState(user.bio || '');
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    onUpdateUser({ ...user, username, avatar, bio });
  };

  const setBg = (bg: BackgroundType) => {
    onUpdateUser({ ...user, settings: { ...user.settings, background: bg, notifications: true, showOnline: true } });
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-lg rounded-[28px] overflow-hidden shadow-2xl border ${isDark ? 'bg-[#17212b] border-white/5' : 'bg-white border-gray-200'} animate-in zoom-in-95 duration-300`}>
        <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-[#0e1621] bg-[#242f3d]/50' : 'border-gray-100 bg-gray-50'}`}>
          <div className="flex gap-4">
              <button onClick={() => setActiveTab('profile')} className={`text-sm font-bold ${activeTab === 'profile' ? 'text-[#5288c1]' : 'text-gray-400'}`}>Профиль</button>
              <button onClick={() => setActiveTab('chat')} className={`text-sm font-bold ${activeTab === 'chat' ? 'text-[#5288c1]' : 'text-gray-400'}`}>Чат</button>
              <button onClick={() => setActiveTab('privacy')} className={`text-sm font-bold ${activeTab === 'privacy' ? 'text-[#5288c1]' : 'text-gray-400'}`}>Приватность</button>
          </div>
          <button onClick={onClose} className={`w-8 h-8 rounded-full ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'} flex items-center justify-center transition-colors`}><i className="fa-solid fa-xmark"></i></button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                    <img src={avatar} className="w-24 h-24 rounded-full border-4 border-[#5288c1] object-cover shadow-lg group-hover:opacity-50 transition-opacity" />
                    <button onClick={() => setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`)} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white font-black text-[10px] uppercase">Случайный</button>
                </div>
                <div className="w-full space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-[#5288c1]">Имя пользователя</label>
                        <input value={username} onChange={e => setUsername(e.target.value)} className={`w-full p-4 rounded-xl text-sm focus:outline-none border ${isDark ? 'bg-[#242f3d] border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-black'}`} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-[#5288c1]">Ссылка на аватар</label>
                        <input value={avatar} onChange={e => setAvatar(e.target.value)} className={`w-full p-4 rounded-xl text-sm focus:outline-none border ${isDark ? 'bg-[#242f3d] border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-black'}`} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-[#5288c1]">О себе</label>
                        <textarea value={bio} onChange={e => setBio(e.target.value)} className={`w-full p-4 rounded-xl text-sm focus:outline-none border ${isDark ? 'bg-[#242f3d] border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-black'}`} />
                    </div>
                    <button onClick={handleSaveProfile} className="w-full py-4 bg-[#5288c1] text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all">Сохранить профиль</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Тема оформления</span>
                    <div className="flex bg-gray-500/10 p-1 rounded-xl">
                        <button onClick={() => setTheme('light')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${theme === 'light' ? 'bg-[#5288c1] text-white' : 'text-gray-500'}`}>Светлая</button>
                        <button onClick={() => setTheme('dark')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${theme === 'dark' ? 'bg-[#5288c1] text-white' : 'text-gray-500'}`}>Темная</button>
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-[#5288c1] px-2">Обои чата</label>
                    <div className="grid grid-cols-5 gap-2 px-2">
                        {['default', 'stars', 'bubbles', 'solid', 'abstract'].map(b => (
                            <button key={b} onClick={() => setBg(b as BackgroundType)} className={`h-12 rounded-lg border-2 transition-all ${user.settings?.background === b ? 'border-[#5288c1] scale-105' : 'border-transparent opacity-60'}`} style={{ backgroundColor: b === 'solid' ? '#5288c1' : '#242f3d' }}>
                                <i className={`fa-solid ${b === 'stars' ? 'fa-star' : (b === 'bubbles' ? 'fa-circle' : 'fa-image')} text-[10px]`}></i>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
