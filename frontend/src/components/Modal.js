import { motion, AnimatePresence } from 'framer-motion'

export default function Modal({ country, stats, onClose }) {
  const defaultStats = {
    attacks: 0,
    received: 0,
    topType: 'Unknown',
    threat: 'LOW',
    color: '#00ff88',
  }

  const s = stats || defaultStats

  return (
    <AnimatePresence>
      {country && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 20,
              background: 'rgba(0,0,0,0.4)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 21,
              width: '340px',
              background: 'rgba(2, 8, 23, 0.97)',
              border: `1px solid ${s.color}44`,
              borderTop: `3px solid ${s.color}`,
              borderRadius: '12px',
              padding: '24px',
              fontFamily: "'Inter', monospace",
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ color: '#aaa', fontSize: '11px', letterSpacing: '2px', marginBottom: '4px' }}>THREAT REPORT</div>
                <div style={{ color: 'white', fontSize: '22px', fontWeight: 700 }}>{country}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{
                  background: `${s.color}22`,
                  color: s.color,
                  border: `1px solid ${s.color}`,
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                }}>{s.threat}</span>
                <button onClick={onClose} style={{
                  background: 'none', border: 'none',
                  color: '#555', cursor: 'pointer', fontSize: '18px',
                }}>✕</button>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Attacks Launched', value: s.attacks.toLocaleString(), color: '#ff2244' },
                { label: 'Attacks Received', value: s.received.toLocaleString(), color: '#00ccff' },
                { label: 'Top Attack Type', value: s.topType, color: '#ffaa00' },
                { label: 'Threat Level', value: s.threat, color: s.color },
              ].map((item, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  padding: '12px',
                }}>
                  <div style={{ color: '#555', fontSize: '10px', marginBottom: '6px', letterSpacing: '1px' }}>
                    {item.label.toUpperCase()}
                  </div>
                  <div style={{ color: item.color, fontSize: '16px', fontWeight: 700 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Threat bar */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#555', fontSize: '10px', letterSpacing: '1px' }}>ATTACK INTENSITY</span>
                <span style={{ color: s.color, fontSize: '10px' }}>
                  {Math.min(100, Math.round((s.attacks / 2500) * 100))}%
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.round((s.attacks / 2500) * 100))}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: `linear-gradient(90deg, ${s.color}88, ${s.color})`,
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>

            <div style={{ color: '#333', fontSize: '11px', textAlign: 'center' }}>
              Click anywhere outside to close
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}