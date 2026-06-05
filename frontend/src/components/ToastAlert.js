import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ATTACK_COLORS = {
  DDoS: '#FF2D78', Malware: '#FF8C00', Phishing: '#00FFFF',
  Ransomware: '#CCFF00', 'Brute Force': '#BF5FFF',
}

export default function ToastAlert({ threats }) {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    if (!threats.length) return
    const latest = threats[0]
    if (latest.severity !== 'CRITICAL' && latest.severity !== 'HIGH') return

    const toast = {
      id: latest._uid || latest.id + Date.now(),
      type: latest.type,
      severity: latest.severity,
      source: latest.source_country,
      target: latest.target_country,
      mitre: latest.mitre_id,
    }

    setToasts(prev => [toast, ...prev].slice(0, 3))
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id))
    }, 4000)
    return () => clearTimeout(timer)
  }, [threats[0]?._uid])

  return (
    <div style={{
      position: 'fixed',
      // Top-left, just below the title bar — away from sidebar and leaderboard
      top: 140,
      left: 20,
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      fontFamily: '"Share Tech Mono", monospace',
      pointerEvents: 'none',
    }}>
      <AnimatePresence>
        {toasts.map(toast => {
          const color = ATTACK_COLORS[toast.type] || '#FFF'
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.2 }}
              style={{
                background: '#000',
                border: `2px solid ${color}`,
                boxShadow: `4px 4px 0px ${color}`,
                padding: '8px 14px',
                minWidth: 220,
              }}
            >
              <div style={{ color, fontSize: 9, letterSpacing: '3px', marginBottom: 2 }}>
                ⚠ {toast.severity} THREAT DETECTED
              </div>
              <div style={{ color: '#FFF', fontSize: 12, fontWeight: 700 }}>
                {toast.type}
              </div>
              <div style={{ color: '#888', fontSize: 10, marginTop: 2 }}>
                {toast.source} → {toast.target}
              </div>
              {toast.mitre && (
                <div style={{ color: '#444', fontSize: 9, marginTop: 2 }}>
                  {toast.mitre}
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}