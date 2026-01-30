
import React, { useState, useEffect } from 'react';
import { User, Theme } from '../types';

interface ContactsModalProps {
  onClose: () => void;
  onSelect: (user: User) => void;
  theme: Theme;
}

const ContactsModal: React.FC<ContactsModalProps> = ({ onClose, onSelect, theme }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const isDark = theme === 'dark';

  useEffect(() => {
    const db = JSON.parse(localStorage.getItem('tele_users_db') || '[]');
    setUsers(db);
  }, []);

  const filtered = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4 backdrop-blur-md">
      <div className={`w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl border ${isDark ? 'bg-[#17212b] border-white/5' : 'bg-white border-gray-200'}`}>
        <div className={`p-5 border-b ${isDark ? 'border-[#0e1621] bg-[#242f3d]/50' : 'border-gray-100 bg-gray-50'} flex justify-between items-center`}>
          <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-black'}`}>Контакты</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500"><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="p-4 space-y-4">
            <input placeholder="Поиск контакта..." value={search} onChange={e => setSearch(e.target.value)} className={`w-full p-4 rounded-xl text-sm focus:outline-none border ${isDark ? 'bg-[#0e1621] border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-black'}`} />
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-1">
                {filtered.map(u => (
                    <div key={u.id} onClick={() => onSelect(u)} className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                        <img src={u.avatar} className="w-12 h-12 rounded-full" />
                        <div>
                            <div className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{u.username}</div>
                            <div className="text-xs text-gray-500">{u.bio || 'Участник TeleGemini'}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ContactsModal;
