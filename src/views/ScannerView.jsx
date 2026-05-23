import { useEffect, useRef, useState } from 'react'
import { getWorker, captureNameRegion, matchName } from '../scanner.js'
import { Icon } from '../Icon.jsx'
import { flagFor } from '../flags.js'

export default function ScannerView({ allStickers, stickers, onUpdate }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | starting | ready | scanning | error
  const [error, setError] = useState('')
  const [candidates, setCandidates] = useState([])
  const [lastCapture, setLastCapture] = useState(null)
  const [busy, setBusy] = useState(false)
  
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
    try {
      // 3 capturas seguidas (resiliência a tremor/foco)
      const results = []
      for (let i = 0; i < 3; i++) {
        const canvas = captureNameRegion(videoRef.current)
        if (!canvas) continue
        if (i === 1) setLastCapture(canvas.toDataURL('image/jpeg', 0.7))
        const worker = await getWorker()
        const { data } = await worker.recognize(canvas)
        if (data?.text) results.push(data.text.trim())
        await new Promise(r => setTimeout(r, 100))
      }
      
      // Escolher o melhor (mais longo, geralmente o mais limpo)
      const text = results.sort((a, b) => b.length - a.length)[0] || ''
      
      if (!text || text.length < 3) {
        setCandidates([])
        setStatus('ready')
        alert('Não consegui ler o nome. Aproxime a câmera do nome do jogador, com boa luz.')
        return
      }
      
      const top = matchName(text, allStickers)
      setCandidates(top)
      setStatus('ready')
    } catch (e) {
      setError(e.message || 'Erro no scanner')
      setStatus('error')
    } finally {
      setBusy(false)
    }
  }
  
  const confirm = (s) => {
    const cur = stickers[s.code] || { have: false, dup: 0 }
    if (!cur.have) {
      onUpdate(s.code, { have: true })
    } else {
      onUpdate(s.code, { dup: cur.dup + 1 })
    }
    setCandidates([])
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
      </div>
    )
  }
  
  return (
    <div>
      <div className="scanner-area">
        <video ref={videoRef} className="scanner-video" playsInline muted autoPlay />
        <div className="scanner-overlay">
          <div className="scanner-frame" />
        </div>
        <div className="scanner-hint">
          Enquadre o nome do jogador no retângulo amarelo
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
      
      {lastCapture && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 4 }}>Última captura (debug):</div>
          <img src={lastCapture} alt="captura" style={{ width: '100%', maxHeight: 100, objectFit: 'contain', background: '#000', borderRadius: 8 }} />
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
          {candidates.map(c => {
            const s = stickers[c.code] || { have: false, dup: 0 }
            return (
              <div
                key={c.code}
                onClick={() => confirm(c)}
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
                    Similaridade: {(c.score * 100).toFixed(0)}%
                    {s.have && ' · já tenho'}
                    {s.dup > 0 && ` · ${s.dup} repetida(s)`}
                  </div>
                </div>
                <button className="btn" style={{ padding: '8px 14px' }}>
                  {s.have ? '+1 rep' : 'Marcar'}
                </button>
              </div>
            )
          })}
          <button className="btn btn-ghost btn-full" onClick={() => setCandidates([])} style={{ marginTop: 8 }}>
            Nenhuma é essa
          </button>
        </div>
      )}
    </div>
  )
}
