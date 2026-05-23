import { useMemo, useState } from 'react'
import { flagForSection } from '../flags.js'
import { Icon } from '../Icon.jsx'

export default function HomeView({ albumData, stickers, stats, onOpenSection }) {
  const [filter, setFilter] = useState('')
  
  const sections = useMemo(() => {
    return Object.entries(albumData).map(([name, items]) => {
      let have = 0, dup = 0
      for (const [code] of items) {
        const m = stickers[code]
        if (m?.have) have++
        if (m?.dup > 0) dup++
      }
      return { name, total: items.length, have, dup, flag: flagForSection(name) }
    })
  }, [albumData, stickers])
  
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return sections
    return sections.filter(s => s.name.toLowerCase().includes(q))
  }, [sections, filter])
  
  return (
    <div>
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--brand-green), var(--brand-green-dark))', color: 'white' }}>
        <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 6 }}>Progresso geral</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
            {stats.have}
          </div>
          <div style={{ fontSize: 16, opacity: 0.9 }}>de {stats.total}</div>
          <div style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700 }}>
            {stats.pct.toFixed(1)}%
          </div>
        </div>
        <div className="progress-bar" style={{ background: 'rgba(255,255,255,0.25)' }}>
          <div className="progress-bar-fill" style={{ width: `${stats.pct}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 13 }}>
          <span>Faltam: {stats.missing}</span>
          <span>Repetidas: {stats.dupTotal}</span>
        </div>
      </div>
      
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input
          className="input"
          placeholder="Buscar seleção…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
        <div style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-mute)' }}>
          <Icon name="search" size={20} />
        </div>
      </div>
      
      {filtered.map(s => {
        const pct = s.total ? (s.have / s.total) * 100 : 0
        const done = s.have === s.total
        return (
          <div
            key={s.name}
            className="section-row"
            onClick={() => onOpenSection(s.name)}
          >
            <div className="flag">{s.flag}</div>
            <div className="info">
              <p className="name">{s.name}</p>
              <div className="meta">{s.have}/{s.total} · {pct.toFixed(0)}%
                {s.dup > 0 && <span style={{ marginLeft: 6, color: 'var(--warning)' }}>· {s.dup} rep</span>}
              </div>
              <div className="progress-bar" style={{ marginTop: 6, height: 4 }}>
                <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
            {done && (
              <div style={{ color: 'var(--success)' }}>
                <Icon name="check" size={20} />
              </div>
            )}
            <div className="arrow">
              <Icon name="chevronRight" size={20} />
            </div>
          </div>
        )
      })}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-mute)', padding: 32 }}>
          Nenhuma seção encontrada
        </div>
      )}
    </div>
  )
}
