import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Attack type color coding ────────────────────────────────────────────────
const ATTACK_COLORS = {
  DDoS:      { bg: '#FF2D78', label: '#000' },
  Malware:   { bg: '#FF8C00', label: '#000' },
  Phishing:  { bg: '#00FFFF', label: '#000' },
  Ransomware:{ bg: '#CCFF00', label: '#000' },
  Exploit:   { bg: '#BF5FFF', label: '#000' },
  default:   { bg: '#FFFFFF', label: '#000' },
};

const getColors = (type) => ATTACK_COLORS[type] || ATTACK_COLORS.default;

// ─── Intensity bar (pixelated blocks) ────────────────────────────────────────
const IntensityBar = ({ value = 5, max = 10 }) => {
  const blocks = Array.from({ length: max }, (_, i) => i < value);
  const color = value >= 8 ? '#FF2D78' : value >= 5 ? '#FF8C00' : '#00FFFF';
  return (
    <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
      {blocks.map((filled, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 10,
            background: filled ? color : 'transparent',
            border: `1px solid ${filled ? color : '#444'}`,
            imageRendering: 'pixelated',
          }}
        />
      ))}
    </div>
  );
};

// ─── Single threat row ────────────────────────────────────────────────────────
const ThreatRow = ({ threat, index }) => {
  const { bg, label } = getColors(threat.type);
  return (
    <motion.div
      layout
      initial={{ x: 60, opacity: 0, scaleY: 0.6 }}
      animate={{ x: 0, opacity: 1, scaleY: 1 }}
      exit={{ x: -60, opacity: 0, scaleY: 0.6 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28, delay: index * 0.03 }}
      style={{
        background: '#0A0A0A',
        border: '2.5px solid #000',
        boxShadow: '4px 4px 0px #000',
        padding: '8px 10px',
        marginBottom: '6px',
        fontFamily: '"Share Tech Mono", monospace',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left accent strip */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 4, background: bg,
      }} />

      <div style={{ paddingLeft: 10 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{
            background: bg,
            color: label,
            fontSize: 9,
            fontWeight: 700,
            padding: '1px 5px',
            border: '1.5px solid #000',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            {threat.type}
          </span>
          <span style={{ color: '#666', fontSize: 9 }}>
            {new Date(threat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Route */}
        <div style={{ color: '#EEE', fontSize: 11, lineHeight: 1.4 }}>
          <span style={{ color: '#FF2D78' }}>{threat.source_country}</span>
          <span style={{ color: '#555', margin: '0 5px' }}>{'→'}</span>
          <span style={{ color: '#00FFFF' }}>{threat.target_country}</span>
        </div>

        {/* Intensity bar */}
        <IntensityBar value={threat.intensity ?? 5} max={10} />
      </div>
    </motion.div>
  );
};

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
const SidebarFeed = ({ threats = [] }) => {
  const scrollRef = useRef(null);

  // Auto-scroll to top when new items arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [threats.length]);

  return (
    <div style={{
      position: 'fixed',
      top: 80,             // below the stats bar
      right: 16,
      width: 260,
      maxHeight: 'calc(100vh - 100px)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      pointerEvents: 'auto',
    }}>
      {/* ── Header ── */}
      <div style={{
        background: '#CCFF00',
        border: '3px solid #000',
        boxShadow: '5px 5px 0px #000',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: '"Share Tech Mono", monospace',
          fontWeight: 700,
          fontSize: 12,
          color: '#000',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          ◈ LIVE THREATS
        </span>
        <span style={{
          fontFamily: '"Share Tech Mono", monospace',
          fontSize: 11,
          color: '#000',
          background: '#000',
          color: '#CCFF00',
          padding: '1px 5px',
          border: '1.5px solid #000',
        }}>
          {threats.length}
        </span>
      </div>

      {/* ── Scrollable feed ── */}
      <div
        ref={scrollRef}
        style={{
          overflowY: 'auto',
          flexGrow: 1,
          paddingRight: 2,
          // Custom scrollbar
          scrollbarWidth: 'thin',
          scrollbarColor: '#333 #000',
        }}
      >
        <AnimatePresence initial={false}>
          {threats.map((t, i) => (
            <ThreatRow key={t.id ?? `${t.source_country}-${t.timestamp}`} threat={t} index={i} />
          ))}
        </AnimatePresence>

        {threats.length === 0 && (
          <div style={{
            color: '#444',
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: 11,
            textAlign: 'center',
            padding: '20px 0',
            border: '2px dashed #333',
          }}>
            AWAITING SIGNAL...
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarFeed;