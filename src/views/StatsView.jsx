import { useMemo } from 'react'
import { flagForSection } from '../flags.js'

export default function StatsView({ albumData, stickers, stats }) {
  const bySection = useMemo(() => {
    return Object.entries(albumData).map(([name, items]) => {
      let have = 0, dup = 0
      for (const [code] of items) {
        const m = stickers[code]
        if (m?.have) have++
        if (m?.dup > 0) dup++
      }
      return { name, total: items.length, have, dup, pct: items.length ? have / items.length : 0 }
    }).sort((a, b) => b.pct - a.pct)
  }, [albumData, stickers])
  
  const completas = bySection.filter(s => s.have === s.total).length
  const naoIniciadas = bySection.filter(s => s.have === 0).length
  
  return (
    <div>
      <div className="card">
        <h3 style={{ margin: '0 0 12px', fontSize: 18, fontFamily: 'var(--font-display)' }}>Resumo</h3>
        <Row label="Total no álbum" value={stats.total} />
        <Row label="Coladas" value={stats.have} color="var(--success)" />
        <Row label="Faltam" value={stats.missing} color="var(--danger)" />
        <Row label="Tipos com repetidas" value={stats.dups} />
        <Row label="Total de repetidas" value={stats.dupTotal} color="var(--warning)" />
      </div>
      
      <div className="card">
        <h3 style={{ margin: '0 0 12px', fontSize: 18, fontFamily: 'var(--font-display)' }}>Seções</h3>
        <Row label="Completas" value={`${completas} / ${bySection.length}`} color="var(--success)" />
        <Row label="Não iniciadas" value={naoIniciadas} color="var(--text-mute)" />
      </div>
      
      <div className="card">
        <h3 style={{ margin: '0 0 12px', fontSize: 18, fontFamily: 'var(--font-display)' }}>Ranking das seções</h3>
        {bySection.map(s => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ fontSize: 22 }}>{flagForSection(s.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.name}
              </div>
              <div className="progress-bar" style={{ marginTop: 4, height: 4 }}>
                <div className="progress-bar-fill" style={{ width: `${s.pct * 100}%` }} />
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-soft)', fontWeight: 600, width: 60, textAlign: 'right' }}>
              {s.have}/{s.total}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <span style={{ color: 'var(--text-soft)' }}>{label}</span>
      <span style={{ fontWeight: 700, color: color || 'var(--text)', fontFamily: 'var(--font-display)', fontSize: 18 }}>{value}</span>
    </div>
  )
}
