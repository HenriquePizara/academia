import { useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState<'aluno' | 'personal' | null>(null);

  const executarLogin = async (eEmail: string, eSenha: string, redirectUrl = '/app') => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: eEmail, senha: eSenha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao entrar');
      window.location.href = redirectUrl;
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar');
      setLoading(false);
      setLoadingDemo(null);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    await executarLogin(email, senha, '/app');
  };

  const handleDemo = async (tipo: 'aluno' | 'personal') => {
    setLoadingDemo(tipo);
    const eEmail =
      tipo === 'personal'
        ? 'personal@academia.wbmonster.com.br'
        : 'aluno@academia.wbmonster.com.br';
    const eSenha = 'academia2026';
    setEmail(eEmail);
    setSenha(eSenha);
    await executarLogin(eEmail, eSenha, tipo === 'personal' ? '/app/personal' : '/app');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/50">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-zinc-300 mb-1.5">
            E-mail
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 rounded-lg border border-white/10 bg-white/5 px-3.5 text-sm text-white placeholder-zinc-500 focus:border-[#DC2626] focus:outline-none"
            placeholder="seu@email.com"
          />
        </div>
        <div>
          <label htmlFor="login-senha" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Senha
          </label>
          <input
            id="login-senha"
            type="password"
            required
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full h-11 rounded-lg border border-white/10 bg-white/5 px-3.5 text-sm text-white placeholder-zinc-500 focus:border-[#DC2626] focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div role="alert" className="rounded-lg bg-red-500/10 border border-red-500/30 px-3.5 py-2.5 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-lg bg-[#DC2626] text-white font-bold text-sm hover:bg-[#b91c1c] transition focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {loading && !loadingDemo ? 'Entrando...' : 'Entrar'}
        </button>

        {/* Bloco de Acesso Demonstração (1 Clique) */}
        <div className="pt-4 mt-2 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              ⚡ Acesso Demonstração (1 Clique)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#F97316]/20 text-orange-400 border border-orange-500/30">
              Ambiente de Teste
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Selecione um perfil para navegar imediatamente sem necessidade de preencher credenciais:
          </p>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemo('aluno')}
              className="flex flex-col items-start p-3 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-red-500/40 transition text-left group disabled:opacity-50 active:scale-[0.98]"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-white group-hover:text-red-400 flex items-center gap-1.5">
                  👤 Aluno Demo
                </span>
                {loadingDemo === 'aluno' && (
                  <span className="text-[10px] text-red-400 font-semibold animate-pulse">Entrando...</span>
                )}
              </div>
              <span className="text-[11px] font-medium text-zinc-300">Ana Paula Souza</span>
              <span className="text-[10px] text-zinc-500 mt-0.5">4 rotinas, 23 sessões, gráficos de evolução</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemo('personal')}
              className="flex flex-col items-start p-3 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-orange-500/40 transition text-left group disabled:opacity-50 active:scale-[0.98]"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-white group-hover:text-orange-400 flex items-center gap-1.5">
                  📋 Personal Demo
                </span>
                {loadingDemo === 'personal' && (
                  <span className="text-[10px] text-orange-400 font-semibold animate-pulse">Entrando...</span>
                )}
              </div>
              <span className="text-[11px] font-medium text-zinc-300">Prof. Carlos Ribeiro</span>
              <span className="text-[10px] text-zinc-500 mt-0.5">CREF, gestão de alunos e construtor</span>
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-zinc-500 pt-2">
          Não tem conta?{' '}
          <a href="/register" className="text-white underline hover:text-zinc-300">
            Cadastre-se
          </a>
        </p>
      </form>
    </div>
  );
}
