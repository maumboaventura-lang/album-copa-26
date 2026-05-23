// Estrutura no localStorage:
// {
//   version: 2,
//   stickers: { "BRA 1": { have: false, dup: 0 }, ... },
//   updatedAt: ISO timestamp
// }

const KEY = 'album-copa-26-v2'

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { version: 2, stickers: {}, updatedAt: null }
    const parsed = JSON.parse(raw)
    if (!parsed.stickers) parsed.stickers = {}
    return parsed
  } catch (e) {
    console.error('storage load:', e)
    return { version: 2, stickers: {}, updatedAt: null }
  }
}

export function saveState(state) {
  try {
    state.updatedAt = new Date().toISOString()
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch (e) {
    console.error('storage save:', e)
  }
}

export function getSticker(state, code) {
  return state.stickers[code] || { have: false, dup: 0 }
}

export function setSticker(state, code, patch) {
  const cur = getSticker(state, code)
  state.stickers = {
    ...state.stickers,
    [code]: { ...cur, ...patch }
  }
  return state
}

// Aceita 3 formatos:
// 1. { version: 2, stickers: {...} }  — formato nativo do app
// 2. { "Brasil (Grupo C)": [ ["BRA 1", "Escudo / Logo", false, 0], ... ] } — backup antigo
// 3. similar com true/false
export function importBackup(json) {
  // Formato nativo
  if (json.version && json.stickers) {
    return json
  }
  
  // Formato backup: dict por seção, lista [codigo, nome, have, dup]
  const stickers = {}
  for (const secao of Object.values(json)) {
    if (!Array.isArray(secao)) continue
    for (const item of secao) {
      if (!Array.isArray(item) || item.length < 2) continue
      const [code, , have, dup] = item
      if (!code) continue
      // Normalizar código: FWC9 → FWC 9
      const norm = normalizeCode(code)
      stickers[norm] = {
        have: !!have,
        dup: Number(dup) || 0,
      }
    }
  }
  return {
    version: 2,
    stickers,
    updatedAt: new Date().toISOString(),
  }
}

export function normalizeCode(code) {
  if (!code) return ''
  // "FWC9" → "FWC 9"  ; "BRA1" → "BRA 1" se vier sem espaço
  return code.replace(/^([A-Z]+)(\d)/, '$1 $2').trim()
}

export function exportBackup(state, dbSections) {
  // Gera backup no formato compatível com o app antigo:
  // { secao: [ [codigo, nome, have, dup], ... ] }
  const out = {}
  for (const [secao, itens] of Object.entries(dbSections)) {
    out[secao] = itens.map(([code, name]) => {
      const s = getSticker(state, code)
      return [code, name, !!s.have, Number(s.dup) || 0]
    })
  }
  return out
}

export function resetAll() {
  try {
    localStorage.removeItem(KEY)
  } catch (e) { /* */ }
}
