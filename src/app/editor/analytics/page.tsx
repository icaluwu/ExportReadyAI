'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  BarChart3,
  BookOpen,
  Eye,
  Clock,
  TrendingUp,
  Award,
  Loader2,
  ChevronRight,
  Tag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  view_count: number;
  content: string;
  category?: {
    name: string;
    color: string;
  };
}

function estimateReadTime(content: string): number {
  return Math.max(1, Math.ceil((content || '').split(/\s+/).length / 200));
}

export default function EditorAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('blog_posts')
          .select('id, title, slug, status, view_count, content, category:blog_categories(name, color)')
          .eq('author_id', user.id)
          .then(({ data, error }) => {
            if (error) {
              toast.error(error.message || 'Gagal memuat analitik.');
            } else {
              setPosts((data as unknown as BlogPost[]) || []);
            }
            setLoading(false);
          });
      }
    });
  }, []);

  // Stats Calculations
  const totalPosts = posts.length;
  const totalViews = posts.reduce((sum, p) => sum + (p.view_count || 0), 0);
  const avgReadTime = totalPosts > 0
    ? Math.round(posts.reduce((sum, p) => sum + estimateReadTime(p.content), 0) / totalPosts)
    : 0;

  const topPost = posts.length > 0
    ? [...posts].sort((a, b) => b.view_count - a.view_count)[0]
    : null;

  // Category Distribution
  const categoryMap: Record<string, { count: number; color: string; views: number }> = {};
  posts.forEach(p => {
    if (p.category) {
      const name = p.category.name;
      if (!categoryMap[name]) {
        categoryMap[name] = { count: 0, color: p.category.color || '#10b981', views: 0 };
      }
      categoryMap[name].count += 1;
      categoryMap[name].views += p.view_count || 0;
    }
  });

  const categoriesData = Object.entries(categoryMap).map(([name, data]) => ({
    name,
    ...data,
  })).sort((a, b) => b.views - a.views);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-2" aria-label="Breadcrumb">
          <Link href="/editor/dashboard" className="hover:text-primary transition-colors">Editor Hub</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-600 dark:text-slate-400">Analitik Konten</span>
        </nav>
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" /> Analitik Konten
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          Pantau performa dan tayangan dari seluruh artikel Anda secara real-time.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-500">Memuat data analitik...</p>
        </div>
      ) : posts.length === 0 ? (
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 py-16 text-center rounded-2xl">
          <CardContent>
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="font-black text-slate-700 dark:text-slate-300 mb-2">Belum ada data</h3>
            <p className="text-slate-400 text-sm">
              Analitik akan tampil setelah Anda mulai mempublikasikan artikel pertama Anda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { label: 'Total Artikel', value: totalPosts, icon: BookOpen, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Total Tayangan', value: totalViews.toLocaleString('id-ID'), icon: Eye, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
              { label: 'Rata-rata Baca', value: `${avgReadTime} mnt`, icon: Clock, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Artikel Terbaik', value: topPost ? topPost.view_count.toLocaleString('id-ID') + ' tayangan' : '0', icon: Award, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-50 leading-tight">{stat.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            {/* Top Articles */}
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Artikel Terpopuler
                </CardTitle>
                <CardDescription>Daftar artikel yang memiliki performa tayangan tertinggi</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[...posts].sort((a, b) => b.view_count - a.view_count).slice(0, 5).map((post, idx) => (
                    <div key={post.id} className="flex items-center gap-4 p-6 hover:bg-slate-50/50 transition-colors">
                      <span className="font-black text-xl text-slate-300 dark:text-slate-700 w-6">0{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{post.title}</h4>
                        <span className="text-xs text-slate-400 font-mono">/blog/{post.slug}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-slate-700 dark:text-slate-300 font-bold text-sm bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                        <Eye className="h-4 w-4 text-emerald-500" />
                        {post.view_count || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Category Performance */}
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" /> Performa Kategori
                </CardTitle>
                <CardDescription>Berdasarkan total tayangan per kategori</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {categoriesData.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">Belum ada kategori terdeteksi.</p>
                ) : (
                  categoriesData.map(cat => {
                    const percentage = totalViews > 0 ? (cat.views / totalViews) * 100 : 0;
                    return (
                      <div key={cat.name} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                            {cat.name}
                          </span>
                          <span className="text-slate-500">{cat.views.toLocaleString('id-ID')} tayangan ({Math.round(percentage)}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ backgroundColor: cat.color, width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
