
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import LiveCallOverlay from './components/LiveCallOverlay';
import AuthScreen from './components/AuthScreen';
import AddFriendModal from './components/AddFriendModal';
import SidebarMenu from './components/SidebarMenu';
import SettingsModal from './components/SettingsModal';
import IncomingCallModal from './components/IncomingCallModal';
import CreateGroupModal from './components/CreateGroupModal';
import ContactsModal from './components/ContactsModal';
import { BotType, ChatThread, Message, User, Theme, Language, BackgroundType } from './types';
import { generateAIResponse, generateTTS } from './geminiService';

const GLOBAL_CHAT_ID = 'global_chat_all';
const SAVED_MESSAGES_ID = 'saved_messages_id';
const GLOBAL_HISTORY_KEY = 'tele_global_history';
const ACTIVE_USER_KEY = 'tele_active_session_user_v2';

const INITIAL_THREADS: ChatThread[] = [
  {
    id: GLOBAL_CHAT_ID,
    botType: BotType.GLOBAL,
    name: 'Общий чат 🌍',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=global&backgroundColor=5288c1',
    description: 'Глобальный чат для всех участников проекта',
    messages: [],
    isOnline: true
  },
  {
    id: 'bot_assistant',
    botType: BotType.ASSISTANT,
    name: 'Gemini AI Assistant 🤖',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=gemini',
    description: 'Интеллектуальный помощник',
    messages: [
      { id: 'm1', role: 'model', text: 'Добро пожаловать в TeleGemini! ✨ Нажми на карандаш внизу, чтобы найти других пользователей или ИИ-ботов. 🚀', timestamp: Date.now() }
    ],
    isOnline: true
  }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('ru');
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>(GLOBAL_CHAT_ID);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ from: User } | null>(null);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [chatBackground, setChatBackground] = useState<BackgroundType>('default');
  
  const bc = useRef<BroadcastChannel | null>(null);
  const userRef = useRef<User | null>(null);

  // Load user from session on mount
  useEffect(() => {
    const sessionUser = sessionStorage.getItem(ACTIVE_USER_KEY);
    if (sessionUser) {
      const parsedUser = JSON.parse(sessionUser);
      setUser(parsedUser);
      if (parsedUser.settings?.background) setChatBackground(parsedUser.settings.background);
    }
    const savedTheme = localStorage.getItem('tele_theme') as Theme;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // Load threads when user changes
  useEffect(() => {
    if (!user) return;
    
    const savedThreads = localStorage.getItem(`threads_${user.id}`);
    const globalHistory = localStorage.getItem(GLOBAL_HISTORY_KEY);
    
    let initialThreads = savedThreads ? JSON.parse(savedThreads) : INITIAL_THREADS;
    
    // Ensure Saved Messages thread exists
    if (!initialThreads.some((t: any) => t.id === SAVED_MESSAGES_ID)) {
      initialThreads.push({
        id: SAVED_MESSAGES_ID,
        botType: BotType.HUMAN,
        name: 'Избранное 🔖',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Saved&backgroundColor=5288c1',
        description: 'Ваши личные заметки и сохраненные сообщения',
        messages: []
      });
    }

    if (globalHistory) {
      const historyMsgs = JSON.parse(globalHistory);
      initialThreads = initialThreads.map((t: ChatThread) => 
        t.id === GLOBAL_CHAT_ID ? { ...t, messages: historyMsgs } : t
      );
    }
    setThreads(initialThreads);
    setIsDataLoaded(true);
  }, [user]);

  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    if (!user) return;

    bc.current = new BroadcastChannel('telegemini_v12_broadcast');
    
    const processIncoming = (data: any) => {
      const currentUser = userRef.current;
      if (!currentUser) return;
      
      switch (data.type) {
        case 'MESSAGE':
          if (data.payload.targetUserId === currentUser.id || (data.payload.isGroup && data.payload.memberIds.includes(currentUser.id))) {
            handleIncomingPeerMessage(data.payload);
          }
          break;
        case 'GLOBAL_MESSAGE':
          if (data.payload.senderId !== currentUser.id) handleIncomingGlobalMessage(data.payload);
          break;
        case 'USER_UPDATE':
          setOnlineUsers(prev => prev.map(u => u.id === data.payload.id ? { ...u, ...data.payload } : u));
          setThreads(prev => prev.map(t => t.targetUserId === data.payload.id ? { ...t, name: data.payload.username, avatar: data.payload.avatar } : t));
          break;
        case 'PRESENCE':
          setOnlineUsers(prev => {
            const others = prev.filter(u => u.id !== data.payload.id);
            return [...others, { ...data.payload, lastSeen: Date.now() }];
          });
          break;
        case 'PRESENCE_OFFLINE':
          setOnlineUsers(prev => prev.filter(u => u.id !== data.payload.id));
          break;
        case 'CALL_INIT':
          if (data.payload.targetId === currentUser.id) setIncomingCall({ from: data.payload.from });
          break;
        case 'CALL_REJECT':
          if (data.payload.targetId === currentUser.id && isCalling) setIsCalling(false);
          break;
        case 'REQUEST_SYNC':
          bc.current?.postMessage({ type: 'PRESENCE', payload: { ...currentUser, lastSeen: Date.now() } });
          break;
      }
    };

    bc.current.onmessage = (e) => processIncoming(e.data);
    bc.current.postMessage({ type: 'REQUEST_SYNC', payload: null });

    const heartbeat = setInterval(() => {
      if (userRef.current) bc.current?.postMessage({ type: 'PRESENCE', payload: { ...userRef.current, lastSeen: Date.now() } });
      setOnlineUsers(prev => prev.filter(u => Date.now() - (u.lastSeen || 0) < 8000));
    }, 4000);

    return () => { clearInterval(heartbeat); bc.current?.close(); };
  }, [user]);

  useEffect(() => {
    if (user && isDataLoaded) {
      localStorage.setItem(`threads_${user.id}`, JSON.stringify(threads));
      const global = threads.find(t => t.id === GLOBAL_CHAT_ID);
      if (global) localStorage.setItem(GLOBAL_HISTORY_KEY, JSON.stringify(global.messages));
    }
  }, [threads, user, isDataLoaded]);

  // Fix: Added handleLogin function to manage user authentication state
  const handleLogin = (u: User) => {
    setUser(u);
    sessionStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(u));
  };

  const handleUpdateProfile = (updated: User) => {
    setUser(updated);
    userRef.current = updated;
    sessionStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(updated));
    const db = JSON.parse(localStorage.getItem('tele_users_db') || '[]');
    const newDb = db.map((u: User) => u.id === updated.id ? updated : u);
    localStorage.setItem('tele_users_db', JSON.stringify(newDb));
    bc.current?.postMessage({ type: 'USER_UPDATE', payload: updated });
  };

  const handleCreateGroup = (name: string, members: User[]) => {
    if (!user) return;
    const groupId = `group_${Date.now()}`;
    const newGroup: ChatThread = {
      id: groupId,
      botType: BotType.HUMAN,
      name,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}&backgroundColor=5288c1`,
      description: `Группа: ${name}. Участники: ${[user, ...members].map(m => m.username).join(', ')}`,
      messages: [{ id: `init_${Date.now()}`, role: 'model', text: `Группа "${name}" создана! 🎉`, timestamp: Date.now() }],
      isGroup: true,
      memberIds: [user.id, ...members.map(m => m.id)]
    };
    setThreads(prev => [newGroup, ...prev]);
    setActiveThreadId(groupId);
    setIsCreateGroupOpen(false);
  };

  const handleOpenFavorites = () => {
    setActiveThreadId(SAVED_MESSAGES_ID);
    setIsMenuOpen(false);
  };

  const handleSendMessage = async (text?: string, audioUrl?: string, imageUrl?: string, editId?: string) => {
    if (!user) return;
    const currentActiveId = activeThreadId;
    if (editId) {
        setThreads(prev => prev.map(t => ({ ...t, messages: t.messages.map(m => m.id === editId ? { ...m, text: text || '', isEdited: true } : m) })));
        bc.current?.postMessage({ type: 'EDIT_MESSAGE', payload: { messageId: editId, newText: text } });
        return;
    }
    const msgId = `m_${Date.now()}_${user.id}`;
    const userMsg: Message = { id: msgId, role: 'user', text, audioUrl, imageUrl, timestamp: Date.now(), senderId: user.id, senderName: user.username };
    setThreads(prev => {
        const activeIdx = prev.findIndex(t => t.id === currentActiveId);
        if (activeIdx === -1) return prev;
        const updated = [...prev];
        const t = { ...updated[activeIdx], messages: [...updated[activeIdx].messages, userMsg] };
        updated.splice(activeIdx, 1);
        return [t, ...updated];
    });

    const activeThread = threads.find(t => t.id === currentActiveId);
    if (!activeThread) return;

    if (activeThread.id === SAVED_MESSAGES_ID) return; // Only local for favorites

    const event: any = activeThread.botType === BotType.GLOBAL 
      ? { type: 'GLOBAL_MESSAGE', payload: { id: msgId, senderId: user.id, senderName: user.username, text, audioUrl, imageUrl } }
      : activeThread.isGroup
      ? { type: 'MESSAGE', payload: { id: msgId, isGroup: true, memberIds: activeThread.memberIds, sender: user, text, audioUrl, imageUrl } }
      : (activeThread.botType === BotType.HUMAN && activeThread.targetUserId) 
      ? { type: 'MESSAGE', payload: { id: msgId, targetUserId: activeThread.targetUserId, sender: user, text, audioUrl, imageUrl } }
      : null;
    if (event) bc.current?.postMessage(event);

    if (activeThread.botType !== BotType.HUMAN && activeThread.botType !== BotType.GLOBAL) {
      try {
        const aiResponse = await generateAIResponse(activeThread.botType, text || "Голосовое сообщение", activeThread.messages);
        let modelAudioUrl = undefined;
        if (activeThread.botType === BotType.VOICE && aiResponse.text) {
          const rawPcm = await generateTTS(aiResponse.text);
          if (rawPcm) modelAudioUrl = rawPcm;
        }
        const modelMsg: Message = { id: `ai_${Date.now()}`, role: 'model', text: aiResponse.text, imageUrl: aiResponse.imageUrl, audioUrl: modelAudioUrl, timestamp: Date.now() };
        setThreads(prev => prev.map(t => t.id === currentActiveId ? { ...t, messages: [...t.messages, modelMsg] } : t));
      } catch (err) {}
    }
  };

  const handleIncomingPeerMessage = (payload: any) => {
    setThreads(prev => {
      const threadId = payload.isGroup ? payload.groupId : `human_${payload.sender.id}`;
      const existingIdx = prev.findIndex(t => t.id === threadId);
      const newMessage: Message = { id: payload.id || `msg_${Date.now()}`, role: 'model', text: payload.text, audioUrl: payload.audioUrl, imageUrl: payload.imageUrl, timestamp: Date.now(), senderId: payload.sender.id, senderName: payload.sender.username };
      
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx].messages = [...updated[existingIdx].messages, newMessage];
        return updated;
      } else if (!payload.isGroup) {
        return [{ id: threadId, botType: BotType.HUMAN, name: payload.sender.username, avatar: payload.sender.avatar, description: payload.sender.bio || 'Личный чат', messages: [newMessage], targetUserId: payload.sender.id }, ...prev];
      }
      return prev;
    });
  };

  const handleIncomingGlobalMessage = (payload: any) => {
    setThreads(prev => prev.map(t => t.id === GLOBAL_CHAT_ID ? { ...t, messages: [...t.messages, { id: payload.id, role: 'model', text: payload.text, senderId: payload.senderId, senderName: payload.senderName, timestamp: Date.now() }].slice(-100) } : t));
  };

  if (!user) return <AuthScreen onLogin={handleLogin} />;
  const currentThread = threads.find(t => t.id === activeThreadId) || threads[0];

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0e1621] text-white' : 'bg-[#f4f4f5] text-black'}`}>
      <div className="flex-shrink-0 w-[280px] md:w-[320px] lg:w-[350px] relative border-r border-black/10 dark:border-white/5">
        <Sidebar threads={threads} activeThreadId={activeThreadId} onSelectThread={setActiveThreadId} onOpenAddFriend={() => setIsAddFriendOpen(true)} currentUser={user} onOpenMenu={() => setIsMenuOpen(true)} theme={theme} onlineUsers={onlineUsers} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col h-full relative">
        <ChatWindow 
            thread={currentThread} 
            onSendMessage={handleSendMessage} 
            onDeleteMessage={(id) => setThreads(prev => prev.map(t => ({ ...t, messages: t.messages.filter(m => m.id !== id) })))}
            onStartCall={() => setIsCalling(true)} 
            theme={theme} 
            onlineUsers={onlineUsers} 
            onTyping={(is) => bc.current?.postMessage({ type: 'TYPING', payload: { senderId: user.id, targetUserId: currentThread.targetUserId, isTyping: is } })} 
            background={chatBackground}
            currentUser={user}
            onUpdateBackground={(bg) => handleUpdateProfile({ ...user, settings: { ...user.settings!, background: bg } })}
        />
      </div>
      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} user={user} theme={theme} setTheme={setTheme} onLogout={() => { sessionStorage.clear(); window.location.reload(); }} onOpenSettings={() => setIsSettingsOpen(true)} onOpenCreateGroup={() => setIsCreateGroupOpen(true)} onOpenContacts={() => setIsContactsOpen(true)} onOpenFavorites={handleOpenFavorites} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={user} onUpdateUser={handleUpdateProfile} theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} />
      {isCreateGroupOpen && <CreateGroupModal onClose={() => setIsCreateGroupOpen(false)} onCreate={handleCreateGroup} onlineUsers={onlineUsers} theme={theme} />}
      {isContactsOpen && <ContactsModal onClose={() => setIsContactsOpen(false)} onSelect={(u) => { setActiveThreadId(`human_${u.id}`); setIsContactsOpen(false); setIsMenuOpen(false); }} theme={theme} />}
      {isCalling && <LiveCallOverlay targetName={currentThread.name} targetAvatar={currentThread.avatar} onClose={() => setIsCalling(false)} isAiCall={currentThread.botType !== BotType.HUMAN} currentUser={user} />}
      {incomingCall && <IncomingCallModal from={incomingCall.from} onAccept={() => { setIsCalling(true); setIncomingCall(null); }} onReject={() => setIncomingCall(null)} theme={theme} />}
      {isAddFriendOpen && <AddFriendModal onClose={() => setIsAddFriendOpen(false)} onAdd={(nt) => { setThreads(p => [nt, ...p.filter(t => t.id !== nt.id)]); setActiveThreadId(nt.id); }} onlineUsers={onlineUsers} theme={theme} />}
    </div>
  );
};

export default App;
