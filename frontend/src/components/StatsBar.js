import { useState, useEffect } from 'react'

const ATTACK_COLORS = {
  DDoS: '#FF2D78', Malware: '#FF8C00', Phishing: '#00FFFF',
  Ransomware: '#CCFF00', 'Brute Force': '#BF5FFF',
}

export default function StatsBar({ threats, topAttacker, threatTimestampsRef }) {
  const [attacksPerMin, setAttacksPerMin] = useState(0)
  const [tick, setTick] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const recent = (threatTimestampsRef.current || []).filter(t => now - t < 60000)
      setAttacksPerMin(recent.length)
      setTick(t => !t) // pulse animation trigger
    }, 1000)
    return () => clearInterval(interval)
  }, [threatTimestampsRef])

  const topType = threats.length
    ? Object.entries(
        threats.reduce((acc, t) => { acc[t.type] = (acc[t.type] || 0) + 1; return acc }, {})
      ).sort((a, b) => b[1] - a[1])[0]
    : null

  const criticalCount = threats.filter(t => t.severity === 'CRITICAL').length

  return (
    <div style={{
      position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 10, display: 'flex', gap: 0,
      fontFamily: '"Share Tech Mono", monospace',
      border: '3px solid #000',
      boxShadow: '5px 5px 0px #FF2D78',
      background: '#000',
    }}>
      {/* Attacks / min */}
      <StatBlock
        label="ATTACKS / MIN"
        value={attacksPerMin}
        color="#FF2D78"
        pulse={tick}
        border
      />

      {/* Total detected */}
      <StatBlock
        label="TOTAL DETECTED"
        value={threats.length}
        color="#00FFFF"
        border
      />

      {/* Critical */}
      <StatBlock
        label="CRITICAL"
        value={criticalCount}
        color="#CCFF00"
        border
      />

      {/* Top attacker */}
      <StatBlock
        label="TOP ATTACKER"
        value={topAttacker || '---'}
        color="#FF8C00"
        border
      />

      {/* Top attack type */}
      <StatBlock
        label="TOP TYPE"
        value={topType ? topType[0] : '---'}
        color={topType ? (ATTACK_COLORS[topType[0]] || '#FFF') : '#FFF'}
      />
    </div>
  )
}

function StatBlock({ label, value, color, pulse, border }) {
  return (
    <div style={{
      padding: '6px 18px',
      borderRight: border ? '2px solid #222' : 'none',
      textAlign: 'center',
      minWidth: 110,
    }}>
      <div style={{
        color: '#666', fontSize: 8, letterSpacing: '2px',
        textTransform: 'uppercase', marginBottom: 2,
      }}>
        {label}
      </div>
      <div style={{
        color,
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: '1px',
        transition: 'opacity 0.1s',
        opacity: pulse ? 0.6 : 1,
        textShadow: `0 0 10px ${color}88`,
      }}>
        {value}
      </div>
    </div>
  )
}