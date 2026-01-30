
import React, { useState, useRef, useEffect } from 'react';
import { ChatThread, Message, Theme, BotType, User, BackgroundType } from '../types';

interface ChatWindowProps {
  thread: ChatThread;
  onSendMessage: (text?: string, audioUrl?: string, imageUrl?: string, editId?: string) => void;
  onDeleteMessage: (id: string) => void;
  onStartCall: () => void;
  theme: Theme;
  onTyping: (isTyping: boolean) => void;
  onlineUsers: User[];
  background: BackgroundType;
  currentUser: User;
  onUpdateBackground?: (bg: BackgroundType) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ thread, onSendMessage, onDeleteMessage, onStartCall, theme, onTyping, onlineUsers, background, currentUser, onUpdateBackground }) => {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, message: Message } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread.messages, thread.isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue, undefined, undefined, editingId || undefined);
      setInputValue('');
      setEditingId(null);
      onTyping(false);
    }
  };

  const startRecording = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordDuration(0);
      timerRef.current = setInterval(() => setRecordDuration(p => p + 1), 1000);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => onSendMessage(undefined, reader.result as string);
          reader.readAsDataURL(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { alert("Микрофон недоступен 🎙️"); }
  };

  const stopRecording = (e: any) => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const getBackgroundStyle = () => {
    const backgrounds = {
      default: { backgroundImage: `url('https://www.transparenttextures.com/patterns/cubes.png')`, backgroundColor: isDark ? '#0e1621' : '#e7ebf0' },
      stars: { backgroundImage: `url('https://www.transparenttextures.com/patterns/stardust.png')`, backgroundColor: '#1a1a2e' },
      bubbles: { backgroundImage: `url('https://www.transparenttextures.com/patterns/bubbles.png')`, backgroundColor: '#5288c1' },
      solid: { backgroundColor: isDark ? '#17212b' : '#ffffff' },
      abstract: { backgroundImage: `url('https://www.transparenttextures.com/patterns/polygons.png')`, backgroundColor: '#ff9a9e' }
    };
    return backgrounds[background] || backgrounds.default;
  };

  const allSystemUsers = JSON.parse(localStorage.getItem('tele_users_db') || '[]');
  const isTargetOnline = onlineUsers.some(u => u.id === thread.targetUserId);

  return (
    <div className={`flex-1 flex flex-col relative overflow-hidden h-full ${isDark ? 'bg-[#0e1621]' : 'bg-[#e7ebf0]'}`} onClick={() => setContextMenu(null)}>
      {/* Header */}
      <div className={`h-[56px] flex items-center justify-between px-4 z-20 border-b backdrop-blur-md ${isDark ? 'bg-[#17212b]/90 border-[#0e1621]' : 'bg-white/90 border-gray-200'}`}>
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowInfoPanel(!showInfoPanel)}>
          <img src={thread.avatar} className="w-10 h-10 rounded-full object-cover shadow-sm border border-black/5" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
                <h2 className={`font-bold text-[14px] leading-tight group-hover:underline ${isDark ? 'text-white' : 'text-black'}`}>{thread.name}</h2>
                {thread.name.toLowerCase() === 'sel1er' && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded-full flex items-center gap-1 font-black"><i className="fa-solid fa-crown text-[8px]"></i> Founder</span>}
            </div>
            <span className={`text-[11px] font-medium leading-tight ${thread.isTyping ? 'text-green-500 animate-pulse' : 'text-[#5288c1]'}`}>
              {thread.isTyping ? 'печатает...' : (thread.botType === BotType.GLOBAL ? `${allSystemUsers.length} участников` : (isTargetOnline ? 'в сети' : 'был(а) недавно'))}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onStartCall} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-black/5 dark:hover:bg-white/5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}><i className="fa-solid fa-phone"></i></button>
          <button onClick={() => setShowInfoPanel(!showInfoPanel)} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${showInfoPanel ? 'text-[#5288c1] bg-[#5288c1]/10' : (isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-black/5')}`}><i className="fa-solid fa-circle-info"></i></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:px-10 lg:px-20 space-y-1 z-10 custom-scrollbar relative" style={getBackgroundStyle()}>
            {thread.messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const prevMsg = thread.messages[idx - 1];
                const isSameSender = prevMsg && prevMsg.role === msg.role && (prevMsg.senderId === msg.senderId);
                const isFounder = (isUser ? currentUser.username : msg.senderName)?.toLowerCase() === 'sel1er';
                
                return (
                    <div key={msg.id} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, message: msg }); }} className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${!isSameSender ? 'mt-3' : 'mt-0.5'}`}>
                        <div className={`max-w-[85%] md:max-w-[70%] px-3 py-1.5 rounded-[12px] shadow-sm relative transition-all duration-300 ${
                            isUser 
                            ? (isDark ? 'bg-[#2b5278] text-white rounded-tr-[2px]' : 'bg-[#eeffde] text-black border border-[#d8e8c8] rounded-tr-[2px]')
                            : (isDark ? 'bg-[#182533] text-white rounded-tl-[2px] border border-white/5' : 'bg-white text-black border border-gray-100 rounded-tl-[2px]')
                        }`}>
                            {!isUser && msg.senderName && !isSameSender && (
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <div className="text-[11px] font-bold text-[#5288c1] truncate">{msg.senderName}</div>
                                    {isFounder && <i className="fa-solid fa-crown text-yellow-500 text-[10px]"></i>}
                                </div>
                            )}
                            {msg.audioUrl ? (
                                <VoiceBubble audioUrl={msg.audioUrl} isUser={isUser} theme={theme} />
                            ) : (
                                <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                            )}
                            <div className="flex items-center justify-end gap-1 mt-1 opacity-50 text-[9px]">
                                {msg.isEdited && <span className="italic">изменено</span>}
                                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Info Panel */}
        <div className={`h-full border-l transition-all duration-500 overflow-y-auto custom-scrollbar ${showInfoPanel ? 'w-[280px] p-4 opacity-100' : 'w-0 opacity-0 overflow-hidden'} ${isDark ? 'bg-[#17212b] border-[#0e1621]' : 'bg-white border-gray-100'}`}>
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 text-[#5288c1]">Информация</h3>
            <div className="flex flex-col items-center mb-6 text-center">
                <img src={thread.avatar} className="w-24 h-24 rounded-full mb-3 shadow-xl object-cover border-4 border-black/5" />
                <div className="flex items-center gap-2">
                    <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>{thread.name}</h4>
                    {thread.name.toLowerCase() === 'sel1er' && <i className="fa-solid fa-crown text-yellow-500 text-sm"></i>}
                </div>
                <p className="text-xs text-gray-500 px-4 mt-2 leading-relaxed">{thread.description}</p>
            </div>

            <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 text-[#5288c1]">Обои чата</h3>
            <div className="grid grid-cols-5 gap-1 mb-6">
                {(['default', 'stars', 'bubbles', 'solid', 'abstract'] as BackgroundType[]).map(bg => (
                    <button key={bg} onClick={() => onUpdateBackground?.(bg)} className={`h-8 rounded-md border-2 transition-all ${background === bg ? 'border-[#5288c1] scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`} style={{ backgroundColor: bg === 'solid' ? '#5288c1' : '#242f3d' }} />
                ))}
            </div>
        </div>
      </div>

      {contextMenu && (
          <div className={`fixed z-[100] w-48 shadow-2xl rounded-xl overflow-hidden py-1 border animate-in fade-in zoom-in-95 duration-150 ${isDark ? 'bg-[#1c2733] border-white/10 text-white' : 'bg-white border-gray-200 text-black'}`} style={{ top: contextMenu.y, left: contextMenu.x }}>
              <button onClick={() => { navigator.clipboard.writeText(contextMenu.message.text || ''); setContextMenu(null); }} className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center gap-3 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}><i className="fa-regular fa-copy opacity-50"></i> Копировать</button>
              {contextMenu.message.senderId === currentUser.id && (
                  <>
                    <button onClick={() => { setEditingId(contextMenu.message.id); setInputValue(contextMenu.message.text || ''); setContextMenu(null); }} className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center gap-3 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}><i className="fa-regular fa-pen-to-square opacity-50"></i> Изменить</button>
                    <button onClick={() => { onDeleteMessage(contextMenu.message.id); setContextMenu(null); }} className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center gap-3 transition-colors text-red-500 ${isDark ? 'hover:bg-white/5' : 'hover:bg-red-50'}`}><i className="fa-regular fa-trash-can opacity-50"></i> Удалить</button>
                  </>
              )}
          </div>
      )}

      {/* Input area omitted for brevity as it stays same from previous version */}
      <div className={`p-3 z-20 ${isDark ? 'bg-[#17212b]' : 'bg-white border-t border-gray-200'}`}>
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-center gap-2 relative">
          {isRecording && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-red-500 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3 z-50 animate-bounce">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  <span className="text-xs font-black uppercase tracking-widest">{recordDuration}с</span>
              </div>
          )}
          <div className={`flex-1 flex items-center gap-2 rounded-2xl px-3 py-1.5 transition-all ${isDark ? 'bg-[#0e1621] focus-within:bg-[#1c2733]' : 'bg-[#f1f1f1] focus-within:bg-white border border-gray-100'}`}>
            <input value={inputValue} onChange={(e) => { setInputValue(e.target.value); onTyping(true); }} disabled={isRecording} placeholder={isRecording ? "Запись голоса..." : "Написать сообщение..."} className={`flex-1 bg-transparent text-[14px] py-2 focus:outline-none ${isDark ? 'text-white' : 'text-black'}`} />
          </div>
          {!inputValue.trim() && !editingId ? (
            <button type="button" onMouseDown={startRecording} onMouseUp={stopRecording} onMouseLeave={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${isRecording ? 'bg-red-500 text-white scale-110 shadow-red-500/50' : 'text-[#5288c1] hover:bg-[#5288c1]/10'}`}>
                <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'} text-lg`}></i>
            </button>
          ) : (
            <button type="submit" className="w-12 h-12 rounded-full flex items-center justify-center bg-[#5288c1] hover:bg-[#6499d2] text-white shadow-lg active:scale-90 transition-all">
                <i className="fa-solid fa-paper-plane"></i>
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

const VoiceBubble = ({ audioUrl, isUser, theme }: { audioUrl: string, isUser: boolean, theme: Theme }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    return (
        <div className="flex items-center gap-3 py-1 min-w-[200px]">
            <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
            <button onClick={() => { isPlaying ? audioRef.current?.pause() : audioRef.current?.play(); setIsPlaying(!isPlaying); }} className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${isUser ? 'bg-white/20 text-white' : 'bg-[#5288c1] text-white'}`}>
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-xs`}></i>
            </button>
            <div className="flex-1 h-1 bg-gray-400/20 rounded-full" />
            <span className={`text-[9px] font-black uppercase ${isUser ? 'text-white/60' : 'text-[#5288c1]/60'}`}>Voice</span>
        </div>
    );
};

export default ChatWindow;
