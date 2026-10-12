import { useState, useEffect } from 'react';

type Consent = { essential: boolean; analytics: boolean; marketing: boolean };

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [consent, setConsent] = useState<Consent>({ essential: true, analytics: false, marketing: false });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cookie-consent');
      if (!saved) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (value: Consent) => {
    try { localStorage.setItem('cookie-consent', JSON.stringify(value)); } catch {}
    setVisible(false);
  };

  const acceptAll = () => save({ essential: true, analytics: true, marketing: true });
  const rejectAll = () => save({ essential: true, analytics: false, marketing: false });
  const savePrefs = () => save(consent);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4" role="dialog" aria-label="Consentimento de cookies">
      <div className="mx-auto max-w-[920px] rounded-2xl border border-white/10 bg-[#0A0A0A]/95 backdrop-blur p-6 shadow-2xl">
        {!showPrefs ? (
          <>
            <p className="text-sm leading-6 text-zinc-300">
              Usamos cookies essenciais para o funcionamento do site. Cookies analíticos e de marketing são ativados apenas com seu consentimento.{' '}
              <a href="/cookies" className="text-white underline">Saiba mais</a>
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={acceptAll} className="h-10 px-5 rounded-full bg-white text-zinc-900 font-bold text-sm hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-white">Aceitar todos</button>
              <button onClick={rejectAll} className="h-10 px-5 rounded-full border border-white/20 text-white font-bold text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white">Recusar não essenciais</button>
              <button onClick={() => setShowPrefs(true)} className="h-10 px-5 rounded-full text-zinc-400 text-sm underline hover:text-white">Preferências</button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm text-zinc-300">
                <input type="checkbox" checked disabled className="h-4 w-4 accent-[#DC2626]" />
                <span><strong className="text-white">Essenciais</strong> — necessários para o funcionamento (sempre ativos)</span>
              </label>
              <label className="flex items-center gap-3 text-sm text-zinc-300">
                <input type="checkbox" checked={consent.analytics} onChange={e => setConsent({ ...consent, analytics: e.currentTarget.checked })} className="h-4 w-4 accent-[#DC2626]" />
                <span><strong className="text-white">Analíticos</strong> — ajudam a melhorar o site</span>
              </label>
              <label className="flex items-center gap-3 text-sm text-zinc-300">
                <input type="checkbox" checked={consent.marketing} onChange={e => setConsent({ ...consent, marketing: e.currentTarget.checked })} className="h-4 w-4 accent-[#DC2626]" />
                <span><strong className="text-white">Marketing</strong> — anúncios relevantes</span>
              </label>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={savePrefs} className="h-10 px-5 rounded-full bg-white text-zinc-900 font-bold text-sm hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-white">Salvar preferências</button>
              <button onClick={() => setShowPrefs(false)} className="h-10 px-5 rounded-full text-zinc-400 text-sm underline hover:text-white">Voltar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
