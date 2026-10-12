import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  numeric,
  date,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['admin', 'personal', 'aluno']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    nome: varchar('nome', { length: 255 }).notNull(),
    avatarUrl: text('avatar_url'),
    role: roleEnum('role').notNull().default('aluno'),
    cref: varchar('cref', { length: 32 }),
    personalId: uuid('personal_id').references((): any => users.id, { onDelete: 'set null' }),
    provider: varchar('provider', { length: 32 }).notNull().default('google'),
    senhaHash: text('senha_hash'),
    ativo: boolean('ativo').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('users_email_key').on(t.email),
    index('users_role_idx').on(t.role),
    index('users_personal_id_idx').on(t.personalId),
  ],
);

export const grupoMuscularEnum = pgEnum('grupo_muscular', [
  'peito',
  'costas',
  'pernas',
  'ombros',
  'bracos',
  'core',
  'cardio',
  'fullbody',
]);

export const exercicios = pgTable(
  'exercicios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    nome: varchar('nome', { length: 255 }).notNull(),
    grupoMuscular: grupoMuscularEnum('grupo_muscular').notNull(),
    descricao: text('descricao'),
    videoUrl: text('video_url'),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('exercicios_owner_id_idx').on(t.ownerId), index('exercicios_grupo_idx').on(t.grupoMuscular)],
);

export const treinos = pgTable(
  'treinos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    nome: varchar('nome', { length: 255 }).notNull(),
    personalId: uuid('personal_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    alunoId: uuid('aluno_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    observacoes: text('observacoes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('treinos_personal_id_idx').on(t.personalId), index('treinos_aluno_id_idx').on(t.alunoId)],
);

export const treinoExercicios = pgTable(
  'treino_exercicios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    treinoId: uuid('treino_id')
      .notNull()
      .references(() => treinos.id, { onDelete: 'cascade' }),
    exercicioId: uuid('exercicio_id')
      .notNull()
      .references(() => exercicios.id, { onDelete: 'restrict' }),
    series: integer('series').notNull().default(3),
    repeticoes: varchar('repeticoes', { length: 32 }),
    carga: numeric('carga', { precision: 8, scale: 2 }),
    descansoSegundos: integer('descanso_segundos'),
    ordem: integer('ordem').notNull().default(0),
  },
  (t) => [index('treino_exercicios_treino_id_idx').on(t.treinoId)],
);

export const execucoes = pgTable(
  'execucoes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    treinoId: uuid('treino_id')
      .notNull()
      .references(() => treinos.id, { onDelete: 'cascade' }),
    alunoId: uuid('aluno_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    dataExecucao: date('data_execucao').notNull(),
    concluido: boolean('concluido').notNull().default(false),
    cargaReal: numeric('carga_real', { precision: 10, scale: 2 }),
    observacao: text('observacao'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('execucoes_treino_id_idx').on(t.treinoId), index('execucoes_aluno_data_idx').on(t.alunoId, t.dataExecucao)],
);

export const consentimentos = pgTable(
  'consentimentos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tipo: varchar('tipo', { length: 32 }).notNull(),
    versao: varchar('versao', { length: 16 }).notNull(),
    aceitoEm: timestamp('aceito_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('consentimentos_user_tipo_key').on(t.userId, t.tipo)],
);

export const anamneses = pgTable(
  'anamneses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    alunoId: uuid('aluno_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    respostas: jsonb('respostas').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('anamneses_aluno_id_key').on(t.alunoId)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Exercicio = typeof exercicios.$inferSelect;
export type Treino = typeof treinos.$inferSelect;
export type TreinoExercicio = typeof treinoExercicios.$inferSelect;
export type Execucao = typeof execucoes.$inferSelect;
