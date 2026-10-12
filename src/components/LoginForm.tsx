import { useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao entrar');
      window.location.href = '/app';
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-zinc-300 mb-1.5">E-mail</label>
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
        <label htmlFor="login-senha" className="block text-sm font-medium text-zinc-300 mb-1.5">Senha</label>
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
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3.5 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-lg bg-[#DC2626] text-white font-bold text-sm hover:bg-[#b91c1c] transition focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
      <p className="text-center text-sm text-zinc-500">
        Não tem conta?{' '}
        <a href="/register" className="text-white underline hover:text-zinc-300">
          Cadastre-se
        </a>
      </p>
    </form>
  );
}
