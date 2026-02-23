// Shared muscle group normalization utility

export function normalizeMuscle(raw: string): string {
  const lower = raw.toLowerCase().trim()
  const aliases: Record<string, string> = {
    'chest': 'chest',
    'pecs': 'chest',
    'pectorals': 'chest',
    'back': 'back',
    'lats': 'back',
    'upper back': 'back',
    'lower back': 'back',
    'traps': 'shoulders',
    'shoulders': 'shoulders',
    'delts': 'shoulders',
    'deltoids': 'shoulders',
    'biceps': 'biceps',
    'bicep': 'biceps',
    'triceps': 'triceps',
    'tricep': 'triceps',
    'arms': 'biceps',
    'forearms': 'forearms',
    'forearm': 'forearms',
    'quads': 'quads',
    'quadriceps': 'quads',
    'hamstrings': 'hamstrings',
    'hamstring': 'hamstrings',
    'hams': 'hamstrings',
    'glutes': 'glutes',
    'glute': 'glutes',
    'core': 'core',
    'abs': 'core',
    'abdominals': 'core',
    'obliques': 'core',
    'transverse abdominis': 'core',
    'rectus abdominis': 'core',
    'lower abs': 'core',
    'upper abs': 'core',
    'calves': 'calves',
    'calf': 'calves',
    'gastrocnemius': 'calves',
    'soleus': 'calves',
    'brachialis': 'biceps',
    'brachioradialis': 'forearms',
    'rotator cuff': 'shoulders',
    'hip flexors': 'hip flexors',
    'hip': 'hip flexors',
    'hips': 'hip flexors',
  }
  if (aliases[lower]) return aliases[lower]
  // Fuzzy fallback
  if (lower.includes('chest') || lower.includes('pec')) return 'chest'
  if (lower.includes('shoulder') || lower.includes('delt')) return 'shoulders'
  if (lower.includes('bicep')) return 'biceps'
  if (lower.includes('tricep')) return 'triceps'
  if (lower.includes('forearm')) return 'forearms'
  if (lower.includes('quad')) return 'quads'
  if (lower.includes('hamstring') || lower.includes('ham')) return 'hamstrings'
  if (lower.includes('glute')) return 'glutes'
  if (lower.includes('calf') || lower.includes('calve')) return 'calves'
  if (lower.includes('ab') || lower.includes('core') || lower.includes('oblique')) return 'core'
  if (lower.includes('back') || lower.includes('lat') || lower.includes('rhomboid') || lower.includes('erector')) return 'back'
  if (lower.includes('trap')) return 'shoulders'
  if (lower.includes('hip')) return 'hip flexors'
  return lower
}
