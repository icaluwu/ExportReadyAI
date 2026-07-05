'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  Search,
  Trash2,
  RefreshCw,
  Loader2,
  Shield,
  PenLine,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdminUser {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  phone_number: string;
  account_type: 'user' | 'editor' | 'admin';
  created_at: string;
  email: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  view_count: number;
  published_at: string;
  author?: {
    full_name: string;
  };
}

interface PaymentTransaction {
  id: string;
  order_id: string;
  gross_amount: number;
  status: 'pending' | 'settlement' | 'expire' | 'cancel' | 'deny';
  created_at: string;
  user?: {
    full_name: string;
  };
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'posts' | 'transactions'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data States
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [postSearch, setPostSearch] = useState('');
  const [txSearch, setTxSearch] = useState('');

  // Fetch all admin data
  async function loadData() {
    try {
      setLoading(true);

      // Fetch users via secure RPC
      const { data: usersData, error: usersErr } = await supabase
        .rpc('get_users_for_admin');

      if (usersErr) throw usersErr;
      setUsers((usersData as unknown as AdminUser[]) || []);

      // Fetch blog posts
      const { data: postsData, error: postsErr } = await supabase
        .from('blog_posts')
        .select('id, title, slug, status, view_count, published_at, author:profiles(full_name)')
        .order('created_at', { ascending: false });

      if (postsErr) throw postsErr;
      setPosts((postsData as unknown as BlogPost[]) || []);

      // Fetch transactions
      const { data: txData, error: txErr } = await supabase
        .from('payment_transactions')
        .select('id, order_id, gross_amount, status, created_at, user:profiles(full_name)')
        .order('created_at', { ascending: false });

      if (txErr) throw txErr;
      setTransactions((txData as unknown as PaymentTransaction[]) || []);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data.';
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    toast.success('Data diperbarui!');
  }

  // Promote / Demote User Role
  async function updateUserRole(userId: string, newRole: 'user' | 'editor' | 'admin') {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_type: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Role user berhasil diperbarui!');
      // Update locally
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, account_type: newRole } : u));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui role.';
      toast.error(msg);
    }
  }

  // Change Blog Post Status
  async function updatePostStatus(postId: string, newStatus: 'draft' | 'published' | 'archived') {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ status: newStatus })
        .eq('id', postId);

      if (error) throw error;

      toast.success('Status artikel diperbarui!');
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: newStatus } : p));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui status artikel.';
      toast.error(msg);
    }
  }

  // Delete Blog Post
  async function deletePost(postId: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus artikel ini? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast.success('Artikel berhasil dihapus!');
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus artikel.';
      toast.error(msg);
    }
  }

  // Stats Calculations
  const totalUsers = users.length;
  const totalEditors = users.filter(u => u.account_type === 'editor').length;
  const totalAdmins = users.filter(u => u.account_type === 'admin').length;
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === 'published').length;

  const totalRevenue = transactions
    .filter(tx => tx.status === 'settlement')
    .reduce((sum, tx) => sum + tx.gross_amount, 0);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  // Filters
  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredPosts = posts.filter(p =>
    p.title?.toLowerCase().includes(postSearch.toLowerCase()) ||
    p.author?.full_name?.toLowerCase().includes(postSearch.toLowerCase())
  );

  const filteredTxs = transactions.filter(tx =>
    tx.order_id?.toLowerCase().includes(txSearch.toLowerCase()) ||
    tx.user?.full_name?.toLowerCase().includes(txSearch.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" /> Admin Panel Superadmin
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Pantau dan kelola seluruh aktivitas pengguna, konten blog, serta transaksi pembayaran.
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing || loading} className="font-bold flex items-center gap-2">
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Perbarui Data
        </Button>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-500">Memuat data Admin Hub...</p>
        </div>
      ) : (
        <>
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-1.5 border border-slate-100 dark:border-slate-800">
            {[
              { id: 'overview', label: 'Ringkasan', icon: TrendingUp },
              { id: 'users', label: 'Daftar User', icon: Users },
              { id: 'posts', label: 'Artikel Blog', icon: FileText },
              { id: 'transactions', label: 'Transaksi', icon: CreditCard },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'users' | 'posts' | 'transactions')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {/* ─── TAB: OVERVIEW ─── */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Visual Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  {[
                    { label: 'Total UMKM User', value: totalUsers, icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Total Editor', value: totalEditors, icon: PenLine, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
                    { label: 'Artikel Terpublikasi', value: `${publishedPosts} / ${totalPosts}`, icon: FileText, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Total Pendapatan', value: formatIDR(totalRevenue), icon: CreditCard, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
                  ].map(stat => {
                    const Icon = stat.icon;
                    return (
                      <Card key={stat.label} className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900">
                        <CardContent className="p-6">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-slate-50">{stat.value}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900">
                    <CardHeader>
                      <CardTitle className="text-base font-black">Statistik Pengguna</CardTitle>
                      <CardDescription>Pembagian hak akses user terdaftar</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { label: 'Superadmin', count: totalAdmins, percentage: (totalAdmins / totalUsers) * 100 || 0, color: 'bg-primary' },
                        { label: 'Editor Blog', count: totalEditors, percentage: (totalEditors / totalUsers) * 100 || 0, color: 'bg-amber-500' },
                        { label: 'Regular User (UMKM)', count: totalUsers - totalEditors - totalAdmins, percentage: ((totalUsers - totalEditors - totalAdmins) / totalUsers) * 100 || 0, color: 'bg-blue-500' },
                      ].map(r => (
                        <div key={r.label} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span>{r.label}</span>
                            <span>{r.count} ({Math.round(r.percentage)}%)</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${r.color}`} style={{ width: `${r.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900">
                    <CardHeader>
                      <CardTitle className="text-base font-black">Informasi Server & Database</CardTitle>
                      <CardDescription>Setup dan konfigurasi role saat ini</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
                        <span>Email Superadmin</span>
                        <span className="font-mono text-slate-900 dark:text-slate-100">teukuvaickal@export-ready-ai.vercel.app</span>
                      </div>
                      <div className="flex justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
                        <span>Verifikasi Email Superadmin</span>
                        <span className="text-emerald-600 dark:text-emerald-400">Bypass Aktif</span>
                      </div>
                      <div className="flex justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
                        <span>Sistem Onboarding Editor</span>
                        <span className="text-blue-600 dark:text-blue-400">Email Verification Gate</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Transaksi Sukses</span>
                        <span className="text-slate-900 dark:text-slate-100 font-bold">{transactions.filter(t => t.status === 'settlement').length} Transaksi</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* ─── TAB: USERS ─── */}
            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cari user berdasarkan nama, email, atau username..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="pl-10 h-11 bg-white dark:bg-slate-900 border-none shadow-sm rounded-xl focus-visible:ring-primary/20"
                  />
                </div>

                <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold">
                        <tr>
                          <th className="px-6 py-4">Nama & Email</th>
                          <th className="px-6 py-4">Username</th>
                          <th className="px-6 py-4">Bergabung Pada</th>
                          <th className="px-6 py-4">Tipe Akun</th>
                          <th className="px-6 py-4 text-right">Ubah Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                              Tidak ada pengguna ditemukan.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map(userItem => (
                            <tr key={userItem.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                                    {(userItem.full_name || userItem.email || 'U')[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-100">{userItem.full_name || 'Tidak ada nama'}</p>
                                    <p className="text-xs text-slate-400 font-medium">{userItem.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                {userItem.username ? `@${userItem.username}` : '-'}
                              </td>
                              <td className="px-6 py-4 text-slate-400 text-xs">
                                {new Date(userItem.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                              </td>
                              <td className="px-6 py-4">
                                <Badge className={`font-black uppercase text-[9px] px-2 py-0.5 border-0 ${
                                  userItem.account_type === 'admin' ? 'bg-primary/10 text-primary' :
                                  userItem.account_type === 'editor' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                                  'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {userItem.account_type}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Select
                                  defaultValue={userItem.account_type}
                                  onValueChange={(val: 'user' | 'editor' | 'admin') => updateUserRole(userItem.id, val)}
                                  disabled={userItem.email === 'teukuvaickal@export-ready-ai.vercel.app'}
                                >
                                  <SelectTrigger className="w-28 ml-auto h-8 text-xs font-bold bg-slate-50 dark:bg-slate-800 border-none">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl border border-slate-100 dark:border-slate-800">
                                    <SelectItem value="user" className="text-xs font-semibold">User biasa</SelectItem>
                                    <SelectItem value="editor" className="text-xs font-semibold">Editor</SelectItem>
                                    <SelectItem value="admin" className="text-xs font-semibold">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ─── TAB: POSTS ─── */}
            {activeTab === 'posts' && (
              <motion.div
                key="posts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cari artikel berdasarkan judul atau nama penulis..."
                    value={postSearch}
                    onChange={e => setPostSearch(e.target.value)}
                    className="pl-10 h-11 bg-white dark:bg-slate-900 border-none shadow-sm rounded-xl focus-visible:ring-primary/20"
                  />
                </div>

                <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold">
                        <tr>
                          <th className="px-6 py-4">Judul Artikel</th>
                          <th className="px-6 py-4">Penulis</th>
                          <th className="px-6 py-4">Views</th>
                          <th className="px-6 py-4">Tanggal Rilis</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {filteredPosts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                              Tidak ada artikel blog ditemukan.
                            </td>
                          </tr>
                        ) : (
                          filteredPosts.map(postItem => (
                            <tr key={postItem.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4 max-w-xs truncate">
                                <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{postItem.title}</p>
                                <p className="text-xs text-slate-400 font-mono">/blog/{postItem.slug}</p>
                              </td>
                              <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                {postItem.author?.full_name || 'Tidak diketahui'}
                              </td>
                              <td className="px-6 py-4 text-slate-500 font-bold">
                                {postItem.view_count || 0}
                              </td>
                              <td className="px-6 py-4 text-slate-400 text-xs">
                                {postItem.published_at
                                  ? new Date(postItem.published_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })
                                  : '-'}
                              </td>
                              <td className="px-6 py-4">
                                <Select
                                  defaultValue={postItem.status}
                                  onValueChange={(val: 'draft' | 'published' | 'archived') => updatePostStatus(postItem.id, val)}
                                >
                                  <SelectTrigger className="w-28 h-8 text-xs font-bold bg-slate-50 dark:bg-slate-800 border-none">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl border border-slate-100 dark:border-slate-800">
                                    <SelectItem value="draft" className="text-xs font-semibold">Draft</SelectItem>
                                    <SelectItem value="published" className="text-xs font-semibold">Published</SelectItem>
                                    <SelectItem value="archived" className="text-xs font-semibold">Archived</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button
                                  variant="ghost"
                                  onClick={() => deletePost(postItem.id)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ─── TAB: TRANSACTIONS ─── */}
            {activeTab === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cari transaksi berdasarkan order ID atau nama pembeli..."
                    value={txSearch}
                    onChange={e => setTxSearch(e.target.value)}
                    className="pl-10 h-11 bg-white dark:bg-slate-900 border-none shadow-sm rounded-xl focus-visible:ring-primary/20"
                  />
                </div>

                <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold">
                        <tr>
                          <th className="px-6 py-4">Order ID</th>
                          <th className="px-6 py-4">Nama UMKM</th>
                          <th className="px-6 py-4">Gross Amount</th>
                          <th className="px-6 py-4">Tanggal Pembayaran</th>
                          <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {filteredTxs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                              Tidak ada riwayat transaksi ditemukan.
                            </td>
                          </tr>
                        ) : (
                          filteredTxs.map(txItem => (
                            <tr key={txItem.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4 font-mono text-xs text-slate-800 dark:text-slate-200">
                                {txItem.order_id}
                              </td>
                              <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                {txItem.user?.full_name || 'Tidak diketahui'}
                              </td>
                              <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-bold">
                                {formatIDR(txItem.gross_amount)}
                              </td>
                              <td className="px-6 py-4 text-slate-400 text-xs">
                                {new Date(txItem.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Badge className={`font-black uppercase text-[9px] px-2 py-0.5 border-0 ${
                                  txItem.status === 'settlement' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                  txItem.status === 'pending' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                  'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {txItem.status === 'settlement' ? 'success' : txItem.status}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
