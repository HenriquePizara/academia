// Mapeamento biomecânico de grupos musculares e cálculo de carga de treino (openGym Engine)

export const MUSCLES = [
  'trapezius',
  'deltoids',
  'chest',
  'upper-back',
  'serratus',
  'biceps',
  'triceps',
  'forearm',
  'abs',
  'obliques',
  'lower-back',
  'gluteal',
  'quadriceps',
  'hamstring',
  'adductors',
  'hip-flexors',
  'calves',
  'tibialis',
] as const;

export type MuscleSlug = (typeof MUSCLES)[number];

export const INERT = ['head', 'hair', 'neck', 'hands', 'feet', 'knees', 'ankles'] as const;

export const MUSCLE_NAME: Record<MuscleSlug, string> = {
  trapezius: 'Trapézio',
  deltoids: 'Deltoides (Ombros)',
  chest: 'Peitoral',
  'upper-back': 'Dorsal / Costas',
  serratus: 'Serrátil',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearm: 'Antebraços',
  abs: 'Abdômen (Reto)',
  obliques: 'Oblíquos',
  'lower-back': 'Lombar',
  gluteal: 'Glúteos',
  quadriceps: 'Quadríceps',
  hamstring: 'Posterior de Coxa',
  adductors: 'Adutores',
  'hip-flexors': 'Flexores de Quadril',
  calves: 'Panturrilhas',
  tibialis: 'Tibial / Canela',
};

// Mapeamento por grupo macro do banco de dados
const BY_GRUPO: Record<string, Partial<Record<MuscleSlug, number>>> = {
  peito: { chest: 1.0, triceps: 0.35, deltoids: 0.3 },
  costas: { 'upper-back': 0.85, biceps: 0.4, 'lower-back': 0.25, trapezius: 0.3 },
  pernas: { quadriceps: 0.65, gluteal: 0.45, hamstring: 0.45, calves: 0.25 },
  ombros: { deltoids: 0.9, trapezius: 0.35, triceps: 0.25 },
  bracos: { biceps: 0.6, triceps: 0.6, forearm: 0.35 },
  core: { abs: 0.8, obliques: 0.4, 'lower-back': 0.3 },
  cardio: { calves: 0.3, quadriceps: 0.3, 'hip-flexors': 0.2 },
  fullbody: { chest: 0.4, 'upper-back': 0.4, quadriceps: 0.4, abs: 0.4, deltoids: 0.4 },
};

export function musclesOf(exercicio: { nome?: string; grupoMuscular?: string }): Partial<Record<MuscleSlug, number>> {
  const n = (exercicio.nome || '').toLowerCase();
  const g = (exercicio.grupoMuscular || '').toLowerCase();

  // Refinamentos específicos por palavras-chave do exercício
  if (n.includes('supino') || n.includes('crucifixo') || n.includes('peitoral')) {
    return { chest: 1.0, triceps: 0.4, deltoids: 0.35 };
  }
  if (n.includes('puxada') || n.includes('remada') || n.includes('pulldown') || n.includes('pull-up')) {
    return { 'upper-back': 1.0, biceps: 0.45, trapezius: 0.3, forearm: 0.25 };
  }
  if (n.includes('agachamento') || n.includes('leg press') || n.includes('extensora')) {
    return { quadriceps: 1.0, gluteal: 0.6, hamstring: 0.3, calves: 0.2 };
  }
  if (n.includes('flexora') || n.includes('stiff')) {
    return { hamstring: 1.0, gluteal: 0.5, 'lower-back': 0.3 };
  }
  if (n.includes('elevação pélvica') || n.includes('afundo') || n.includes('glúteo')) {
    return { gluteal: 1.0, hamstring: 0.45, quadriceps: 0.4 };
  }
  if (n.includes('desenvolvimento') || n.includes('elevação lateral') || n.includes('elevação frontal') || n.includes('face pull')) {
    return { deltoids: 1.0, trapezius: 0.4, triceps: 0.25 };
  }
  if (n.includes('rosca') || n.includes('biceps')) {
    return { biceps: 1.0, forearm: 0.35 };
  }
  if (n.includes('tríceps') || n.includes('testa') || n.includes('corda')) {
    return { triceps: 1.0 };
  }
  if (n.includes('prancha') || n.includes('abdominal') || n.includes('dead bug') || n.includes('canoa')) {
    return { abs: 1.0, obliques: 0.5, 'lower-back': 0.3 };
  }
  if (n.includes('panturrilha') || n.includes('gêmeos')) {
    return { calves: 1.0, tibialis: 0.25 };
  }

  // Fallback por grupo muscular cadastrado
  return BY_GRUPO[g] || { abs: 0.3, quadriceps: 0.3 };
}

export function loadOfExercises(
  itens: Array<{ nome?: string; grupoMuscular?: string; series?: number }>,
): Record<MuscleSlug, number> {
  const load: Record<MuscleSlug, number> = {
    trapezius: 0,
    deltoids: 0,
    chest: 0,
    'upper-back': 0,
    serratus: 0,
    biceps: 0,
    triceps: 0,
    forearm: 0,
    abs: 0,
    obliques: 0,
    'lower-back': 0,
    gluteal: 0,
    quadriceps: 0,
    hamstring: 0,
    adductors: 0,
    'hip-flexors': 0,
    calves: 0,
    tibialis: 0,
  };

  itens.forEach((item) => {
    const sets = item.series || 3;
    const m = musclesOf(item);
    for (const slug in m) {
      const s = slug as MuscleSlug;
      load[s] = (load[s] || 0) + (m[s] || 0) * sets;
    }
  });

  return load;
}

export function levelsOf(load: Partial<Record<MuscleSlug, number>>): Record<MuscleSlug, number> {
  const max = Math.max(0, ...MUSCLES.map((m) => load[m] || 0));
  const lv = {} as Record<MuscleSlug, number>;
  MUSCLES.forEach((m) => {
    const v = load[m] || 0;
    lv[m] = !v || max <= 0 ? 0 : Math.max(1, Math.min(4, Math.ceil((v / max) * 4)));
  });
  return lv;
}

export function rankOf(load: Partial<Record<MuscleSlug, number>>) {
  const worked = MUSCLES.filter((m) => (load[m] || 0) > 0).sort((a, b) => (load[b] || 0) - (load[a] || 0));
  const missed = MUSCLES.filter((m) => !(load[m] && load[m]! > 0));
  return { worked, missed };
}
