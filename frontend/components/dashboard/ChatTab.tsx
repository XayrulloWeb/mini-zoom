"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Conversation, DirectMessage } from './types';
import { getBackendUrl } from './utils';

type ChatTabProps = {
  accessToken: string;
  currentUserId: string;
};

export function ChatTab({ accessToken, currentUserId }: ChatTabProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<{ id: string; name: string } | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/messages`, { headers });
      if (res.ok) setConversations(await res.json());
    } catch { /* ignore */ }
  }, [accessToken]);

  const loadMessages = useCallback(async (friendId: string) => {
    try {
      const res = await fetch(`${getBackendUrl()}/messages/${friendId}`, { headers });
      if (res.ok) setMessages(await res.json());
    } catch { /* ignore */ }
  }, [accessToken]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
      const interval = setInterval(() => loadMessages(activeChat.id), 3000);
      return () => clearInterval(interval);
    }
  }, [activeChat, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !activeChat) return;
    setSending(true);
    try {
      const res = await fetch(`${getBackendUrl()}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ receiverId: activeChat.id, text: input.trim() }),
      });
      if (res.ok) {
        setInput('');
        loadMessages(activeChat.id);
        loadConversations();
      }
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  if (activeChat) {
    return (
      <section className="flex h-[600px] flex-col rounded-xl border border-slate-800 bg-slate-900/60">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-slate-700 px-4 py-3">
          <button
            onClick={() => { setActiveChat(null); loadConversations(); }}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            ←
          </button>
          <div>
            <p className="text-sm font-semibold">{activeChat.name}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-slate-500 mt-8">Hali xabarlar yo&apos;q</p>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${
                    isMe
                      ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-200 border border-slate-700'
                  }`}>
                    <p>{msg.text}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
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
        <div className="border-t border-slate-700 px-4 py-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Xabar yozing..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              ↑
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-lg font-semibold">Xabarlar</h2>
      <div className="mt-3 space-y-2">
        {conversations.length === 0 ? (
          <p className="text-sm text-slate-400">
            Hali suhbatlar yo&apos;q. Do&apos;stlar bo&apos;limidan do&apos;st qo&apos;shing va suhbat boshlang.
          </p>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.friend.id}
              onClick={() => setActiveChat({ id: conv.friend.id, name: conv.friend.name || conv.friend.email })}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-left transition hover:border-cyan-500/50 hover:bg-slate-900"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-300">
                {(conv.friend.name || conv.friend.email).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium">{conv.friend.name || conv.friend.email}</p>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                {conv.lastMessage && (
                  <p className="truncate text-xs text-slate-400">
                    {conv.lastMessage.senderId === currentUserId ? 'Siz: ' : ''}
                    {conv.lastMessage.text}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
