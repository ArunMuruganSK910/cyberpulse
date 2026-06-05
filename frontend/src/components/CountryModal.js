import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CountryModal
 * Triggered when user clicks a country on the globe.
 *
 * Props:
 *   visible      – boolean
 *   onClose      – () => void
 *   country      – string
 *   threats      – array of threat objects for this country
 */

const ATTACK_COLORS = {
  DDoS:      '#FF2D78',
  Malware:   '#FF8C00',
  Phishing:  '#00FFFF',
  Ransomware:'#CCFF00',
  Exploit:   '#BF5FFF',
};

const getColor = (type) => ATTACK_COLORS[type] || '#FFF';

// Mini bar chart for threat type breakdown
const TypeBreakdown = ({ threats }) => {
  const counts = useMemo(() => {
    const map = {};
    threats.forEach(t => { map[t.type] = (map[t.type] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [threats]);

  const max = counts[0]?.[1] || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {counts.map(([type, count]) => (
        <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: 9,
            color: '#000',
            background: getColor(type),
            padding: '1px 5px',
            border: '1.5px solid #000',
            textTransform: 'uppercase',
            minWidth: 76,
            textAlign: 'center',
            letterSpacing: '0.06em',
          }}>
            {type}
          </span>
          {/* Pixel bar */}
          <div style={{ flex: 1, background: '#111', border: '1.5px solid #222', height: 12, position: 'relative' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(count / max) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ height: '100%', background: getColor(type) }}
            />
          </div>
          <span style={{
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: 10,
            color: '#CCC',
            minWidth: 22,
            textAlign: 'right',
          }}>
            {count}
          </span>
        </div>
      ))}
    </div>
  );
};

// Recent threat rows
const RecentRow = ({ threat }) => {
  const color = getColor(threat.type);
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '5px 0',
      borderBottom: '1px solid #1A1A1A',
      fontFamily: '"Share Tech Mono", monospace',
      fontSize: 10,
    }}>
      <div style={{ width: 3, height: 24, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ color: '#EEE', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {threat.source_country}
          <span style={{ color: '#444', margin: '0 4px' }}>→</span>
          {threat.target_country}
        </div>
        <div style={{ color: '#555', fontSize: 9, marginTop: 1 }}>
          {new Date(threat.timestamp).toLocaleTimeString()}
        </div>
      </div>
      <span style={{
        color: '#000',
        background: color,
        fontSize: 8,
        padding: '1px 4px',
        border: '1px solid #000',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}>
        {threat.type}
      </span>
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
const CountryModal = ({ visible, onClose, country = '', threats = [] }) => {
  const countryThreats = useMemo(
    () => threats.filter(t => t.source_country === country || t.target_country === country),
    [threats, country]
  );

  const recent = useMemo(() => [...countryThreats].reverse().slice(0, 8), [countryThreats]);

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.65)',
              zIndex: 200,
              backdropFilter: 'blur(1px)',
            }}
          />

          {/* Modal panel */}
          <motion.div
            key="modal"
            initial={{ y: 60, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            style={{
              position: 'fixed',
              bottom: 32,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'min(520px, calc(100vw - 32px))',
              zIndex: 201,
              // ── Neo-Brutalist shell ──
              background: '#0A0A0A',
              border: '3px solid #000',
              boxShadow: '8px 8px 0px #CCFF00',
              fontFamily: '"Share Tech Mono", monospace',
              overflow: 'hidden',
            }}
          >
            {/* ── Title bar ── */}
            <div style={{
              background: '#CCFF00',
              borderBottom: '3px solid #000',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Retro window dots */}
                {['#FF2D78', '#FF8C00', '#00FFFF'].map((c, i) => (
                  <div key={i} style={{
                    width: 10, height: 10,
                    background: c,
                    border: '1.5px solid #000',
                  }} />
                ))}
                <span style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#000',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginLeft: 4,
                }}>
                  ◈ {country}
                </span>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: '#000',
                  color: '#CCFF00',
                  border: '2px solid #000',
                  boxShadow: '2px 2px 0px #000',
                  fontFamily: '"Share Tech Mono", monospace',
                  fontSize: 11,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                [ESC]
              </button>
            </div>

            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* ── Summary counters ── */}
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'TOTAL', value: countryThreats.length, color: '#FFF' },
                  { label: 'INBOUND', value: countryThreats.filter(t => t.target_country === country).length, color: '#FF2D78' },
                  { label: 'OUTBOUND', value: countryThreats.filter(t => t.source_country === country).length, color: '#FF8C00' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    flex: 1,
                    background: '#111',
                    border: '2px solid #000',
                    boxShadow: '3px 3px 0px #000',
                    padding: '8px 10px',
                    textAlign: 'center',
                  }}>
                    <div style={{ color: '#555', fontSize: 8, textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                    <div style={{ color, fontSize: 22, fontWeight: 700 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* ── Breakdown ── */}
              {countryThreats.length > 0 && (
                <div>
                  <div style={{
                    color: '#444',
                    fontSize: 9,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 8,
                    borderBottom: '1px solid #1A1A1A',
                    paddingBottom: 4,
                  }}>
                    Attack Type Breakdown
                  </div>
                  <TypeBreakdown threats={countryThreats} />
                </div>
              )}

              {/* ── Recent events ── */}
              {recent.length > 0 && (
                <div>
                  <div style={{
                    color: '#444',
                    fontSize: 9,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 6,
                    borderBottom: '1px solid #1A1A1A',
                    paddingBottom: 4,
                  }}>
                    Recent Events
                  </div>
                  {recent.map((t, i) => (
                    <RecentRow key={i} threat={t} />
                  ))}
                </div>
              )}

              {countryThreats.length === 0 && (
                <div style={{
                  color: '#333',
                  fontSize: 11,
                  textAlign: 'center',
                  padding: '16px 0',
                  border: '2px dashed #222',
                }}>
                  NO RECORDED ACTIVITY
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CountryModal;