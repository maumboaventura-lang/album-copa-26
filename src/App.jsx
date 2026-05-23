import { useState, useEffect, useMemo } from 'react'
import albumData from './album-data.json'
import { loadState, saveState } from './storage.js'
import { Icon } from './Icon.jsx'
import HomeView from './views/HomeView.jsx'
import SectionView from './views/SectionView.jsx'
import StatsView from './views/StatsView.jsx'
import TradesView from './views/TradesView.jsx'
import ScannerView from './views/ScannerView.jsx'
import SettingsView from './views/SettingsView.jsx'

const TABS = [
  { id: 'home', label: 'Álbum', icon: 'home' },
  { id: 'scan', label: 'Escanear', icon: 'camera' },
  { id: 'trades', label: 'Trocas', icon: 'swap' },
  { id: 'stats', label: 'Stats', icon: 'chart' },
  { id: 'settings', label: 'Ajustes', icon: 'cog' },
]

export default function App() {
  const [state, setState] = useState(loadState())
  const [tab, setTab] = useState('home')
  const [openSection, setOpenSection] = useState(null)
  
  useEffect(() => {
    saveState(state)
  }, [state])
  
  // Lista plana de todas as figurinhas
  const allStickers = useMemo(() => {
    const arr = []
    for (const [section, items] of Object.entries(albumData)) {
      for (const [code, name] of items) {
        arr.push({ code, name, section })
      }
    }
    return arr
  }, [])
  
  // Stats globais
  const stats = useMemo(() => {
    const total = allStickers.length
    let have = 0, dups = 0, dupTotal = 0
    for (const s of allStickers) {
      const m = state.stickers[s.code]
      if (m?.have) have++
      if (m?.dup > 0) { dups++; dupTotal += m.dup }
    }
    return { total, have, missing: total - have, dups, dupTotal, pct: total ? (have / total * 100) : 0 }
  }, [allStickers, state.stickers])
  
  // Voltar ao topo ao trocar de aba
  useEffect(() => {
    window.scrollTo(0, 0)
    setOpenSection(null)
  }, [tab])
  
  const updateSticker = (code, patch) => {
    setState(prev => ({
      ...prev,
      stickers: {
        ...prev.stickers,
        [code]: { ...(prev.stickers[code] || { have: false, dup: 0 }), ...patch },
      },
    }))
  }
  
  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Álbum Copa 2026</h1>
        <div className="progress">
          {stats.have}/{stats.total} · {stats.pct.toFixed(1)}%
        </div>
      </header>
      
      <main className="content fade-in" key={tab + (openSection || '')}>
        {tab === 'home' && !openSection && (
          <HomeView
            albumData={albumData}
            stickers={state.stickers}
            stats={stats}
            onOpenSection={setOpenSection}
          />
        )}
        {tab === 'home' && openSection && (
          <SectionView
            section={openSection}
            items={albumData[openSection]}
            stickers={state.stickers}
            onBack={() => setOpenSection(null)}
            onUpdate={updateSticker}
          />
        )}
        {tab === 'scan' && (
          <ScannerView
            allStickers={allStickers}
            stickers={state.stickers}
            onUpdate={updateSticker}
          />
        )}
        {tab === 'trades' && (
          <TradesView
            allStickers={allStickers}
            stickers={state.stickers}
          />
        )}
        {tab === 'stats' && (
          <StatsView
            albumData={albumData}
            stickers={state.stickers}
            stats={stats}
          />
        )}
        {tab === 'settings' && (
          <SettingsView
            albumData={albumData}
            state={state}
            onImport={setState}
          />
        )}
      </main>
      
      <nav className="tabbar">
        <div className="tabbar-inner">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <Icon name={t.icon} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
