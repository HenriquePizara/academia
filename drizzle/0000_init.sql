CREATE TYPE "public"."grupo_muscular" AS ENUM('peito', 'costas', 'pernas', 'ombros', 'bracos', 'core', 'cardio', 'fullbody');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'personal', 'aluno');--> statement-breakpoint
CREATE TABLE "anamneses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aluno_id" uuid NOT NULL,
	"respostas" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consentimentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tipo" varchar(32) NOT NULL,
	"versao" varchar(16) NOT NULL,
	"aceito_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execucoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"treino_id" uuid NOT NULL,
	"aluno_id" uuid NOT NULL,
	"data_execucao" date NOT NULL,
	"concluido" boolean DEFAULT false NOT NULL,
	"carga_real" numeric(8, 2),
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercicios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"grupo_muscular" "grupo_muscular" NOT NULL,
	"descricao" text,
	"video_url" text,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treino_exercicios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"treino_id" uuid NOT NULL,
	"exercicio_id" uuid NOT NULL,
	"series" integer DEFAULT 3 NOT NULL,
	"repeticoes" varchar(32),
	"carga" numeric(8, 2),
	"descanso_segundos" integer,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treinos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"personal_id" uuid NOT NULL,
	"aluno_id" uuid NOT NULL,
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"nome" varchar(255) NOT NULL,
	"avatar_url" text,
	"role" "role" DEFAULT 'aluno' NOT NULL,
	"cref" varchar(32),
	"personal_id" uuid,
	"provider" varchar(32) DEFAULT 'google' NOT NULL,
	"senha_hash" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anamneses" ADD CONSTRAINT "anamneses_aluno_id_users_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consentimentos" ADD CONSTRAINT "consentimentos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execucoes" ADD CONSTRAINT "execucoes_treino_id_treinos_id_fk" FOREIGN KEY ("treino_id") REFERENCES "public"."treinos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execucoes" ADD CONSTRAINT "execucoes_aluno_id_users_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercicios" ADD CONSTRAINT "exercicios_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treino_exercicios" ADD CONSTRAINT "treino_exercicios_treino_id_treinos_id_fk" FOREIGN KEY ("treino_id") REFERENCES "public"."treinos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treino_exercicios" ADD CONSTRAINT "treino_exercicios_exercicio_id_exercicios_id_fk" FOREIGN KEY ("exercicio_id") REFERENCES "public"."exercicios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treinos" ADD CONSTRAINT "treinos_personal_id_users_id_fk" FOREIGN KEY ("personal_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treinos" ADD CONSTRAINT "treinos_aluno_id_users_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_personal_id_users_id_fk" FOREIGN KEY ("personal_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "anamneses_aluno_id_key" ON "anamneses" USING btree ("aluno_id");--> statement-breakpoint
CREATE UNIQUE INDEX "consentimentos_user_tipo_key" ON "consentimentos" USING btree ("user_id","tipo");--> statement-breakpoint
CREATE INDEX "execucoes_treino_id_idx" ON "execucoes" USING btree ("treino_id");--> statement-breakpoint
CREATE INDEX "execucoes_aluno_data_idx" ON "execucoes" USING btree ("aluno_id","data_execucao");--> statement-breakpoint
CREATE INDEX "exercicios_owner_id_idx" ON "exercicios" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "exercicios_grupo_idx" ON "exercicios" USING btree ("grupo_muscular");--> statement-breakpoint
CREATE INDEX "treino_exercicios_treino_id_idx" ON "treino_exercicios" USING btree ("treino_id");--> statement-breakpoint
CREATE INDEX "treinos_personal_id_idx" ON "treinos" USING btree ("personal_id");--> statement-breakpoint
CREATE INDEX "treinos_aluno_id_idx" ON "treinos" USING btree ("aluno_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_personal_id_idx" ON "users" USING btree ("personal_id");