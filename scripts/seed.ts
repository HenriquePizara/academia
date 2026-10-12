import "dotenv/config";
import { eq } from 'drizzle-orm';
import { db, schema } from '../src/db/client';
import { hashPassword } from '../src/lib/auth';

const EXERCICIOS = [
  ['Supino reto com barra', 'peito', 'Escápulas retraídas, controle na descida até 2 segundos.'],
  ['Supino inclinado com halteres', 'peito', 'Banco a 30°, foco no peito superior.'],
  ['Crucifixo na polia', 'peito', 'Cotovelo levemente flexionado, foco em alongamento.'],
  ['Pullover', 'peito', 'Costas neutras, sentir o alongamento no peitoral.'],
  ['Puxada frontal', 'costas', 'Puxe o peito em direção à barra, cotovelos para trás.'],
  ['Remada curvada', 'costas', 'Coluna neutra, contraia as escápulas ao puxar.'],
  ['Remada cavalinha', 'costas', 'Puxe em direção ao quadril, sem inclinar o tronco.'],
  ['Pullover na polia', 'costas', 'Extensão dos ombros com o cabo.'],
  ['Agachamento livre', 'pernas', 'Profundidade até a linha do joelho ou abaixo, joelho alinhado com o pé.'],
  ['Leg press 45°', 'pernas', 'Não travar o joelho no topo da extensão.'],
  ['Cadeira extensora', 'pernas', 'Controle na fase negativa, 3 segundos.'],
  ['Mesa flexora', 'pernas', 'Controlar a volta sem impulso.'],
  ['Elevação pélvica', 'pernas', 'Contrair o glúteo no topo por 2 segundos.'],
  ['Afundo com halteres', 'pernas', 'Passo largo e joelho da frente alinhado.'],
  ['Desenvolvimento com halteres', 'ombros', 'Sem compensar com a lombar.'],
  ['Elevação lateral', 'ombros', 'Até a altura dos ombros, cotovelo semi-flexionado.'],
  ['Face pull', 'ombros', 'Puxe para o rosto, rotação externa no topo.'],
  ['Elevação frontal', 'ombros', 'Movimento controlado, sem balanço.'],
  ['Rosca direta', 'bracos', 'Cotovelo fixo ao lado do corpo.'],
  ['Rosca alternada', 'bracos', 'Supinação leve, controle na descida.'],
  ['Tríceps corda', 'bracos', 'Cotovelo junto ao tronco, extensão completa.'],
  ['Tríceps testa', 'bracos', 'Inclinação leve do tronco.'],
  ['Prancha frontal', 'core', 'Quadril alinhado, contrair glúteo e abdômen.'],
  ['Prancha lateral', 'core', 'Quadril empilhado, ombro sob o cotovelo.'],
  ['Abdominal canoa', 'core', 'Coluna neutra, evitar hiperlordose.'],
  ['Dead bug', 'core', 'Lombar sempre colada no chão.'],
  ['Esteira — resistência 6', 'cardio', 'ritmo constante, intensidade moderada.'],
  ['Bike ergométrica', 'cardio', 'Cadência de 80 a 90 rpm.'],
  ['Corda naval', 'fullbody', 'Trabalha empurrar, puxar e o core ao mesmo tempo.'],
] as const;

type TreinoSeed = {
  nome: string;
  observacoes: string;
  itens: [nome: string, series: number, reps: string, descanso: number, ordem: number][];
};

const TREINOS: TreinoSeed[] = [
  {
    nome: 'Treino A — Peito e Tríceps',
    observacoes:
      'Comece com 2 séries de aquecimento com peso leve antes da primeira série de trabalho. Descanse 60 a 90 segundos entre as séries.',
    itens: [
      ['Supino reto com barra', 4, '8-10', 60, 0],
      ['Supino inclinado com halteres', 3, '10-12', 75, 1],
      ['Crucifixo na polia', 3, '12-15', 45, 2],
      ['Pullover', 3, '12-15', 45, 3],
      ['Tríceps corda', 3, '10-12', 60, 4],
      ['Tríceps testa', 3, '12-15', 45, 5],
    ],
  },
  {
    nome: 'Treino B — Costas e Bíceps',
    observacoes: 'Puxe com a escápula antes do cotovelo. Se a carga pesar demais, reduza 20%.',
    itens: [
      ['Puxada frontal', 4, '8-10', 75, 0],
      ['Remada curvada', 4, '8-10', 60, 1],
      ['Remada cavalinha', 3, '10-12', 60, 2],
      ['Pullover na polia', 3, '12-15', 45, 3],
      ['Rosca direta', 3, '10-12', 45, 4],
      ['Rosca alternada', 3, '12-15', 30, 5],
    ],
  },
  {
    nome: 'Treino C — Pernas e Core',
    observacoes:
      'Agachamento com barra exige professor no início. Alongue posterior de coxa ao final — Alongamento em 30 segundos de cada lado.',
    itens: [
      ['Agachamento livre', 4, '8-10', 120, 0],
      ['Leg press 45°', 3, '10-12', 90, 1],
      ['Elevação pélvica', 3, '12-15', 60, 2],
      ['Cadeira extensora', 3, '12-15', 60, 3],
      ['Mesa flexora', 3, '12-15', 60, 4],
      ['Afundo com halteres', 3, '10-12', 60, 5],
      ['Prancha frontal', 3, '45-60s', 45, 6],
      ['Dead bug', 3, '12 cada lado', 45, 7],
    ],
  },
  {
    nome: 'Treino D — Ombros e Condicionamento',
    observacoes: 'Finalize com 10 a 15 minutos de cardio em intensidade moderada.',
    itens: [
      ['Desenvolvimento com halteres', 4, '8-10', 75, 0],
      ['Elevação lateral', 3, '12-15', 45, 1],
      ['Elevação frontal', 3, '12-15', 30, 2],
      ['Face pull', 3, '15-20', 30, 3],
      ['Prancha lateral', 3, '30-45s', 45, 4],
      ['Abdominal canoa', 3, '12', 45, 5],
      ['Esteira — resistência 6', 1, '10 min', 0, 6],
      ['Bike ergométrica', 1, '10 min', 0, 7],
    ],
  },
];

