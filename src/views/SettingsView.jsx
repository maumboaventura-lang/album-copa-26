import { useRef, useState } from 'react'
import { exportBackup, importBackup, resetAll } from '../storage.js'
import { Icon } from '../Icon.jsx'

export default function SettingsView({ albumData, state, onImport }) {
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')
  
  const handleExport = () => {
    const data = exportBackup(state, albumData)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `album-backup-${date}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setMsg('Backup exportado!')
    setTimeout(() => setMsg(''), 3000)
  }
  
  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const newState = importBackup(json)
      const count = Object.keys(newState.stickers).length
      if (confirm(`Importar ${count} marcações? Isso vai substituir os dados atuais.`)) {
        onImport(newState)
        setMsg(`Importadas ${count} marcações!`)
        setTimeout(() => setMsg(''), 3000)
      }
    } catch (err) {
      alert('Arquivo inválido: ' + err.message)
    }
    e.target.value = ''
  }
  
  const handleReset = () => {
    if (!confirm('Apagar TODAS as marcações? Isso não pode ser desfeito.')) return
    if (!confirm('Tem certeza mesmo? Última chance.')) return
    resetAll()
    onImport({ version: 2, stickers: {}, updatedAt: null })
    setMsg('Reset feito.')
    setTimeout(() => setMsg(''), 3000)
  }
  
  return (
    <div>
      {msg && (
        <div className="card" style={{ background: '#DCFCE7', color: '#166534', textAlign: 'center', fontWeight: 600 }}>
          {msg}
        </div>
      )}
      
      <div className="card">
        <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontSize: 18 }}>Backup</h3>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 12 }}>
          Faça backup com frequência. Os dados ficam só no navegador deste dispositivo.
        </p>
        <button className="btn btn-outline btn-full" onClick={handleExport} style={{ marginBottom: 8 }}>
          <Icon name="download" /> Exportar backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
        <button className="btn btn-outline btn-full" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" /> Importar backup
        </button>
      </div>
      
      <div className="card">
        <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontSize: 18 }}>Sobre</h3>
        <div style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.7 }}>
          Álbum Copa 2026 — v1.0<br/>
          {Object.values(albumData).reduce((n, arr) => n + arr.length, 0)} figurinhas catalogadas (oficiais + Coca-Cola)<br/>
          Dados salvos localmente no navegador<br/>
          {state.updatedAt && (
            <>Última atualização: {new Date(state.updatedAt).toLocaleString('pt-BR')}</>
          )}
        </div>
      </div>
      
      <div className="card">
        <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--danger)' }}>Zona perigosa</h3>
        <button className="btn btn-danger btn-full" onClick={handleReset}>
          Apagar todas as marcações
        </button>
      </div>
    </div>
  )
}
