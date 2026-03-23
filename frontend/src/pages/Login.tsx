import React, { useState, FormEvent } from 'react';
import { api } from '../api/client';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { AppLogo } from '../components/AppLogo';
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
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <AppLogo size="lg" />
          </div>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">PROJECTO</h2>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium tracking-tight">Area Riservata</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 px-1">Access Key</label>
            <div className="relative">
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="••••••••••••"
                className="h-14 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 text-zinc-900 outline-none transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/50 dark:text-white"
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !key.trim()}
            className="w-full h-14 bg-zinc-900 dark:bg-indigo-500 text-white rounded-2xl font-black tracking-tight hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {loading ? 'Verifica...' : 'Accedi'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="pt-4 text-center">
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest opacity-50">Private Instance · KM-P01</p>
          <button
            type="button"
            onClick={() => (window.location.href = '/')}
            className="mt-4 text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-indigo-500 transition-colors"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    </div>
  );
}