const ALUNO_EMAIL = process.env.SEED_ALUNO_EMAIL ?? 'aluno@academia.wbmonster.com.br';
const ALUNO_SENHA = process.env.SEED_ALUNO_SENHA ?? 'academia2026';
const PERSONAL_EMAIL = process.env.SEED_PERSONAL_EMAIL ?? 'personal@academia.wbmonster.com.br';
const PERSONAL_SENHA = process.env.SEED_PERSONAL_SENHA ?? 'academia2026';

async function upsertUser(dados: {
  email: string;
  nome: string;
  role: 'aluno' | 'personal';
  senha: string;
  cref?: string;
}) {
  const email = dados.email.toLowerCase();
  const senhaHash = await hashPassword(dados.senha);
  const [existente] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  if (existente) {
    await db
      .update(schema.users)
      .set({ nome: dados.nome, role: dados.role, senhaHash, ativo: true })
      .where(eq(schema.users.id, existente.id));
    return existente.id;
  }
  const [novo] = await db
    .insert(schema.users)
    .values({
      email,
      nome: dados.nome,
      role: dados.role,
      senhaHash,
      provider: 'email',
      cref: dados.cref,
    })
    .returning({ id: schema.users.id });
  return novo.id;
}

const personalId = await upsertUser({
  email: PERSONAL_EMAIL,
  nome: 'Carlos Ribeiro',
  role: 'personal',
  senha: PERSONAL_SENHA,
  cref: '128477-G/SP',
});
const alunoId = await upsertUser({
  email: ALUNO_EMAIL,
  nome: 'Ana Paula Souza',
  role: 'aluno',
  senha: ALUNO_SENHA,
});

await db
  .update(schema.users)
  .set({ personalId })
  .where(eq(schema.users.id, alunoId));

const catalogo = new Map<string, string>();
for (const [nome, grupo, descricao] of EXERCICIOS) {
  const [existente] = await db
    .select({ id: schema.exercicios.id })
    .from(schema.exercicios)
    .where(eq(schema.exercicios.nome, nome))
    .limit(1);
  if (existente) {
    catalogo.set(nome, existente.id);
    continue;
  }
  const [novo] = await db
    .insert(schema.exercicios)
    .values({ nome, grupoMuscular: grupo, descricao, ownerId: personalId })
    .returning({ id: schema.exercicios.id });
  catalogo.set(nome, novo.id);
}

for (const treino of TREINOS) {
  const [existente] = await db
    .select({ id: schema.treinos.id })
    .from(schema.treinos)
    .where(eq(schema.treinos.nome, treino.nome))
    .limit(1);
  if (existente) continue;

  const [criado] = await db
    .insert(schema.treinos)
    .values({
      nome: treino.nome,
      observacoes: treino.observacoes,
      personalId,
      alunoId,
    })
    .returning({ id: schema.treinos.id });

  const linhas = treino.itens
    .map(([nome, series, reps, descanso, ordem]) => ({
      treinoId: criado.id,
      exercicioId: catalogo.get(nome)!,
      series,
      repeticoes: reps,
      descansoSegundos: descanso,
      ordem,
    }))
    .filter((l) => Boolean(l.exercicioId));
  if (linhas.length > 0) {
    await db.insert(schema.treinoExercicios).values(linhas);
  }
}

const exercicios = await db.select({ id: schema.exercicios.id }).from(schema.exercicios);
const treinos = await db.select({ id: schema.treinos.id }).from(schema.treinos);
const itens = await db.select({ id: schema.treinoExercicios.id }).from(schema.treinoExercicios);

console.log('Seed concluido:', {
  usuarios: 2,
  exercicios: exercicios.length,
  treinos: treinos.length,
  itensTreino: itens.length,
});
console.log('Aluno:', ALUNO_EMAIL, '/', ALUNO_SENHA);
console.log('Personal:', PERSONAL_EMAIL, '/', PERSONAL_SENHA);
process.exit(0);
