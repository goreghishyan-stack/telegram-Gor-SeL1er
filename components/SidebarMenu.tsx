
import React, { useState } from 'react';
import { User, Theme } from '../types';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  theme: Theme;
  setTheme: (t: Theme) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenCreateGroup: () => void;
  onOpenContacts: () => void;
  onOpenFavorites: () => void;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ isOpen, onClose, user, theme, setTheme, onLogout, onOpenSettings, onOpenCreateGroup, onOpenContacts, onOpenFavorites }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      
      <div className={`fixed top-0 left-0 h-full w-[280px] z-[101] shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${theme === 'dark' ? 'bg-[#17212b]' : 'bg-white'}`}>
        <div className={`${theme === 'dark' ? 'bg-[#242f3d]' : 'bg-[#5288c1]'} p-6`}>
          <div className="flex justify-between items-start mb-4">
            <img src={user.avatar} className="w-16 h-16 rounded-full border-2 border-white/20 object-cover shadow-md" />
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${theme === 'dark' ? 'text-[#5288c1] hover:bg-white/5' : 'text-white hover:bg-black/10'}`}
            >
              <i className={`fa-solid ${theme === 'dark' ? 'fa-moon' : 'fa-sun'} text-xl`}></i>
            </button>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
                <div className="text-white font-bold text-lg">{user.username}</div>
                {user.isCreator && <i className="fa-solid fa-circle-check text-white text-[12px]"></i>}
            </div>
            <div className="text-white/60 text-[11px] mt-0.5">TeleGemini User</div>
          </div>
        </div>
        
        <nav className={`mt-2 text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          <div onClick={onOpenCreateGroup}><MenuLink icon="fa-user-group" label="Создать группу" theme={theme} /></div>
          <div onClick={onOpenContacts}><MenuLink icon="fa-user" label="Контакты" theme={theme} /></div>
          <div onClick={onOpenFavorites}><MenuLink icon="fa-bookmark" label="Избранное" theme={theme} /></div>
          <div onClick={onOpenSettings}><MenuLink icon="fa-gear" label="Настройки" theme={theme} /></div>
          <hr className={`my-2 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`} />
          <div 
            onClick={() => { onLogout(); onClose(); }}
            className={`flex items-center gap-6 px-6 py-4 cursor-pointer text-red-500 hover:bg-red-500/10 transition-colors`}
          >
            <i className="fa-solid fa-right-from-bracket w-5"></i>
            <span className="font-bold">Выйти</span>
          </div>
        </nav>
      </div>
    </>
  );
};

const MenuLink = ({ icon, label, theme }: { icon: string, label: string, theme: Theme }) => (
  <div className={`flex items-center gap-6 px-6 py-4 cursor-pointer transition-colors group ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}>
    <i className={`fa-solid ${icon} w-5 text-gray-400 group-hover:text-[#5288c1] transition-colors`}></i>
    <span className="font-medium">{label}</span>
  </div>
);

export default SidebarMenu;
