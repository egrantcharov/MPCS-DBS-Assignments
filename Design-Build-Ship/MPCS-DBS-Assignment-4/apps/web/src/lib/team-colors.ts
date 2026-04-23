// Primary team colors for chips and badges. Keyed by our canonical team id
// (MLB: raw MLB id; NHL: raw NHL id + 10000, matching the worker's offset).

export const TEAM_COLORS: Record<number, { bg: string; fg: string }> = {
  // --- MLB ---
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

  // --- NHL (raw id + 10000) ---
  10001: { bg: '#CE1126', fg: '#ffffff' }, // NJD
  10002: { bg: '#F47D30', fg: '#111111' }, // NYI
  10003: { bg: '#0038A8', fg: '#ffffff' }, // NYR
  10004: { bg: '#F74902', fg: '#111111' }, // PHI
  10005: { bg: '#FCB514', fg: '#111111' }, // PIT
  10006: { bg: '#FFB81C', fg: '#111111' }, // BOS
  10007: { bg: '#002654', fg: '#ffffff' }, // BUF
  10008: { bg: '#AF1E2D', fg: '#ffffff' }, // MTL
  10009: { bg: '#C52032', fg: '#ffffff' }, // OTT
  10010: { bg: '#00205B', fg: '#ffffff' }, // TOR
  10012: { bg: '#CE1126', fg: '#ffffff' }, // CAR
  10013: { bg: '#041E42', fg: '#ffffff' }, // FLA
  10014: { bg: '#002868', fg: '#ffffff' }, // TBL
  10015: { bg: '#C8102E', fg: '#ffffff' }, // WSH
  10016: { bg: '#CF0A2C', fg: '#ffffff' }, // CHI
  10017: { bg: '#CE1126', fg: '#ffffff' }, // DET
  10018: { bg: '#FFB81C', fg: '#111111' }, // NSH
  10019: { bg: '#002F87', fg: '#ffffff' }, // STL
  10020: { bg: '#C8102E', fg: '#ffffff' }, // CGY
  10021: { bg: '#6F263D', fg: '#ffffff' }, // COL
  10022: { bg: '#041E42', fg: '#ffffff' }, // EDM
  10023: { bg: '#00205B', fg: '#ffffff' }, // VAN
  10024: { bg: '#F47A38', fg: '#111111' }, // ANA
  10025: { bg: '#154734', fg: '#ffffff' }, // DAL
  10026: { bg: '#111111', fg: '#ffffff' }, // LAK
  10028: { bg: '#006D75', fg: '#ffffff' }, // SJS
  10029: { bg: '#041E42', fg: '#ffffff' }, // CBJ
  10030: { bg: '#154734', fg: '#ffffff' }, // MIN
  10052: { bg: '#041E42', fg: '#ffffff' }, // WPG
  10053: { bg: '#8C2633', fg: '#ffffff' }, // ARI (historical)
  10054: { bg: '#B4975A', fg: '#111111' }, // VGK
  10055: { bg: '#001628', fg: '#ffffff' }, // SEA
  10059: { bg: '#041E42', fg: '#ffffff' }, // UTA
};

export function teamColor(id: number | null | undefined) {
  if (id == null) return { bg: '#6b7280', fg: '#ffffff' };
  return TEAM_COLORS[id] ?? { bg: '#374151', fg: '#ffffff' };
}
