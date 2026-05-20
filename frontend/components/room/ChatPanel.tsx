"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReceivedDataMessage } from '@livekit/components-core';
import { useDataChannel, useLocalParticipant } from '@livekit/components-react';

type ChatMessage = {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function ChatPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { localParticipant } = useLocalParticipant();

  const onMessage = useCallback((message: ReceivedDataMessage<'chat'>) => {
    try {
      const parsed = JSON.parse(decoder.decode(message.payload)) as ChatMessage;
      setMessages((prev) => [...prev, parsed]);
    } catch {
      // ignore malformed messages
    }
  }, []);

  const { send } = useDataChannel('chat', onMessage);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text || !localParticipant) return;

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender: localParticipant.name || localParticipant.identity || 'Siz',
      text,
      timestamp: Date.now(),
    };

    // Send to all participants
    send(encoder.encode(JSON.stringify(message)), { reliable: true });

    // Add to local state
    setMessages((prev) => [...prev, message]);
    setInput('');
  }

  if (!isOpen) return null;

  return (
    <aside className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-slate-700 bg-slate-900/95 backdrop-blur-sm md:w-96">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-100">💬 Chat</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          aria-label="Chatni yopish"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-slate-500 mt-8">
            Hali xabarlar yo&apos;q. Birinchi bo&apos;lib yozing!
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === (localParticipant?.name || localParticipant?.identity);
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="mb-0.5 text-xs text-slate-500">
                  {isMe ? 'Siz' : msg.sender}
                </span>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    isMe
                      ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-200 border border-slate-700'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="mt-0.5 text-[10px] text-slate-600">
                  {new Date(msg.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                </span>
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
            aria-label="Chat xabari"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Xabar yuborish"
          >
            ↑
          </button>
        </div>
      </div>
    </aside>
  );
}
