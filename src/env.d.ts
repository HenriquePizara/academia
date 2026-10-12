/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user?: {
      id: string;
      email: string;
      nome: string;
      role: 'admin' | 'personal' | 'aluno';
    };
  }
}
