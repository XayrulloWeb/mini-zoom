"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Wifi, WifiOff } from 'lucide-react';
import type { Conversation, DirectMessage } from './types';
import { getBackendUrl } from './utils';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useToast } from '@/components/ui/Toast';

type ChatTabProps = {
  accessToken: string;
  currentUserId: string;
};

export function ChatTab({ accessToken, currentUserId }: ChatTabProps) {
  const toast = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<{ id: string; name: string } | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };

  // Load conversations list via REST (initial load)
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/messages`, { headers });
      if (res.ok) setConversations(await res.json());
    } catch { /* ignore */ }
  }, [accessToken]);

  // Load message history via REST
  const loadMessages = useCallback(async (friendId: string) => {
    try {
      const res = await fetch(`${getBackendUrl()}/messages/${friendId}`, { headers });
      if (res.ok) setMessages(await res.json());
    } catch { /* ignore */ }
  }, [accessToken]);

  // Connect WebSocket
  useEffect(() => {
    const socket = getSocket(accessToken);

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Receive new messages in real-time
    socket.on('newMessage', (msg: DirectMessage) => {
      // If we're in the active chat with this sender, add to messages
      if (activeChat && msg.senderId === activeChat.id) {
        setMessages((prev) => [...prev, msg]);
      }
      // Refresh conversations list for unread count
      loadConversations();
      // Browser notification
      if (document.hidden && Notification.permission === 'granted') {
        new Notification('Yangi xabar', {
          body: msg.text,
          icon: '/icons/icon-192.svg',
        });
      }
    });

    // Confirm sent message
    socket.on('messageSent', (msg: DirectMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Typing indicators
    socket.on('userTyping', (data: { userId: string }) => {
      if (activeChat && data.userId === activeChat.id) {
        setTyping(true);
      }
    });

    socket.on('userStopTyping', (data: { userId: string }) => {
      if (activeChat && data.userId === activeChat.id) {
        setTyping(false);
      }
    });

    socket.on('messageError', (data: { error: string }) => {
      toast.error(data.error);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('newMessage');
      socket.off('messageSent');
      socket.off('userTyping');
      socket.off('userStopTyping');
      socket.off('messageError');
    };
  }, [accessToken, activeChat, loadConversations, toast]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (activeChat) loadMessages(activeChat.id);
  }, [activeChat, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message via WebSocket
  function handleSend() {
    if (!input.trim() || !activeChat) return;
    setSending(true);

    const socket = getSocket(accessToken);
    socket.emit('sendMessage', { receiverId: activeChat.id, text: input.trim() });

    // Stop typing
    socket.emit('stopTyping', { receiverId: activeChat.id });

    setInput('');
    setSending(false);
  }

  // Typing indicator
  function handleInputChange(value: string) {
    setInput(value);
    if (!activeChat) return;

    const socket = getSocket(accessToken);

    if (value.trim()) {
      socket.emit('typing', { receiverId: activeChat.id });

      // Auto stop typing after 2s
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { receiverId: activeChat.id });
      }, 2000);
    } else {
      socket.emit('stopTyping', { receiverId: activeChat.id });
    }
  }

  // Active chat view
  if (activeChat) {
    return (
      <div className="flex h-[600px] flex-col rounded-2xl border border-zinc-800/60 bg-zinc-900/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setActiveChat(null); setTyping(false); loadConversations(); }}
              className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-sm font-semibold text-white">{activeChat.name}</p>
              {typing && <p className="text-[11px] text-indigo-400 animate-pulse">yozmoqda...</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            {connected ? (
              <><Wifi className="h-3.5 w-3.5 text-emerald-400" /><span className="text-emerald-400">Online</span></>
            ) : (
              <><WifiOff className="h-3.5 w-3.5 text-rose-400" /><span className="text-rose-400">Offline</span></>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 mt-8">Hali xabarlar yo&apos;q. Birinchi xabarni yuboring!</p>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${
                    isMe
                      ? 'bg-indigo-500/20 text-indigo-100 border border-indigo-500/30'
                      : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                  }`}>
                    <p>{msg.text}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-500">
                      {new Date(msg.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-zinc-800/60 px-4 py-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Xabar yozing..."
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-zinc-200 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="rounded-xl bg-indigo-500 px-4 py-2.5 text-white transition hover:bg-indigo-400 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Conversations list
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {connected ? (
            <><Wifi className="h-3.5 w-3.5 text-emerald-400" /><span>Real-time ulangan</span></>
          ) : (
            <><WifiOff className="h-3.5 w-3.5 text-amber-400" /><span>Ulanmoqda...</span></>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {conversations.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 py-12 text-center">
            <Send className="mx-auto h-8 w-8 text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-500">Hali suhbatlar yo&apos;q</p>
            <p className="mt-1 text-xs text-zinc-600">Do&apos;stlar bo&apos;limidan do&apos;st qo&apos;shing</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.friend.id}
              onClick={() => setActiveChat({ id: conv.friend.id, name: conv.friend.name || conv.friend.email })}
              className="flex w-full items-center gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-4 text-left transition hover:border-zinc-700/80 hover:bg-zinc-900/60"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-sm font-bold text-indigo-300">
                {(conv.friend.name || conv.friend.email).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-white">{conv.friend.name || conv.friend.email}</p>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1.5 text-[10px] font-bold text-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                {conv.lastMessage && (
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {conv.lastMessage.senderId === currentUserId ? 'Siz: ' : ''}
                    {conv.lastMessage.text}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
