-- Um aluno não pode registrar duas execuções do mesmo treino na mesma data.
CREATE UNIQUE INDEX "execucoes_treino_aluno_data_key" ON "execucoes" ("treino_id","aluno_id","data_execucao");
--> statement-breakpoint
ALTER TABLE "execucoes" ALTER COLUMN "carga_real" SET DATA TYPE numeric(10, 2);
--> statement-breakpoint
CREATE INDEX "treinos_aluno_id_created_idx" ON "treinos" ("aluno_id", "created_at");
