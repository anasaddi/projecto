import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

const SECTION_LABELS: Record<string, string> = {
  training: 'Training',
  transcript: 'Transcript',
};

async function hashPassword(pw: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(`km-shared:${pw}`));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function isSectionUnlocked(shareId: string, section: string, passwordHash: string | null): boolean {
  if (!shareId || !section || !passwordHash) return true;
  try {
    const stored = localStorage.getItem(`km-shared-section-${shareId}-${section}`);
    return stored === passwordHash;
  } catch {
    return false;
  }
}

interface SharedSectionGateProps {
  section: string;
  children: React.ReactNode;
}

export default function SharedSectionGate({ section, children }: SharedSectionGateProps): React.ReactElement {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sectionHash, setSectionHash] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) {
      setLoading(false);
      return;
    }
    api.training
      .getSharedDashboard(shareId)
      .then((data: unknown) => {
        const payload = (data as { data?: { sectionPasswords?: Record<string, string> } })?.data ?? {};
        const sp = (payload as { sectionPasswords?: Record<string, string> }).sectionPasswords ?? {};
        const hash = sp[section] ?? null;
        setSectionHash(hash);
        setNeedsPassword(!!hash && !isSectionUnlocked(shareId, section, hash));
      })
      .catch(() => setNeedsPassword(false))
      .finally(() => setLoading(false));
  }, [shareId, section]);

  const handleUnlock = async () => {
    const pw = passwordInput.trim();
    if (!pw || !sectionHash) return;
    setPasswordError(null);
    const h = await hashPassword(pw);
    if (h === sectionHash) {
      try {
        localStorage.setItem(`km-shared-section-${shareId}-${section}`, sectionHash);
      } catch {}
      setNeedsPassword(false);
    } else {
      setPasswordError('Password errata');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0B0F19] dark:to-[#121620]">
        <div className="text-gray-500 font-medium">Caricamento...</div>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0B0F19] dark:to-[#121620] p-4">
        <div className="w-full max-w-sm bg-white dark:bg-[#161920] rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-500/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-indigo-600 dark:text-indigo-400">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
            {SECTION_LABELS[section] ?? section} protetto
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
            Inserisci la password per accedere a questa sezione
          </p>
          <input
            type="password"
            autoComplete="off"
            value={passwordInput}
            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            placeholder="Password"
            className="mb-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            autoFocus
          />
          {passwordError && <p className="text-sm text-red-500 mb-4">{passwordError}</p>}
          <button
            type="button"
            onClick={handleUnlock}
            disabled={!passwordInput.trim()}
            className="w-full py-3 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => navigate(`/shared/${shareId}`)}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ← Torna allo shared
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
