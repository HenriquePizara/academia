import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db, schema } from '../src/db/client';

const ALUNO_EMAIL = process.env.SEED_ALUNO_EMAIL ?? 'aluno@academia.wbmonster.com.br';

const [aluno] = await db
  .select({ id: schema.users.id })
  .from(schema.users)
  .where(eq(schema.users.email, ALUNO_EMAIL.toLowerCase()))
  .limit(1);

if (!aluno) {
  console.log('Aluno nao encontrado. Rode o seed primeiro.');
  process.exit(1);
}

const treinos = await db
  .select({ id: schema.treinos.id, nome: schema.treinos.nome })
  .from(schema.treinos)
  .where(eq(schema.treinos.alunoId, aluno.id));

// Historico de 7 semanas: 3 a 4 sessoes por semana, carga subindo 2,5 kg por semana.
const cargasBase: Record<string, number> = {
  'Treino A — Peito e Tríceps': 1650,
  'Treino B — Costas e Bíceps': 1420,
  'Treino C — Pernas e Core': 2100,
  'Treino D — Ombros e Condicionamento': 980,
};

const ciclo = ['Treino A — Peito e Tríceps', 'Treino B — Costas e Bíceps', 'Treino C — Pernas e Core', 'Treino D — Ombros e Condicionamento', 'Treino A — Peito e Tríceps', 'Treino B — Costas e Bíceps'];

const registros: {
  treinoId: string;
  alunoId: string;
  dataExecucao: string;
  concluido: boolean;
  cargaReal: string;
  observacao: string;
}[] = [];

const obs = [
  'Dia forte, consegui subir a carga.',
  'Bom ritmo, sem dor.',
  'Cansado mas completo.',
  'Aumentei 2,5 kg e senti bem.',
  'Sessão mais rápida da semana.',
  'Mantendo a carga para consolidar a técnica.',
];

const hoje = new Date();
for (let semana = 6; semana >= 0; semana -= 1) {
  const sessoes = semana % 3 === 0 ? 4 : 3;
  for (let s = 0; s < sessoes; s += 1) {
    const nome = ciclo[(semana * 3 + s) % ciclo.length];
    const treino = treinos.find((t) => t.nome === nome);
    if (!treino) continue;

    const d = new Date(hoje);
    d.setDate(d.getDate() - semana * 7 - s);
    if (d >= hoje) continue;
    const data = d.toISOString().slice(0, 10);

    const base = cargasBase[nome] ?? 1000;
    const carga = Math.round(base * (1 + (6 - semana) * 0.045));
    registros.push({
      treinoId: treino.id,
      alunoId: aluno.id,
      dataExecucao: data,
      concluido: true,
      cargaReal: String(carga),
      observacao: obs[(semana + s) % obs.length],
    });
  }
}

let inseridos = 0;
for (const r of registros) {
  const inserted = await db
    .insert(schema.execucoes)
    .values(r)
    .onConflictDoNothing()
    .returning({ id: schema.execucoes.id });
  if (inserted.length > 0) inseridos += 1;
}

const anamnese = {
  objetivo: 'hipertrofia',
  nivelTreino: 'intermediario',
  restricoes: 'Sem restrição alimentar. Treino sempre após as 19h.',
  lesoes: 'Sensibilidade antiga no ombro direito com carga alta acima da cabeça.',
  doencasCronicas: 'Nenhuma.',
  medicamento: 'Nenhum.',
};

await db
  .insert(schema.anamneses)
  .values({ alunoId: aluno.id, respostas: anamnese })
  .onConflictDoUpdate({ target: schema.anamneses.alunoId, set: { respostas: anamnese } });

await db
  .insert(schema.consentimentos)
  .values({ userId: aluno.id, tipo: 'anamnese', versao: '1.0' })
  .onConflictDoNothing();

console.log('Historico:', inseridos, 'sessoes inseridas');
process.exit(0);
