// Scanner que lê o NOME do jogador na figurinha
// (não o código, porque a figurinha física não tem código impresso)

import { createWorker } from 'tesseract.js'

let _worker = null

export async function getWorker(onProgress) {
  if (_worker) return _worker
  _worker = await createWorker('por', 1, {
    logger: m => {
      if (onProgress && m.status) {
        onProgress(m.status, m.progress)
      }
    },
  })
  await _worker.setParameters({
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÂÊÔÃÕÇ'-. ",
    // psm 6 = uniform block of text. Aceita várias linhas, melhor que psm 7 quando enquadrarmos a figurinha inteira
    tessedit_pageseg_mode: '6',
  })
  return _worker
}

export async function destroyWorker() {
  if (_worker) {
    try { await _worker.terminate() } catch (e) { /* */ }
    _worker = null
  }
}

// Distância de Levenshtein
export function levenshtein(a, b) {
  if (!a) return b ? b.length : 0
  if (!b) return a.length
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
    }
  }
  return dp[m][n]
}

export function similarity(a, b) {
  if (!a && !b) return 1
  const maxLen = Math.max(a.length, b.length)
  if (!maxLen) return 1
  return 1 - levenshtein(a, b) / maxLen
}

// Normaliza nome para comparação
export function normalizeName(name) {
  if (!name) return ''
  return name
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // tira acento
    .replace(/[^A-Z ]/g, ' ') // só letras e espaço
    .replace(/\s+/g, ' ')
    .trim()
}

// Tokeniza em "palavras úteis" (>= 2 chars)
function tokens(s) {
  return normalizeName(s).split(' ').filter(p => p.length >= 2)
}

// Score palavra a palavra: para cada token alvo, melhor match no nome candidato.
// Isso torna o matching MUITO mais tolerante a lixo no OCR.
function tokenScore(target, candidate) {
  const tTokens = tokens(target)
  const cTokens = tokens(candidate)
  if (!tTokens.length || !cTokens.length) return 0
  
  let total = 0
  let matched = 0
  for (const tt of tTokens) {
    // Procurar melhor match
    let best = 0
    for (const ct of cTokens) {
      // Similaridade entre tokens
      const sim = similarity(tt, ct)
      // Bônus se um contém o outro
      const contained = (ct.includes(tt) || tt.includes(ct)) ? 0.2 : 0
      const score = Math.min(1, sim + contained)
      if (score > best) best = score
    }
    if (best > 0.6) matched++
    total += best
  }
  // Score médio dos tokens, com bônus por número de matches
  const avg = total / tTokens.length
  const matchRatio = matched / tTokens.length
  return avg * 0.5 + matchRatio * 0.5
}

// Recebe texto OCR e a lista de figurinhas [{code, name}], retorna top candidatos
export function matchName(ocrText, stickers) {
  const target = normalizeName(ocrText)
  if (!target || target.length < 2) return []
  
  const scored = stickers
    .filter(s => s.name && s.name.length > 1)
    .map(s => {
      const normName = normalizeName(s.name)
      // 1. Score global (Levenshtein da string toda)
      let scoreGlobal = similarity(target, normName)
      // 2. Score por tokens (palavra a palavra)
      const scoreTokens = tokenScore(target, s.name)
      // 3. Contém substring grande?
      let scoreContains = 0
      if (target.length >= 4 && normName.includes(target)) scoreContains = 0.9
      else if (normName.length >= 4 && target.includes(normName)) scoreContains = 0.85
      
      // Score final = melhor das três estratégias
      const score = Math.max(scoreGlobal, scoreTokens, scoreContains)
      return { ...s, score }
    })
    .filter(s => s.score > 0.30) // limiar bem baixo — devolve mais opções, usuário escolhe
    .sort((a, b) => b.score - a.score)
  
  return scored.slice(0, 8)
}

// Pré-processa: escala cinza, AUTO-INVERSÃO se for texto claro em fundo escuro, threshold adaptativo
export function preprocessCanvas(srcCanvas) {
  const dst = document.createElement('canvas')
  dst.width = srcCanvas.width
  dst.height = srcCanvas.height
  const ctx = dst.getContext('2d')
  ctx.drawImage(srcCanvas, 0, 0)
  
  const img = ctx.getImageData(0, 0, dst.width, dst.height)
  const data = img.data
  
  // Primeira passada: converter para cinza e calcular brilho médio
  let sum = 0
  const grays = new Uint8ClampedArray(data.length / 4)
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    grays[j] = g
    sum += g
  }
  const mean = sum / grays.length
  
  // Se imagem é mais escura que clara, inverter (texto claro vira escuro)
  const invert = mean < 110
  
  // Threshold adaptativo simples: tudo abaixo da média - margem vira preto, acima + margem vira branco
  const lo = mean - 20
  const hi = mean + 20
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    let g = grays[j]
    if (invert) g = 255 - g
    // contraste agressivo: empurra para extremos
    let v
    if (g < lo) v = 0
    else if (g > hi) v = 255
    else v = g
    data[i] = data[i + 1] = data[i + 2] = v
  }
  ctx.putImageData(img, 0, 0)
  return dst
}

// Captura a área enquadrada pelo usuário (retângulo amarelo).
// Recebe o vídeo e as proporções do retângulo (0..1 em x, y, w, h).
export function captureRegion(videoEl, frame = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 }) {
  const w = videoEl.videoWidth
  const h = videoEl.videoHeight
  if (!w || !h) return null
  
  const cropX = Math.floor(w * frame.x)
  const cropY = Math.floor(h * frame.y)
  const cropW = Math.floor(w * frame.w)
  const cropH = Math.floor(h * frame.h)
  
  const canvas = document.createElement('canvas')
  canvas.width = cropW
  canvas.height = cropH
  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoEl, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
  
  return preprocessCanvas(canvas)
}

// Captura SEM pré-processamento (para debug visual)
export function captureRegionRaw(videoEl, frame = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 }) {
  const w = videoEl.videoWidth
  const h = videoEl.videoHeight
  if (!w || !h) return null
  
  const cropX = Math.floor(w * frame.x)
  const cropY = Math.floor(h * frame.y)
  const cropW = Math.floor(w * frame.w)
  const cropH = Math.floor(h * frame.h)
  
  const canvas = document.createElement('canvas')
  canvas.width = cropW
  canvas.height = cropH
  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoEl, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
  return canvas
}

// Mantém compatibilidade com nome antigo
export const captureNameRegion = captureRegion
