
import React from 'react';
import { User, Theme } from '../types';

interface IncomingCallModalProps {
  from: User;
  onAccept: () => void;
  onReject: () => void;
  theme: Theme;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ from, onAccept, onReject, theme }) => {
  const isDark = theme === 'dark';
  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className={`w-full max-w-xs rounded-[32px] p-8 flex flex-col items-center text-center animate-bounce-short ${isDark ? 'bg-[#17212b] text-white' : 'bg-white text-black'}`}>
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping scale-150"></div>
                <img src={from.avatar} className="w-24 h-24 rounded-full border-4 border-[#5288c1] relative z-10 shadow-2xl" />
            </div>
            <h3 className="text-xl font-black mb-1">{from.username}</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-[#5288c1] mb-8">Входящий звонок...</p>
            
            <div className="flex gap-8">
                <button onClick={onReject} className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-90 transition-all">
                    <i className="fa-solid fa-phone-slash text-xl rotate-[135deg]"></i>
                </button>
                <button onClick={onAccept} className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-90 transition-all animate-pulse">
                    <i className="fa-solid fa-phone text-xl"></i>
                </button>
            </div>
        </div>
    </div>
  );
};

export default IncomingCallModal;
