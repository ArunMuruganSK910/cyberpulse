import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * HoverTooltip
 * Rendered as a canvas overlay (position:fixed) that follows the pointer.
 *
 * Props:
 *   visible   – boolean
 *   x, y      – pointer coordinates (from mousemove on the canvas container)
 *   country   – string  e.g. "United States"
 *   threatCount – number
 *   topType   – string  e.g. "DDoS"
 */

const TYPE_COLOR = {
  DDoS:      '#FF2D78',
  Malware:   '#FF8C00',
  Phishing:  '#00FFFF',
  Ransomware:'#CCFF00',
  Exploit:   '#BF5FFF',
};

const HoverTooltip = ({ visible, x = 0, y = 0, country = '', threatCount = 0, topType = '' }) => {
  // Keep tooltip from overflowing right edge
  const offsetX = x > window.innerWidth - 200 ? -180 : 14;
  const offsetY = y > window.innerHeight - 120 ? -100 : 14;

  const accentColor = TYPE_COLOR[topType] || '#FFFFFF';

  return (
    <AnimatePresence>
      {visible && country && (
        <motion.div
          key="tooltip"
          initial={{ opacity: 0, scale: 0.88, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 6 }}
          transition={{ duration: 0.08 }}
          style={{
            position: 'fixed',
            left: x + offsetX,
            top: y + offsetY,
            zIndex: 9999,
            pointerEvents: 'none',
            // ── Neo-Brutalist shell ──
            background: '#0D0D0D',
            border: '3px solid #000',
            boxShadow: `5px 5px 0px ${accentColor}`,
            minWidth: 160,
            maxWidth: 220,
            fontFamily: '"Share Tech Mono", monospace',
          }}
        >
          {/* Country header strip */}
          <div style={{
            background: accentColor,
            padding: '4px 10px',
            borderBottom: '2px solid #000',
          }}>
            <span style={{
              color: '#000',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block',
              maxWidth: 180,
            }}>
              {country}
            </span>
          </div>

          {/* Stats body */}
          <div style={{ padding: '6px 10px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4,
            }}>
              <span style={{ color: '#888', fontSize: 10, textTransform: 'uppercase' }}>
                Threats
              </span>
              <span style={{
                color: '#FFF',
                fontSize: 13,
                fontWeight: 700,
                background: '#1A1A1A',
                border: '1.5px solid #333',
                padding: '0 6px',
              }}>
                {threatCount}
              </span>
            </div>

            {topType && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ color: '#888', fontSize: 10, textTransform: 'uppercase' }}>
                  Top Type
                </span>
                <span style={{
                  color: '#000',
                  background: accentColor,
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '1px 5px',
                  border: '1.5px solid #000',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}>
                  {topType}
                </span>
              </div>
            )}

            {/* Pulse indicator */}
            <div style={{
              marginTop: 7,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              borderTop: '1px solid #222',
              paddingTop: 6,
            }}>
              <motion.div
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                style={{
                  width: 6,
                  height: 6,
                  background: accentColor,
                  border: '1px solid #000',
                }}
              />
              <span style={{ color: '#555', fontSize: 9, textTransform: 'uppercase' }}>
                CLICK FOR DETAILS
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HoverTooltip;