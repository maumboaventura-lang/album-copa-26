// Scanner que lê o NOME do jogador na figurinha
// (não o código, porque a figurinha física não tem código impresso)
//
// Estratégia:
// 1. Captura frame da câmera
// 2. Pré-processa (escala cinza, contraste, recorte da região do nome)
// 3. Roda Tesseract com whitelist de caracteres
// 4. Casa o resultado contra a base de nomes usando distância de Levenshtein
// 5. Retorna top 3 candidatos ordenados por similaridade

import { createWorker } from 'tesseract.js'

let _worker = null

export async function getWorker() {
  if (_worker) return _worker
  _worker = await createWorker('por', 1, {
    // logger: m => console.log(m),
  })
  await _worker.setParameters({
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÂÊÔÃÕÇ'- ",
    tessedit_pageseg_mode: '7', // single text line
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

// Similaridade 0..1
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

// Recebe texto OCR e a lista de figurinhas [{code, name}], retorna top 3 candidatos
export function matchName(ocrText, stickers) {
  const target = normalizeName(ocrText)
  if (!target || target.length < 3) return []
  
  const scored = stickers
    .filter(s => s.name && s.name.length > 1)
    .map(s => {
      const normName = normalizeName(s.name)
      // Score base: similaridade completa
      let score = similarity(target, normName)
      // Bônus se o target está contido no nome ou vice-versa
      if (normName.includes(target) || target.includes(normName)) {
        score = Math.max(score, 0.85)
      }
      // Bônus por palavras compartilhadas (último nome em geral é o mais identificador)
      const targetParts = target.split(' ').filter(p => p.length > 2)
      const nameParts = normName.split(' ').filter(p => p.length > 2)
      const shared = targetParts.filter(t => nameParts.some(n => n === t)).length
      if (shared > 0) {
        score += shared * 0.15
      }
      return { ...s, score: Math.min(score, 1) }
    })
    .filter(s => s.score > 0.45) // corte para não devolver lixo
    .sort((a, b) => b.score - a.score)
  
  return scored.slice(0, 5)
}

// Pré-processa o canvas — aumenta contraste para o OCR
export function preprocessCanvas(srcCanvas) {
  const dst = document.createElement('canvas')
  dst.width = srcCanvas.width
  dst.height = srcCanvas.height
  const ctx = dst.getContext('2d')
  ctx.drawImage(srcCanvas, 0, 0)
  
  const img = ctx.getImageData(0, 0, dst.width, dst.height)
  const data = img.data
  
  // Escala cinza + ganho de contraste + binarização suave
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    // Contraste: empurrar para os extremos
    let v
    if (gray < 100) v = Math.max(0, gray - 30)
    else if (gray > 160) v = Math.min(255, gray + 30)
    else v = gray
    data[i] = data[i + 1] = data[i + 2] = v
  }
  ctx.putImageData(img, 0, 0)
  return dst
}

// Captura um frame de <video>, recorta a faixa onde geralmente está o nome,
// e devolve o canvas processado pronto para OCR
export function captureNameRegion(videoEl) {
  const w = videoEl.videoWidth
  const h = videoEl.videoHeight
  if (!w || !h) return null
  
  // A faixa do nome fica no terço inferior da figurinha,
  // mais ou menos a parte central horizontal
  const cropX = Math.floor(w * 0.05)
  const cropY = Math.floor(h * 0.62)
  const cropW = Math.floor(w * 0.90)
  const cropH = Math.floor(h * 0.20)
  
  const canvas = document.createElement('canvas')
  canvas.width = cropW
  canvas.height = cropH
  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoEl, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
  
  return preprocessCanvas(canvas)
}
