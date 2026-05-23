import { useState } from 'react'
import { flagForSection } from '../flags.js'
import { Icon } from '../Icon.jsx'

export default function SectionView({ section, items, stickers, onBack, onUpdate }) {
  const [selected, setSelected] = useState(null)
  
  const have = items.filter(([c]) => stickers[c]?.have).length
  const dup = items.filter(([c]) => stickers[c]?.dup > 0).length
  const flag = flagForSection(section)
  
  return (
    <div>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12, color: 'var(--brand-green)', fontWeight: 600 }}>
        <Icon name="chevronLeft" size={20} /> Voltar
      </button>
      
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontSize: 40 }}>{flag}</div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>{section}</h2>
          <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>
            {have}/{items.length} coladas · {dup > 0 ? `${dup} com repetidas` : 'sem repetidas'}
          </div>
        </div>
      </div>
      
      <div style={{ fontSize: 13, color: 'var(--text-soft)', margin: '4px 4px 10px' }}>
        Toque para marcar como colada. Toque longo (ou segundo toque) abre opções.
      </div>
      
      <div className="sticker-grid">
        {items.map(([code, name]) => {
          const s = stickers[code] || { have: false, dup: 0 }
          const num = code.replace(/^[A-Z]+\s*/, '')
          const cls = s.dup > 0 ? 'sticker dup' : s.have ? 'sticker have' : 'sticker'
          return (
            <div
              key={code}
              className={cls}
              onClick={() => {
                if (!s.have) onUpdate(code, { have: true })
                else setSelected({ code, name })
              }}
            >
              <div className="code">{code.replace(/\d+$/, '').trim()}</div>
              <div className="num">{num}</div>
              {s.dup > 0 && <div className="dup-count">+{s.dup}</div>}
            </div>
          )
        })}
      </div>
      
      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <h3 style={{ margin: '0 0 4px', fontSize: 22, fontFamily: 'var(--font-display)' }}>{selected.code}</h3>
          <div style={{ color: 'var(--text-soft)', marginBottom: 20 }}>{selected.name}</div>
          
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className="btn btn-ghost btn-full" onClick={() => {
              const cur = stickers[selected.code]?.dup || 0
              onUpdate(selected.code, { dup: cur + 1 })
            }}>
              <Icon name="plus" size={18} /> Repetida
            </button>
            <button className="btn btn-ghost btn-full" disabled={!(stickers[selected.code]?.dup > 0)} onClick={() => {
              const cur = stickers[selected.code]?.dup || 0
              onUpdate(selected.code, { dup: Math.max(0, cur - 1) })
            }}>
              <Icon name="minus" size={18} /> Remover repetida
            </button>
          </div>
          
          <div style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 12 }}>
            Tenho: <strong>{stickers[selected.code]?.have ? 'Sim' : 'Não'}</strong>
            {' · '}
            Repetidas: <strong>{stickers[selected.code]?.dup || 0}</strong>
          </div>
          
          <button className="btn btn-danger btn-full" onClick={() => {
            onUpdate(selected.code, { have: false, dup: 0 })
            setSelected(null)
          }}>
            Desmarcar (não tenho)
          </button>
        </Modal>
      )}
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        {children}
      </div>
    </div>
  )
}
