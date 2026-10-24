import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { FriendsService } from '../services/friends.service';
import { AddFriendModal } from '../components/forms/AddFriendModal';
import { Button } from '../components/ui/Button';
import { formatRupee } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Receipt,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export const Friends = () => {
  const { openAddLoanModal } = useOutletContext() || {};
  const { success, error: toastError } = useToast();

  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState(null);

  const fetchFriends = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);
      const data = await FriendsService.listFriends();
      setFriends(data || []);
    } catch (err) {
      console.error('Failed to fetch friends', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const handleDelete = async (friend) => {
    if (friend.activeLoansCount > 0) {
      toastError(
        `Cannot delete ${friend.name}: There are ${friend.activeLoansCount} active unsettled loan(s). Settle all loans first.`
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to remove "${friend.name}" from your friends list?`)) {
      return;
    }

    try {
      await FriendsService.deleteFriend(friend.id);
      success(`"${friend.name}" removed successfully.`);
      fetchFriends(true);
    } catch (err) {
      toastError(err.message || 'Failed to delete friend.');
    }
  };

  const filteredFriends = friends.filter((f) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.phone && f.phone.includes(q)) ||
      (f.email && f.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Friends
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your personal contacts and their outstanding balances.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="md"
            onClick={() => fetchFriends(true)}
            isLoading={isRefreshing}
            className="border border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingFriend(null);
              setIsAddModalOpen(true);
            }}
            icon={Plus}
            className="flex-1 sm:flex-none"
          >
            Add Friend
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, phone or email..."
          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-card"
        />
      </div>

      {/* Friends Cards Grid */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200/80 shadow-card">
          <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading your friends list...</p>
        </div>
      ) : filteredFriends.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900">No friends found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add friends to start tracking mutual lending and borrowing transactions.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingFriend(null);
              setIsAddModalOpen(true);
            }}
            icon={Plus}
          >
            Add Your First Friend
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFriends.map((friend) => {
            const net = parseFloat(friend.netBalance || '0');
            const totalLent = parseFloat(friend.totalLent || '0');
            const totalBorrowed = parseFloat(friend.totalBorrowed || '0');

            return (
              <div
                key={friend.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top info & action buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 font-extrabold text-base flex items-center justify-center shrink-0 border border-slate-200/60">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 leading-snug">
                          {friend.name}
                        </h4>
                        <div className="space-y-0.5 mt-0.5">
                          {friend.phone && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>+91 {friend.phone}</span>
                            </p>
                          )}
                          {friend.email && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{friend.email}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingFriend(friend);
                          setIsAddModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Edit friend"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(friend)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete friend"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Financial Overview Box */}
                  <div className="mt-4 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Total Lent:</span>
                      <span className="font-semibold text-slate-900">{formatRupee(totalLent)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Total Borrowed:</span>
                      <span className="font-semibold text-indigo-700">{formatRupee(totalBorrowed)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 font-bold">
                      <span>Net Position:</span>
                      <span
                        className={
                          net > 0 ? 'text-emerald-700 font-extrabold' : net < 0 ? 'text-indigo-700 font-extrabold' : 'text-slate-500'
                        }
                      >
                        {net > 0
                          ? `+${formatRupee(net)} (Owes you)`
                          : net < 0
                          ? `-${formatRupee(Math.abs(net))} (You owe)`
                          : 'Settled (₹0.00)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom link to view loans */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">
                    {friend.activeLoansCount} active / {friend.totalLoansCount || 0} total loans
                  </span>

                  <Link
                    to={`/loans?search=${encodeURIComponent(friend.name)}`}
                    className="font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                  >
                    <span>View Loans</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Friend Modal */}
      <AddFriendModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingFriend(null);
        }}
        initialFriend={editingFriend}
        onSuccess={() => fetchFriends(true)}
      />
    </div>
  );
};
