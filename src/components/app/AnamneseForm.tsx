import { useEffect, useState } from 'react';

type Respostas = {
  objetivo?: string;
  nivelTreino?: string;
  restricoes?: string;
  lesoes?: string;
  doencasCronicas?: string;
  medicamento?: string;
};

const OBJETIVOS = [
  ['hipertrofia', 'Hipertrofia'],
  ['emagrecimento', 'Emagrecimento'],
  ['condicionamento', 'Condicionamento'],
  ['saude', 'Saúde e bem-estar'],
  ['reabilitacao', 'Reabilitação'],
] as const;

const NIVEIS = [
  ['iniciante', 'Iniciante'],
  ['intermediario', 'Intermediário'],
  ['avancado', 'Avançado'],
] as const;

export default function AnamneseForm({ inicial }: { inicial: Respostas | null }) {
  const [objetivo, setObjetivo] = useState(inicial?.objetivo ?? '');
  const [nivel, setNivel] = useState(inicial?.nivelTreino ?? '');
  const [restricoes, setRestricoes] = useState(inicial?.restricoes ?? '');
  const [lesoes, setLesoes] = useState(inicial?.lesoes ?? '');
  const [doencas, setDoencas] = useState(inicial?.doencasCronicas ?? '');
  const [medicamento, setMedicamento] = useState(inicial?.medicamento ?? '');
  const [consentimento, setConsentimento] = useState(false);
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'erro'>('idle');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (inicial?.objetivo) setObjetivo(inicial.objetivo);
    if (inicial?.nivelTreino) setNivel(inicial.nivelTreino);
  }, [inicial]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setEstado('enviando');
    setErro('');
    try {
      const res = await fetch('/api/anamnese', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objetivo,
          nivelTreino: nivel,
          restricoes,
          lesoes,
          doencasCronicas: doencas,
          medicamento,
          consentimento,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível salvar');
      setEstado('ok');
      setConsentimento(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao salvar');
      setEstado('erro');
    }
  }

  const campo =
    'mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#DC2626] focus:outline-none';

  return (
    <form onSubmit={salvar} className="space-y-6">
      <fieldset>
        <legend className="text-sm font-bold text-white">Qual é o seu objetivo principal?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {OBJETIVOS.map(([v, r]) => (
            <label
              key={v}
              className={
                'flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ' +
                (objetivo === v
                  ? 'border-[#DC2626] bg-[#DC2626]/10 text-white'
                  : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/25')
              }
            >
              <input
                type="radio"
                name="objetivo"
                value={v}
                checked={objetivo === v}
                onChange={() => setObjetivo(v)}
                className="h-4 w-4 accent-[#DC2626]"
              />
              {r}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-bold text-white">Seu nível de treino</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {NIVEIS.map(([v, r]) => (
            <label
              key={v}
              className={
                'flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ' +
                (nivel === v
                  ? 'border-[#DC2626] bg-[#DC2626]/10 text-white'
                  : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/25')
              }
            >
              <input
                type="radio"
                name="nivel"
                value={v}
                checked={nivel === v}
                onChange={() => setNivel(v)}
                className="h-4 w-4 accent-[#DC2626]"
              />
              {r}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-4">
        <div>
          <label htmlFor="restricoes" className="block text-sm font-medium text-zinc-300">
            Restrições alimentares ou de rotina
          </label>
          <textarea
            id="restricoes"
            rows={2}
            maxLength={2000}
            value={restricoes}
            onChange={(e) => setRestricoes(e.target.value)}
            placeholder="Ex.: não como carne, treino antes das 7h..."
            className={campo}
          />
        </div>
        <div>
          <label htmlFor="lesoes" className="block text-sm font-medium text-zinc-300">
            Lesões ou dores atuais
          </label>
          <textarea
            id="lesoes"
            rows={2}
            maxLength={2000}
            value={lesoes}
            onChange={(e) => setLesoes(e.target.value)}
            placeholder="Ex.: joelho direito, ombro esquerdo..."
            className={campo}
          />
        </div>
        <div>
          <label htmlFor="doencas" className="block text-sm font-medium text-zinc-300">
            Doenças crônicas ou condições de saúde
          </label>
          <textarea
            id="doencas"
            rows={2}
            maxLength={2000}
            value={doencas}
            onChange={(e) => setDoencas(e.target.value)}
            placeholder="Ex.: hipertensão, diabetes..."
            className={campo}
          />
        </div>
        <div>
          <label htmlFor="medicamento" className="block text-sm font-medium text-zinc-300">
            Medicações de uso contínuo
          </label>
          <textarea
            id="medicamento"
            rows={2}
            maxLength={2000}
            value={medicamento}
            onChange={(e) => setMedicamento(e.target.value)}
            placeholder="Ex.: losartana 50mg..."
            className={campo}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <label htmlFor="consent-anamnese" className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-zinc-300">
          <input
            id="consent-anamnese"
            type="checkbox"
            checked={consentimento}
            onChange={(e) => setConsentimento(e.currentTarget.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#DC2626]"
          />
          <span>
            Autorizo o tratamento dos dados de saúde informados acima pelo academic e pelo personal trainer
            responsável, conforme a{' '}
            <a href="/privacidade" className="text-white underline">
              Política de Privacidade
            </a>
            . Posso revogar esta autorização a qualquer momento.
          </span>
        </label>
      </div>

      {erro && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
          {erro}
        </p>
      )}

      {estado === 'ok' && (
        <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-300">
          Anamnese salva. Seu personal já pode consultar essas informações.
        </p>
      )}

      <button
        type="submit"
        disabled={estado === 'enviando' || !consentimento || !objetivo || !nivel}
        className="h-12 w-full rounded-lg bg-[#DC2626] text-base font-bold text-white hover:bg-[#B91C1C] transition focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {estado === 'enviando' ? 'Salvando...' : 'Salvar anamnese'}
      </button>
    </form>
  );
}
