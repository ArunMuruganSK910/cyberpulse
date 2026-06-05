import { useMemo } from 'react'
import { motion } from 'framer-motion'

const ATTACK_COLORS = {
  DDoS: '#FF2D78', Malware: '#FF8C00', Phishing: '#00FFFF',
  Ransomware: '#CCFF00', 'Brute Force': '#BF5FFF',
}

const FLAGS = {
  'Russia': '🇷🇺', 'China': '🇨🇳', 'USA': '🇺🇸', 'Iran': '🇮🇷',
  'North Korea': '🇰🇵', 'India': '🇮🇳', 'Brazil': '🇧🇷', 'Germany': '🇩🇪',
  'Nigeria': '🇳🇬', 'Ukraine': '🇺🇦', 'Turkey': '🇹🇷', 'Pakistan': '🇵🇰',
  'UK': '🇬🇧', 'France': '🇫🇷', 'Australia': '🇦🇺', 'Japan': '🇯🇵',
  'South Korea': '🇰🇷', 'Mexico': '🇲🇽', 'Canada': '🇨🇦', 'South Africa': '🇿🇦',
  'Thailand': '🇹🇭', 'Vietnam': '🇻🇳', 'Indonesia': '🇮🇩', 'Saudi Arabia': '🇸🇦',
  'Poland': '🇵🇱', 'Netherlands': '🇳🇱', 'Spain': '🇪🇸', 'Italy': '🇮🇹',
  'Argentina': '🇦🇷', 'Egypt': '🇪🇬',
}

export default function Leaderboard({ threats }) {
  const ranked = useMemo(() => {
    const map = {}
    for (const t of threats) {
      const k = t.source_country
      if (!k) continue
      if (!map[k]) map[k] = { count: 0, types: {} }
      map[k].count++
      map[k].types[t.type] = (map[k].types[t.type] || 0) + 1
    }
    return Object.entries(map)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, data]) => ({
        name,
        count: data.count,
        topType: Object.entries(data.types).sort((a, b) => b[1] - a[1])[0][0],
      }))
  }, [threats])

  const max = ranked[0]?.count || 1

  return (
    <div style={{
      position: 'fixed',
      // Moved up — sits above the filter bar (filter bar is at bottom: 24, ~40px tall)
      bottom: 80,
      left: 20,
      zIndex: 10,
      fontFamily: '"Share Tech Mono", monospace',
      background: '#000',
      border: '3px solid #000',
      boxShadow: '5px 5px 0px #FF2D78',
      padding: '10px 14px',
      minWidth: 210,
    }}>
      <div style={{ color: '#FF2D78', fontSize: 8, letterSpacing: '3px', marginBottom: 8 }}>
        ▲ TOP ATTACKING NATIONS
      </div>
      {ranked.length === 0 && (
        <div style={{ color: '#333', fontSize: 10 }}>Awaiting data...</div>
      )}
      {ranked.map((entry, i) => {
        const color = ATTACK_COLORS[entry.topType] || '#FFF'
        const barWidth = Math.round((entry.count / max) * 100)
        return (
          <motion.div
            key={entry.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{ marginBottom: 8 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ color: '#FFF', fontSize: 11 }}>
                {FLAGS[entry.name] || '🌐'} {entry.name}
              </span>
              <span style={{ color, fontSize: 11 }}>{entry.count}</span>
            </div>
            <div style={{ background: '#111', height: 4, width: '100%' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ duration: 0.4 }}
                style={{ background: color, height: '100%' }}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}