import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const ATTACK_TYPES = ['DDoS', 'Malware', 'Phishing', 'Ransomware', 'Brute Force']
const COUNTRIES = ['Russia', 'China', 'USA', 'Brazil', 'Iran', 'India', 'Germany', 'Turkey', 'Nigeria', 'North Korea', 'UK', 'France', 'Australia', 'Japan', 'South Korea', 'Pakistan', 'Mexico', 'South Africa', 'Ukraine', 'Canada']
const SEVERITIES = ['LOW', 'MED', 'HIGH', 'CRITICAL']
const SEVERITY_COLORS = {
  LOW: '#00ff88',
  MED: '#ffaa00',
  HIGH: '#ff6600',
  CRITICAL: '#ff2244',
}

function randomAttack(id) {
  const from = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)]
  let to = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)]
  while (to === from) to = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)]
  return {
    id,
    type: ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)],
    from,
    to,
    severity: SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)],
    time: new Date().toLocaleTimeString(),
  }
}

export default function Sidebar({ onNewThreat }) {
  const [threats, setThreats] = useState(() => Array.from({ length: 6 }, (_, i) => randomAttack(i)))
  const [counter, setCounter] = useState(100)

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(c => c + 1)
      const newThreat = randomAttack(Date.now())
      setThreats(prev => [newThreat, ...prev.slice(0, 8)])
      // Tell the globe about this attack
      onNewThreat(newThreat)
    }, 2000)
    return () => clearInterval(interval)
  }, [onNewThreat])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '300px',
      height: '100vh',
      background: 'rgba(2, 8, 23, 0.85)',
      backdropFilter: 'blur(12px)',
      borderLeft: '1px solid rgba(0, 200, 255, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10,
      fontFamily: "'Inter', monospace",
    }}>
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(0,200,255,0.1)' }}>
        <div style={{ color: '#00ccff', fontSize: '11px', letterSpacing: '3px', marginBottom: '6px' }}>CYBERPULSE</div>
        <div style={{ color: 'white', fontSize: '18px', fontWeight: 600 }}>Live Threat Feed</div>
        <div style={{ color: '#ff2244', fontSize: '12px', marginTop: '4px' }}>● {counter} attacks detected today</div>
      </div>

      <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(0,200,255,0.1)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {Object.entries(SEVERITY_COLORS).map(([key, color]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
            <span style={{ color: '#aaa', fontSize: '10px' }}>{key}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        <AnimatePresence>
          {threats.map(threat => (
            <motion.div
              key={threat.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${SEVERITY_COLORS[threat.severity]}33`,
                borderLeft: `3px solid ${SEVERITY_COLORS[threat.severity]}`,
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '8px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>{threat.type}</span>
                <span style={{ color: SEVERITY_COLORS[threat.severity], fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }}>{threat.severity}</span>
              </div>
              <div style={{ color: '#aaa', fontSize: '11px' }}>{threat.from} → {threat.to}</div>
              <div style={{ color: '#555', fontSize: '10px', marginTop: '4px' }}>{threat.time}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}