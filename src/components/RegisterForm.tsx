import { useState } from 'react';

export default function RegisterForm() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar conta');
      window.location.href = '/app';
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div>
        <label htmlFor="reg-nome" className="block text-sm font-medium text-zinc-300 mb-1.5">Nome completo</label>
        <input
          id="reg-nome"
          type="text"
          required
          minLength={2}
          autoComplete="name"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full h-11 rounded-lg border border-white/10 bg-white/5 px-3.5 text-sm text-white placeholder-zinc-500 focus:border-[#DC2626] focus:outline-none"
          placeholder="Seu nome"
        />
      </div>
      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-zinc-300 mb-1.5">E-mail</label>
        <input
          id="reg-email"
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
        <label htmlFor="reg-senha" className="block text-sm font-medium text-zinc-300 mb-1.5">Senha</label>
        <input
          id="reg-senha"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full h-11 rounded-lg border border-white/10 bg-white/5 px-3.5 text-sm text-white placeholder-zinc-500 focus:border-[#DC2626] focus:outline-none"
          placeholder="Mínimo 6 caracteres"
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
        {loading ? 'Criando conta...' : 'Criar conta'}
      </button>
      <p className="text-center text-sm text-zinc-500">
        Já tem conta?{' '}
        <a href="/login" className="text-white underline hover:text-zinc-300">
          Entrar
        </a>
      </p>
    </form>
  );
}
