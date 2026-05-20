"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Send, ArrowLeft, Users, UserPlus } from 'lucide-react';
import { getBackendUrl, parseApiError } from './utils';
import { useToast } from '@/components/ui/Toast';

type Group = {
  id: string;
  name: string;
  memberCount: number;
  lastMessage: { text: string; senderId: string; createdAt: string } | null;
};

type GroupMessage = {
  id: string;
  groupId: string;
  senderId: string;
  text: string;
  createdAt: string;
};

type GroupsTabProps = {
  accessToken: string;
  currentUserId: string;
};

export function GroupsTab({ accessToken, currentUserId }: GroupsTabProps) {
  const toast = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  // Create group state
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newMemberIds, setNewMemberIds] = useState('');
  const [creating, setCreating] = useState(false);

  // Add member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberId, setAddMemberId] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };

  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/groups`, { headers });
      if (res.ok) setGroups(await res.json());
    } catch { /* ignore */ }
  }, [accessToken]);

  const loadMessages = useCallback(async (groupId: string) => {
    try {
      const res = await fetch(`${getBackendUrl()}/groups/${groupId}/messages`, { headers });
      if (res.ok) setMessages(await res.json());
    } catch { /* ignore */ }
  }, [accessToken]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  useEffect(() => {
    if (activeGroup) {
      loadMessages(activeGroup.id);
      const interval = setInterval(() => loadMessages(activeGroup.id), 3000);
      return () => clearInterval(interval);
    }
  }, [activeGroup, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const memberIds = newMemberIds.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await fetch(`${getBackendUrl()}/groups`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: newGroupName.trim(), memberIds }),
      });
      if (!res.ok) throw new Error(await parseApiError(res));
      toast.success('Guruh yaratildi!');
      setNewGroupName('');
      setNewMemberIds('');
      setShowCreate(false);
      loadGroups();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setCreating(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || !activeGroup) return;
    setSending(true);
    try {
      const res = await fetch(`${getBackendUrl()}/groups/${activeGroup.id}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: input.trim() }),
      });
      if (res.ok) {
        setInput('');
        loadMessages(activeGroup.id);
      }
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  async function handleAddMember() {
    if (!addMemberId.trim() || !activeGroup) return;
    try {
      const res = await fetch(`${getBackendUrl()}/groups/${activeGroup.id}/members`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: addMemberId.trim() }),
      });
      if (!res.ok) throw new Error(await parseApiError(res));
      toast.success("A'zo qo'shildi!");
      setAddMemberId('');
      setShowAddMember(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xatolik');
    }
  }

  async function handleLeave(groupId: string) {
    try {
      await fetch(`${getBackendUrl()}/groups/${groupId}/leave`, { method: 'DELETE', headers });
      toast.info('Guruhdan chiqdingiz');
      setActiveGroup(null);
      loadGroups();
    } catch { /* ignore */ }
  }

  // Active group chat view
  if (activeGroup) {
    return (
      <div className="flex h-[600px] flex-col rounded-2xl border border-zinc-800/60 bg-zinc-900/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setActiveGroup(null); loadGroups(); }}
              className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-sm font-semibold text-white">{activeGroup.name}</p>
              <p className="text-[11px] text-zinc-500">{activeGroup.memberCount} a&apos;zo</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="rounded-lg border border-zinc-700 p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              title="A'zo qo'shish"
            >
              <UserPlus className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleLeave(activeGroup.id)}
              className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs text-rose-400 transition hover:bg-rose-500/10"
            >
              Chiqish
            </button>
          </div>
        </div>

        {/* Add member */}
        {showAddMember && (
          <div className="flex gap-2 border-b border-zinc-800/60 px-4 py-2">
            <input
              value={addMemberId}
              onChange={(e) => setAddMemberId(e.target.value)}
              placeholder="Foydalanuvchi ID"
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-1.5 text-xs text-zinc-200 outline-none"
            />
            <button onClick={handleAddMember} className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white">
              Qo&apos;shish
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 mt-8">Hali xabarlar yo&apos;q</p>
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
                    {!isMe && <p className="text-[10px] text-zinc-500 mb-0.5">{msg.senderId.slice(0, 8)}</p>}
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
              onChange={(e) => setInput(e.target.value)}
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

  // Groups list view
  return (
    <div className="space-y-4">
      {/* Create group */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Guruhlar</h3>
          {!showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-400"
            >
              <Plus className="h-3.5 w-3.5" />
              Yangi guruh
            </button>
          )}
        </div>

        {showCreate && (
          <div className="mt-4 space-y-3">
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Guruh nomi"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-zinc-200 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
              autoFocus
            />
            <input
              value={newMemberIds}
              onChange={(e) => setNewMemberIds(e.target.value)}
              placeholder="A'zolar ID (vergul bilan ajrating)"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateGroup}
                disabled={creating || !newGroupName.trim()}
                className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
              >
                {creating ? 'Yaratilmoqda...' : 'Yaratish'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-zinc-800"
              >
                Bekor
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Groups list */}
      <div className="space-y-2">
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 py-12 text-center">
            <Users className="mx-auto h-8 w-8 text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-500">Hali guruhlar yo&apos;q</p>
            <p className="mt-1 text-xs text-zinc-600">Yuqoridagi &quot;Yangi guruh&quot; tugmasini bosing</p>
          </div>
        ) : (
          groups.map((group) => (
            <button
              key={group.id}
              onClick={() => setActiveGroup(group)}
              className="flex w-full items-center gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-4 text-left transition hover:border-zinc-700/80 hover:bg-zinc-900/60"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-sm font-bold text-indigo-300">
                {group.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-white">{group.name}</p>
                  <span className="ml-2 text-[11px] text-zinc-500">{group.memberCount} a&apos;zo</span>
                </div>
                {group.lastMessage ? (
                  <p className="mt-0.5 truncate text-xs text-zinc-500">{group.lastMessage.text}</p>
                ) : (
                  <p className="mt-0.5 text-xs text-zinc-600">Hali xabarlar yo&apos;q</p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
