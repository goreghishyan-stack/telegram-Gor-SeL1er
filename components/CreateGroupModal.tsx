
import React, { useState, useEffect } from 'react';
import { User, Theme } from '../types';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreate: (name: string, members: User[]) => void;
  onlineUsers: User[];
  theme: Theme;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onCreate, onlineUsers, theme }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const isDark = theme === 'dark';

  useEffect(() => {
    const db = JSON.parse(localStorage.getItem('tele_users_db') || '[]');
    const current = JSON.parse(sessionStorage.getItem('tele_active_session_user_v2') || '{}');
    setAllUsers(db.filter((u: User) => u.id !== current.id));
  }, []);

  const toggleUser = (u: User) => {
    setSelectedUsers(prev => prev.find(item => item.id === u.id) ? prev.filter(item => item.id !== u.id) : [...prev, u]);
  };

  const handleCreate = () => {
    if (groupName.trim() && selectedUsers.length > 0) {
      onCreate(groupName.trim(), selectedUsers);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4 backdrop-blur-md">
      <div className={`w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl border ${isDark ? 'bg-[#17212b] border-white/5' : 'bg-white border-gray-200'}`}>
        <div className={`p-5 border-b ${isDark ? 'border-[#0e1621] bg-[#242f3d]/50' : 'border-gray-100 bg-gray-50'} flex justify-between items-center`}>
          <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-black'}`}>Новая группа</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500"><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="p-5 space-y-4">
            <input placeholder="Имя группы" value={groupName} onChange={e => setGroupName(e.target.value)} className={`w-full p-4 rounded-xl text-sm focus:outline-none border ${isDark ? 'bg-[#0e1621] border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-black'}`} />
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1">
                <p className="text-[10px] font-black uppercase text-[#5288c1] mb-2">Выберите участников</p>
                {allUsers.map(u => (
                    <div key={u.id} onClick={() => toggleUser(u)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedUsers.find(item => item.id === u.id) ? (isDark ? 'bg-[#2b5278]' : 'bg-[#5288c1]/10') : (isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50')}`}>
                        <img src={u.avatar} className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                            <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{u.username}</div>
                            <div className="text-[10px] text-gray-500">{onlineUsers.some(ou => ou.id === u.id) ? 'В сети' : 'Был недавно'}</div>
                        </div>
                        <i className={`fa-solid ${selectedUsers.find(item => item.id === u.id) ? 'fa-circle-check text-[#5288c1]' : 'fa-circle opacity-10'} text-lg`}></i>
                    </div>
                ))}
            </div>
            <button disabled={!groupName || selectedUsers.length === 0} onClick={handleCreate} className="w-full py-4 bg-[#5288c1] text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg disabled:opacity-50">Создать ({selectedUsers.length})</button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
