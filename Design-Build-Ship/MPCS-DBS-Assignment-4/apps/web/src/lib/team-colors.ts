// Primary team colors for chips and badges. Keyed by MLB team id.
// Source: team identity guidelines; hand-picked hex values.

export const TEAM_COLORS: Record<number, { bg: string; fg: string }> = {
  108: { bg: '#BA0021', fg: '#ffffff' }, // LAA
  109: { bg: '#A71930', fg: '#ffffff' }, // ARI
  110: { bg: '#DF4601', fg: '#ffffff' }, // BAL
  111: { bg: '#BD3039', fg: '#ffffff' }, // BOS
  112: { bg: '#0E3386', fg: '#ffffff' }, // CHC
  113: { bg: '#C6011F', fg: '#ffffff' }, // CIN
  114: { bg: '#0F223E', fg: '#ffffff' }, // CLE
  115: { bg: '#33006F', fg: '#ffffff' }, // COL
  116: { bg: '#0C2340', fg: '#ffffff' }, // DET
  117: { bg: '#002D62', fg: '#ffffff' }, // HOU
  118: { bg: '#004687', fg: '#ffffff' }, // KC
  119: { bg: '#005A9C', fg: '#ffffff' }, // LAD
  120: { bg: '#AB0003', fg: '#ffffff' }, // WSH
  121: { bg: '#002D72', fg: '#ffffff' }, // NYM
  133: { bg: '#003831', fg: '#ffffff' }, // ATH
  134: { bg: '#FDB827', fg: '#111111' }, // PIT
  135: { bg: '#2F241D', fg: '#ffffff' }, // SD
  136: { bg: '#0C2C56', fg: '#ffffff' }, // SEA
  137: { bg: '#FD5A1E', fg: '#111111' }, // SF
  138: { bg: '#C41E3A', fg: '#ffffff' }, // STL
  139: { bg: '#092C5C', fg: '#ffffff' }, // TB
  140: { bg: '#003278', fg: '#ffffff' }, // TEX
  141: { bg: '#134A8E', fg: '#ffffff' }, // TOR
  142: { bg: '#002B5C', fg: '#ffffff' }, // MIN
  143: { bg: '#E81828', fg: '#ffffff' }, // PHI
  144: { bg: '#CE1141', fg: '#ffffff' }, // ATL
  145: { bg: '#27251F', fg: '#ffffff' }, // CWS
  146: { bg: '#00A3E0', fg: '#ffffff' }, // MIA
  147: { bg: '#132448', fg: '#ffffff' }, // NYY
  158: { bg: '#FFC72C', fg: '#111111' }, // MIL
};

export function teamColor(id: number | null | undefined) {
  if (id == null) return { bg: '#6b7280', fg: '#ffffff' };
  return TEAM_COLORS[id] ?? { bg: '#374151', fg: '#ffffff' };
}
