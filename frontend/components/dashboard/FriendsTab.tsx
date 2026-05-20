"use client";

import { useCallback, useEffect, useState } from 'react';
import { Search, UserPlus, Check, X as XIcon } from 'lucide-react';
import type { Friend, FriendRequest } from './types';
import { getBackendUrl, parseApiError } from './utils';
import { useToast } from '@/components/ui/Toast';

type FriendsTabProps = {
  accessToken: string;
};

export function FriendsTab({ accessToken }: FriendsTabProps) {
  const toast = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string | null; email: string }>>([]);
  const [addId, setAddId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };

  const loadFriends = useCallback(async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/friends`, { headers });
      if (res.ok) setFriends(await res.json());
    } catch { /* ignore */ }
  }, [accessToken]);

  const loadRequests = useCallback(async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/friends/requests`, { headers });
      if (res.ok) setRequests(await res.json());
    } catch { /* ignore */ }
  }, [accessToken]);

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, [loadFriends, loadRequests]);

  async function handleSearch() {
    if (searchQuery.trim().length < 2) return;
    try {
      const res = await fetch(`${getBackendUrl()}/friends/search?q=${encodeURIComponent(searchQuery.trim())}`, { headers });
      if (res.ok) setSearchResults(await res.json());
    } catch { /* ignore */ }
  }

  async function handleAddFriend(friendId: string) {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/friends/add`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ friendId }),
      });
      if (!res.ok) throw new Error(await parseApiError(res));
      toast.success("Do'stlik so'rovi yuborildi!");
      setAddId('');
      setSearchResults([]);
      setSearchQuery('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setLoading(false);
    }
  }

  async function handleRespond(friendshipId: string, action: 'accept' | 'reject') {
    try {
      await fetch(`${getBackendUrl()}/friends/${friendshipId}/respond`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action }),
      });
      loadRequests();
      loadFriends();
    } catch { /* ignore */ }
  }

  async function handleRemove(friendshipId: string) {
    try {
      await fetch(`${getBackendUrl()}/friends/${friendshipId}`, { method: 'DELETE', headers });
      loadFriends();
    } catch { /* ignore */ }
  }

  return (
    <section className="space-y-4">
      {/* Add friend */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">Do&apos;st qo&apos;shish</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Ism yoki email bo'yicha qidirish"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
          />
          <button
            onClick={handleSearch}
            className="rounded-lg bg-cyan-500/20 border border-cyan-500/50 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/30"
          >
            Qidirish
          </button>
        </div>

        {/* Or add by ID directly */}
        <div className="mt-2 flex gap-2">
          <input
            value={addId}
            onChange={(e) => setAddId(e.target.value)}
            placeholder="Yoki ID bo'yicha qo'shish"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
          />
          <button
            onClick={() => handleAddFriend(addId.trim())}
            disabled={!addId.trim() || loading}
            className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
          >
            Qo&apos;shish
          </button>
        </div>

        {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
        {success && <p className="mt-2 text-sm text-emerald-400">{success}</p>}

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{user.name || user.email}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
                <button
                  onClick={() => handleAddFriend(user.id)}
                  className="rounded-lg bg-cyan-500 px-3 py-1 text-xs font-medium text-slate-950 transition hover:bg-cyan-400"
                >
                  + Qo&apos;shish
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending requests */}
      {requests.length > 0 && (
        <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-4">
          <h2 className="text-lg font-semibold text-amber-300">Kutilayotgan so&apos;rovlar ({requests.length})</h2>
          <div className="mt-3 space-y-2">
            {requests.map((req) => (
              <div key={req.friendshipId} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{req.from.name || req.from.email}</p>
                  <p className="text-xs text-slate-400">{req.from.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespond(req.friendshipId, 'accept')}
                    className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-medium text-slate-950 transition hover:bg-emerald-400"
                  >
                    ✓ Qabul
                  </button>
                  <button
                    onClick={() => handleRespond(req.friendshipId, 'reject')}
                    className="rounded-lg border border-rose-600 px-3 py-1 text-xs text-rose-300 transition hover:bg-rose-950"
                  >
                    ✗ Rad
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">Do&apos;stlar ({friends.length})</h2>
        <div className="mt-3 space-y-2">
          {friends.length === 0 ? (
            <p className="text-sm text-slate-400">Hali do&apos;stlar yo&apos;q. Yuqoridagi qidiruvdan foydalaning.</p>
          ) : (
            friends.map((friend) => (
              <div key={friend.friendshipId} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{friend.name || friend.email}</p>
                  <p className="text-xs text-slate-400">ID: {friend.id.slice(0, 8)}...</p>
                </div>
                <button
                  onClick={() => handleRemove(friend.friendshipId)}
                  className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-400 transition hover:border-rose-600 hover:text-rose-300"
                >
                  O&apos;chirish
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
