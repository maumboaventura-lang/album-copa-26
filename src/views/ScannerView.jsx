import { useEffect, useRef, useState } from 'react'
import { getWorker, captureRegion, captureRegionRaw, matchName } from '../scanner.js'
import { Icon } from '../Icon.jsx'
import { flagFor } from '../flags.js'

const FRAME = { x: 0.10, y: 0.10, w: 0.80, h: 0.80 }

export default function ScannerView({ allStickers, stickers, onUpdate }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [candidates, setCandidates] = useState([])
  const [debugRaw, setDebugRaw] = useState(null)
  const [debugProcessed, setDebugProcessed] = useState(null)
  const [debugText, setDebugText] = useState('')
  const [busy, setBusy] = useState(false)
  const [workerStatus, setWorkerStatus] = useState('')
  const [manualSearch, setManualSearch] = useState('')

  const startCamera = async () => {
    setError('')
    setStatus('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus('ready')
    } catch (e) {
      setStatus('error')
      setError(e.message || 'Não consegui acessar a câmera')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setStatus('idle')
  }

  useEffect(() => () => stopCamera(), [])

  const captureAndRead = async () => {
    if (busy || !videoRef.current) return
    setBusy(true)
    setStatus('scanning')
    setCandidates([])
    setDebugText('')
    setError('')
    try {
      const rawCanvas = captureRegionRaw(videoRef.current, FRAME)
      if (rawCanvas) setDebugRaw(rawCanvas.toDataURL('image/jpeg', 0.6))

      const results = []
      for (let i = 0; i < 3; i++) {
        const canvas = captureRegion(videoRef.current, FRAME)
        if (!canvas) continue
        if (i === 1) setDebugProcessed(canvas.toDataURL('image/jpeg', 0.6))
        const worker = await getWorker(s => setWorkerStatus(s))
        const { data } = await worker.recognize(canvas)
        if (data?.text) results.push(data.text.trim())
        await new Promise(r => setTimeout(r, 80))
      }
      setWorkerStatus('')

      const concat = results.join(' ').replace(/\s+/g, ' ').trim()
      const best = [...results].sort((a, b) => b.length - a.length)[0] || ''
      const ocrText = concat.length > best.length ? concat : best

      setDebugText(ocrText)

      if (!ocrText || ocrText.length < 2) {
        setStatus('ready')
        setError('Não li nenhum texto. Aproxime a câmera, melhore a luz, ou use a busca manual abaixo.')
        return
      }

      const top = matchName(ocrText, allStickers)
      setCandidates(top)
      setStatus('ready')
      if (top.length === 0) {
        setError('Li o texto mas não encontrei figurinha parecida. Tente a busca manual abaixo.')
      }
    } catch (e) {
      setError(e.message || 'Erro no scanner')
      setStatus('error')
    } finally {
      setBusy(false)
    }
  }

  const manualResults = manualSearch.trim().length >= 2
    ? matchName(manualSearch, allStickers)
    : []

  const confirm = (s) => {
    const cur = stickers[s.code] || { have: false, dup: 0 }
    if (!cur.have) {
      onUpdate(s.code, { have: true })
    } else {
      onUpdate(s.code, { dup: cur.dup + 1 })
    }
    setCandidates([])
    setManualSearch('')
    setDebugText('')
  }

  if (status === 'idle') {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>📷</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: '0 0 8px' }}>Escanear figurinha</h2>
        <p style={{ color: 'var(--text-soft)', maxWidth: 360, margin: '0 auto 24px' }}>
          O app vai ler o <strong>nome do jogador</strong> impresso na figurinha e te dizer qual código é.
          Funciona melhor com luz natural e a figurinha reta.
        </p>
        <button className="btn btn-full" onClick={startCamera}>
          <Icon name="camera" /> Abrir câmera
        </button>
        <p style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 16 }}>
          Primeira vez: vai baixar ~5MB do motor de OCR. Depois fica no cache.
        </p>

        <div className="card" style={{ marginTop: 24, textAlign: 'left' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Busca manual</h3>
          <p style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 10 }}>
            Se preferir, digite parte do nome do jogador:
          </p>
          <input
            className="input"
            placeholder="ex: Vinicius, Casemiro, Yamal…"
            value={manualSearch}
            onChange={e => setManualSearch(e.target.value)}
          />
          {manualResults.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {manualResults.map(c => (
                <ResultRow key={c.code} c={c} stickers={stickers} onPick={confirm} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="scanner-area">
        <video ref={videoRef} className="scanner-video" playsInline muted autoPlay />
        <div className="scanner-overlay">
          <div className="scanner-frame" style={{ width: '80%', height: '80%' }} />
        </div>
        <div className="scanner-hint">
          Enquadre a figurinha INTEIRA no retângulo amarelo
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <button className="btn btn-ghost btn-full" onClick={stopCamera}>
          Fechar câmera
        </button>
        <button className="btn btn-full" onClick={captureAndRead} disabled={busy}>
          <Icon name="camera" /> {busy ? 'Lendo…' : 'Capturar'}
        </button>
      </div>

      {workerStatus && (
        <div className="card" style={{ background: '#FEF3C7', fontSize: 13 }}>
          {workerStatus === 'loading tesseract core' && '⏳ Carregando motor de OCR…'}
          {workerStatus === 'initializing tesseract' && '⏳ Iniciando…'}
          {workerStatus === 'loading language traineddata' && '⏳ Baixando idioma português (~5MB, só na primeira vez)…'}
          {workerStatus === 'initializing api' && '⏳ Quase lá…'}
          {workerStatus === 'recognizing text' && '🔍 Lendo a figurinha…'}
        </div>
      )}

      {error && (
        <div className="card" style={{ background: '#FEE2E2', color: '#991B1B' }}>
          ⚠️ {error}
        </div>
      )}

      {candidates.length > 0 && (
        <div className="card">
          <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontSize: 18 }}>
            Possíveis correspondências:
          </h3>
          {candidates.map(c => (
            <ResultRow key={c.code} c={c} stickers={stickers} onPick={confirm} />
          ))}
          <button className="btn btn-ghost btn-full" onClick={() => setCandidates([])} style={{ marginTop: 8 }}>
            Nenhuma é essa
          </button>
        </div>
      )}

      <div className="card">
        <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>🔍 Busca manual</h3>
        <p style={{ fontSize: 12, color: 'var(--text-soft)', marginBottom: 10 }}>
          Se o scanner não acertar, busque digitando:
        </p>
        <input
          className="input"
          placeholder="ex: Vinicius, Lautaro, Yamal…"
          value={manualSearch}
          onChange={e => setManualSearch(e.target.value)}
        />
        {manualResults.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {manualResults.map(c => (
              <ResultRow key={c.code} c={c} stickers={stickers} onPick={confirm} />
            ))}
          </div>
        )}
      </div>

      {(debugRaw || debugText) && (
        <div className="card" style={{ background: 'var(--bg-soft)' }}>
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 13, color: 'var(--text-soft)' }}>
              🔬 Debug (toque para ver o que o app capturou)
            </summary>
            {debugText && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-mute)' }}>OCR leu:</div>
                <pre style={{ fontSize: 12, background: 'white', padding: 8, borderRadius: 6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '4px 0' }}>
                  {debugText || '(nada)'}
                </pre>
              </div>
            )}
            {debugRaw && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-mute)' }}>Captura (foto):</div>
                <img src={debugRaw} alt="raw" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', background: '#000', borderRadius: 8 }} />
              </div>
            )}
            {debugProcessed && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-mute)' }}>Processada para OCR:</div>
                <img src={debugProcessed} alt="processed" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', background: '#000', borderRadius: 8 }} />
              </div>
            )}
          </details>
        </div>
      )}
    </div>
  )
}

function ResultRow({ c, stickers, onPick }) {
  const s = stickers[c.code] || { have: false, dup: 0 }
  return (
    <div
      onClick={() => onPick(c)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: 12, borderBottom: '1px solid var(--border-soft)',
        cursor: 'pointer', borderRadius: 8,
      }}
    >
      <div style={{ fontSize: 26 }}>{flagFor(c.code)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>{c.code}</div>
        <div style={{ fontSize: 14, color: 'var(--text-soft)' }}>{c.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>
          {(c.score * 100).toFixed(0)}% match
          {s.have && ' · já tenho'}
          {s.dup > 0 && ` · ${s.dup} rep`}
        </div>
      </div>
      <button className="btn" style={{ padding: '8px 14px' }}>
        {s.have ? '+1 rep' : 'Marcar'}
      </button>
    </div>
  )
}
