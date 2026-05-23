import { useMemo, useState } from 'react'
import { flagFor } from '../flags.js'

export default function TradesView({ allStickers, stickers }) {
  const [mode, setMode] = useState('have') // 'have' = minhas repetidas, 'need' = faltando
  
  const data = useMemo(() => {
    if (mode === 'have') {
      return allStickers
        .map(s => ({ ...s, count: stickers[s.code]?.dup || 0 }))
        .filter(s => s.count > 0)
        .sort((a, b) => a.code.localeCompare(b.code))
    }
    return allStickers
      .filter(s => !stickers[s.code]?.have)
      .sort((a, b) => a.code.localeCompare(b.code))
  }, [allStickers, stickers, mode])
  
  const exportText = () => {
    let text
    if (mode === 'have') {
      text = `🔄 TROCO (tenho repetidas):\n\n` +
        data.map(s => `${s.code} - ${s.name} (${s.count}x)`).join('\n')
    } else {
      text = `🔍 PROCURO (me faltam):\n\n` +
        data.map(s => `${s.code} - ${s.name}`).join('\n')
    }
    if (navigator.share) {
      navigator.share({ title: 'Álbum Copa 26', text }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(text).then(() => alert('Copiado!'))
    }
  }
  
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          className={mode === 'have' ? 'btn btn-full' : 'btn btn-ghost btn-full'}
          onClick={() => setMode('have')}
        >
          Tenho ({allStickers.filter(s => (stickers[s.code]?.dup || 0) > 0).length})
        </button>
        <button
          className={mode === 'need' ? 'btn btn-full' : 'btn btn-ghost btn-full'}
          onClick={() => setMode('need')}
        >
          Faltam ({allStickers.filter(s => !stickers[s.code]?.have).length})
        </button>
      </div>
      
      <button className="btn btn-outline btn-full" onClick={exportText} style={{ marginBottom: 12 }}>
        Compartilhar lista
      </button>
      
      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-mute)' }}>
          {mode === 'have' ? 'Nenhuma repetida' : 'Você já tem todas! 🎉'}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {data.map(s => (
            <div key={s.code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ fontSize: 22 }}>{flagFor(s.code)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{s.code}</div>
                <div style={{ fontSize: 13, color: 'var(--text-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.name}
                </div>
              </div>
              {mode === 'have' && s.count > 0 && (
                <div className="badge badge-warn">{s.count}x</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
