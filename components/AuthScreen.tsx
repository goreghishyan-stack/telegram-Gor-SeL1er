
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

type AuthMode = 'login' | 'register' | 'recovery';

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [avatar, setAvatar] = useState(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.floor(Math.random() * 1000)}`);

  useEffect(() => {
    const initDb = () => {
      const usersStr = localStorage.getItem('tele_users_db');
      let users: User[] = usersStr ? JSON.parse(usersStr) : [];
      
      const creatorExists = users.some(u => u.username.toLowerCase() === 'sel1er');
      const meriExists = users.some(u => u.username.toLowerCase() === 'meri');
      
      let updated = false;
      if (!creatorExists) {
        users.push({
          id: 'creator_001',
          username: 'SeL1er',
          password: '123',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SeL1er',
          bio: 'Основатель TeleGemini 👑',
          isCreator: true
        });
        updated = true;
      }
      if (!meriExists) {
        users.push({
          id: 'user_meri',
          username: 'Meri',
          password: '123',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meri',
          bio: 'Пользователь TeleGemini ✨',
          isCreator: false
        });
        updated = true;
      }
      if (updated) localStorage.setItem('tele_users_db', JSON.stringify(users));
    };
    initDb();
  }, []);

  const handleAuth = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const usersStr = localStorage.getItem('tele_users_db');
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    const cleanUsername = username.trim().toLowerCase();

    if (mode === 'login') {
      const foundUser = users.find((u) => u.username.toLowerCase() === cleanUsername);
      if (!foundUser) {
        setError('Пользователь не найден 🔍');
        return;
      }
      if (foundUser.password !== password) {
        setError('Неверный пароль ❌');
        return;
      }
      onLogin(foundUser);
    } else {
        const userExists = users.some((u) => u.username.toLowerCase() === cleanUsername);
        if (userExists) { setError('Имя занято ⚠️'); return; }
        const newUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            username: username.trim(),
            password: password,
            avatar,
            isCreator: false
        };
        localStorage.setItem('tele_users_db', JSON.stringify([...users, newUser]));
        onLogin(newUser);
    }
  };

  const quickLogin = (name: string) => {
    setUsername(name);
    setPassword('123');
    // We need to wait a tick for state to update or just use the values directly
    const usersStr = localStorage.getItem('tele_users_db');
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    const found = users.find(u => u.username.toLowerCase() === name.toLowerCase());
    if (found) onLogin(found);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0e1621] flex items-center justify-center p-4">
      <div className="w-full max-w-[380px] bg-[#17212b] p-8 rounded-[32px] shadow-2xl border border-white/5 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-[#5288c1] overflow-hidden shadow-xl">
             <img src={avatar} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-black text-white">TeleGemini AI</h1>
          <p className="text-[#5288c1] text-[10px] mt-1 uppercase tracking-[3px] font-bold">
            {mode === 'login' ? 'Авторизация' : 'Регистрация'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-3">
          <input
            type="text"
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[#0e1621] border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-[#5288c1] transition-all text-white text-sm"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0e1621] border border-white/5 rounded-2xl py-4 px-5 focus:outline-none focus:border-[#5288c1] transition-all text-white text-sm"
          />

          {error && <div className="text-red-400 text-[10px] text-center font-bold p-2 bg-red-400/5 rounded-lg">{error}</div>}

          <button type="submit" className="w-full bg-[#5288c1] hover:bg-[#6499d2] py-4 rounded-2xl font-black text-white transition-all shadow-lg mt-2 text-[10px] uppercase tracking-widest">
            {mode === 'login' ? 'ВОЙТИ' : 'СОЗДАТЬ'}
          </button>
        </form>

        <div className="mt-8 space-y-4">
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-gray-600 text-[9px] font-black uppercase tracking-widest">Тестовый вход</span>
                <div className="flex-grow border-t border-white/5"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => quickLogin('SeL1er')} className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl flex flex-col items-center transition-all group">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=SeL1er" className="w-8 h-8 rounded-full mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-white text-[10px] font-bold">SeL1er</span>
                </button>
                <button onClick={() => quickLogin('Meri')} className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl flex flex-col items-center transition-all group">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Meri" className="w-8 h-8 rounded-full mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-white text-[10px] font-bold">Meri</span>
                </button>
            </div>
        </div>

        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full mt-6 text-gray-500 text-[11px] font-medium hover:text-white transition-colors">
            {mode === 'login' ? "Нет аккаунта? Регистрация" : "Уже есть аккаунт? Войти"}
        </button>
      </div>
    </div>
  );
};

export default AuthScreen;
