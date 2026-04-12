import React, { useState, FormEvent } from 'react';
import { api } from '../api/client';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { AppLogo } from '../components/AppLogo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import type { LoginResponse } from '../types/api';

export default function Login(): React.ReactElement {
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!key.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = (await api.auth.login(key)) as LoginResponse | undefined;
      if (res?.token) {
        localStorage.setItem('km-user-role', 'admin');
        localStorage.setItem('km-admin-token', res.token);
        if (res.training) localStorage.setItem('km-training-allowed', '1');
        else localStorage.removeItem('km-training-allowed');
        window.location.href = '/dashboard';
      }
    } catch {
      setError('Chiave di accesso non valida o errore del server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <AppLogo size="lg" />
          </div>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">PROJECTO</h2>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium tracking-tight">Area Riservata</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 px-1">Access Key</label>
            <Input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="••••••••••••"
              className="h-14 text-base"
              autoComplete="off"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !key.trim()}
            className="w-full h-14"
            loading={loading}
            icon={!loading ? <ArrowRight size={18} /> : undefined}
          >
            {loading ? 'Verifica...' : 'Accedi'}
          </Button>
        </form>

        <div className="pt-4 text-center">
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest opacity-50">Private Instance</p>
          <Button
            variant="ghost"
            onClick={() => (window.location.href = '/')}
            className="mt-4 text-xs uppercase tracking-widest"
          >
            Torna alla Home
          </Button>
        </div>
      </div>
    </div>
  );
}
