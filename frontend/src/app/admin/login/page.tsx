'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import apiClient from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/store/useToastStore';
import axios from 'axios';
import type { AuthResponse } from '@/types/api';
import { Film, Loader2, Lock, User } from 'lucide-react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('กรุณากรอก Username และ Password');
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post<AuthResponse>('/api/auth/login', {
        username,
        password,
      });
      setAuth(data);
      toast.success(`ยินดีต้อนรับ ${data.username}!`, {
        description: 'เข้าสู่ระบบผู้ดูแลระบบ Nature MiniPlex เรียบร้อยแล้ว',
      });
      router.push('/admin/movies');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error('Username หรือ Password ไม่ถูกต้อง');
      } else {
        toast.error('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(227,24,55,0.12),transparent)]" />

      <div className="relative w-full max-w-md">
        <div className="glass rounded-2xl p-8 border border-surface-border shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-red shadow-lg shadow-brand-red/30 mb-4">
              <Film className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white font-prompt">Admin Login</h1>
            <p className="text-muted-foreground text-sm mt-1">Nature MiniPlex Management</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-username" className="text-muted-foreground">
                <User className="w-3.5 h-3.5 inline mr-1.5" />
                Username
              </Label>
              <Input
                id="admin-username"
                type="text"
                autoComplete="username"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-surface-base border-surface-border text-white placeholder:text-muted-foreground focus-visible:ring-brand-red"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-muted-foreground">
                <Lock className="w-3.5 h-3.5 inline mr-1.5" />
                Password
              </Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-surface-base border-surface-border text-white placeholder:text-muted-foreground focus-visible:ring-brand-red"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red hover:bg-brand-red-dark text-white font-semibold h-11 shadow-lg shadow-brand-red/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />กำลังเข้าสู่ระบบ...</>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
