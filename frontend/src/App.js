import { useState, useRef, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import Earth from './components/Earth'
import AttackArcs from './components/AttackArcs'
import SidebarFeed from './components/SidebarFeed'
import HoverTooltip from './components/HoverTooltip'
import CountryModal from './components/CountryModal'
import StatsBar from './components/StatsBar'
import ToastAlert from './components/ToastAlert'
import Leaderboard from './components/Leaderboard'
import { endpoints } from './config/api'

const COUNTRIES = [
  { name: 'Russia', lat: 55.7, lon: 37.6 },
  { name: 'China', lat: 39.9, lon: 116.4 },
  { name: 'USA', lat: 38.9, lon: -77.0 },
  { name: 'Canada', lat: 56.1, lon: -106.3 },
  { name: 'Brazil', lat: -14.2, lon: -51.9 },
  { name: 'Iran', lat: 35.7, lon: 51.4 },
  { name: 'India', lat: 20.5, lon: 78.9 },
  { name: 'Germany', lat: 51.2, lon: 10.4 },
  { name: 'Turkey', lat: 38.9, lon: 35.2 },
  { name: 'Nigeria', lat: 9.0, lon: 8.6 },
  { name: 'North Korea', lat: 40.3, lon: 127.5 },
  { name: 'UK', lat: 55.3, lon: -3.4 },
  { name: 'France', lat: 46.2, lon: 2.2 },
  { name: 'Australia', lat: -25.2, lon: 133.7 },
  { name: 'Japan', lat: 36.2, lon: 138.2 },
  { name: 'South Korea', lat: 35.9, lon: 127.7 },
  { name: 'Pakistan', lat: 30.3, lon: 69.3 },
  { name: 'Mexico', lat: 23.6, lon: -102.5 },
  { name: 'South Africa', lat: -30.5, lon: 22.9 },
  { name: 'Ukraine', lat: 48.3, lon: 31.1 },
]

const MAX_THREATS = 20
const MAX_ARCS = 8
const EARTH_THREAT_WINDOW = 5

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function vec3ToLatLon(point) {
  const n = point.clone().normalize()
  const lat = 90 - Math.acos(Math.max(-1, Math.min(1, n.y))) * (180 / Math.PI)
  const lon = (Math.atan2(n.z, -n.x) * (180 / Math.PI)) - 180
  return { lat, lon }
}

function findNearestCountry(lat, lon) {
  let nearest = null, minDist = Infinity
  for (const c of COUNTRIES) {
    const d = haversineDistance(lat, lon, c.lat, c.lon)
    if (d < minDist) { minDist = d; nearest = c }
  }
  return minDist < 2500 ? nearest : null
}

function GlobeControls() {
  return (
    <OrbitControls
      enableZoom enablePan={false}
      minDistance={2.2} maxDistance={6}
      autoRotate autoRotateSpeed={0.5}
    />
  )
}

function ClickableEarth({ onCountryClick, onCountryHover }) {
  const downPos = useRef({ x: 0, y: 0 })
  return (
    <mesh
      onPointerDown={e => { downPos.current = { x: e.clientX, y: e.clientY } }}
      onPointerUp={e => {
        const dx = e.clientX - downPos.current.x
        const dy = e.clientY - downPos.current.y
        if (Math.sqrt(dx * dx + dy * dy) < 4) {
          e.stopPropagation()
          const { lat, lon } = vec3ToLatLon(e.point)
          const c = findNearestCountry(lat, lon)
          if (c) onCountryClick(c.name)
        }
      }}
      onPointerMove={e => {
        const { lat, lon } = vec3ToLatLon(e.point)
        const c = findNearestCountry(lat, lon)
        onCountryHover(c?.name || null, e.clientX, e.clientY)
      }}
      onPointerLeave={() => onCountryHover(null, 0, 0)}
    >
      <sphereGeometry args={[1, 48, 48]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

function exportCSV(threats) {
  const header = 'timestamp,source_country,target_country,type,severity,ip,mitre_id\n'
  const rows = threats.map(t =>
    `${t.timestamp},${t.source_country},${t.target_country},${t.type},${t.severity},${t.ip},${t.mitre_id || ''}`
  ).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cyberpulse_threats_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

let dripCounter = 0

function App() {
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [threats, setThreats] = useState([])
  const [arcs, setArcs] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [backendReady, setBackendReady] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const threatPoolRef = useRef([])
  const poolIndexRef = useRef(0)
  const [hoverInfo, setHoverInfo] = useState({ country: null, x: 0, y: 0 })
  const threatTimestampsRef = useRef([])

  const handleNewThreat = useCallback((threat) => {
    const unique = { ...threat, _uid: `${threat.id}_${++dripCounter}` }
    setThreats(prev => [unique, ...prev].slice(0, MAX_THREATS))
    threatTimestampsRef.current = [Date.now(), ...threatTimestampsRef.current].slice(0, 200)

    if (threat.source_lat != null && threat.target_lat != null) {
      setArcs(prev => [{
        source: { lat: threat.source_lat, lon: threat.source_lon },
        target: { lat: threat.target_lat, lon: threat.target_lon },
        type: threat.type,
        severity: threat.severity,
        id: unique._uid,
      }, ...prev].slice(0, MAX_ARCS))
    }
  }, [])

  const handleCountryHover = useCallback((name, x, y) => {
    setHoverInfo({ country: name, x, y })
  }, [])

  // Elapsed timer shown on loading screen
  useEffect(() => {
    if (backendReady) return
    const timer = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timer)
  }, [backendReady])

  useEffect(() => {
    const fetchPool = async () => {
      try {
        const res = await fetch(endpoints.latestThreats)
        const data = await res.json()
        if (Array.isArray(data) && data.length) {
          threatPoolRef.current = data
          poolIndexRef.current = 0
          setBackendReady(true)
        }
      } catch (e) { console.error('Fetch failed:', e) }
    }
    fetchPool()
    const refresh = setInterval(fetchPool, 5 * 60 * 1000)
    return () => clearInterval(refresh)
  }, [])

  useEffect(() => {
    const drip = setInterval(() => {
      const pool = threatPoolRef.current
      if (!pool.length) return
      handleNewThreat(pool[poolIndexRef.current % pool.length])
      poolIndexRef.current++
    }, 3000)
    return () => clearInterval(drip)
  }, [handleNewThreat])

  const { country: hoveredCountry, x: mouseX, y: mouseY } = hoverInfo

  const hoveredThreats = threats.filter(
    t => t.source_country === hoveredCountry || t.target_country === hoveredCountry
  )
  const topType = hoveredThreats.length
    ? Object.entries(hoveredThreats.reduce((a, t) => {
        a[t.type] = (a[t.type] || 0) + 1; return a
      }, {})).sort((a, b) => b[1] - a[1])[0][0]
    : ''

  const topAttacker = threats.length
    ? Object.entries(threats.reduce((a, t) => {
        a[t.source_country] = (a[t.source_country] || 0) + 1; return a
      }, {})).sort((a, b) => b[1] - a[1])[0]?.[0]
    : '---'

  const filteredThreats = filter === 'ALL' ? threats : threats.filter(t => t.type === filter)
  const filteredArcs = filter === 'ALL' ? arcs : arcs.filter(a => a.type === filter)

  const FILTER_COLORS = {
    ALL: '#FFF', DDoS: '#FF2D78', Malware: '#FF8C00',
    Phishing: '#00FFFF', Ransomware: '#CCFF00', 'Brute Force': '#BF5FFF',
  }

  // Loading screen
  if (!backendReady) return (
    <div style={{
      width: '100vw', height: '100vh', background: '#020817',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Share Tech Mono", monospace',
    }}>
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fillbar {
          0% { width: 5%; }
          50% { width: 85%; }
          100% { width: 5%; }
        }
        @keyframes flicker {
          0%, 95%, 100% { opacity: 1; }
          96% { opacity: 0.4; }
          97% { opacity: 1; }
          98% { opacity: 0.6; }
        }
      `}</style>

      {/* Scanline effect */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: '4px',
        background: 'linear-gradient(transparent, #00FFFF22, transparent)',
        animation: 'scanline 3s linear infinite',
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* Logo */}
      <div style={{
        color: '#00FFFF', fontSize: 10, letterSpacing: '6px',
        marginBottom: 8, animation: 'flicker 4s infinite',
      }}>
        GLOBAL THREAT INTELLIGENCE
      </div>
      <div style={{
        color: '#FFF', fontSize: 48, fontWeight: 700,
        letterSpacing: '6px', marginBottom: 4,
        textShadow: '0 0 20px #00FFFF44',
        animation: 'flicker 6s infinite',
      }}>
        CYBERPULSE
      </div>

      {/* Divider */}
      <div style={{
        width: 320, height: 2,
        background: 'linear-gradient(to right, transparent, #FF2D78, transparent)',
        margin: '16px 0',
      }} />

      {/* Status */}
      <div style={{
        color: '#FF2D78', fontSize: 11, letterSpacing: '4px', marginBottom: 24,
        animation: 'blink 1.2s step-end infinite',
      }}>
        ▶ INITIALIZING THREAT FEED...
      </div>

      {/* Progress bar */}
      <div style={{
        width: 320, height: 6, background: '#0a0a1a',
        border: '1px solid #00FFFF44',
        marginBottom: 12, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', background: '#00FFFF',
          boxShadow: '0 0 8px #00FFFF',
          animation: 'fillbar 2s ease-in-out infinite',
        }} />
      </div>

      {/* Timer */}
      <div style={{ color: '#444', fontSize: 10, letterSpacing: '2px', marginBottom: 8 }}>
        {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')} ELAPSED
      </div>

      <div style={{ color: '#555', fontSize: 10, letterSpacing: '2px' }}>
        BACKEND WAKING UP — MAY TAKE UP TO 50s
      </div>

      {/* Corner decorations */}
      <div style={{
        position: 'fixed', top: 16, left: 16,
        width: 40, height: 40,
        borderTop: '2px solid #00FFFF44',
        borderLeft: '2px solid #00FFFF44',
      }} />
      <div style={{
        position: 'fixed', top: 16, right: 16,
        width: 40, height: 40,
        borderTop: '2px solid #00FFFF44',
        borderRight: '2px solid #00FFFF44',
      }} />
      <div style={{
        position: 'fixed', bottom: 16, left: 16,
        width: 40, height: 40,
        borderBottom: '2px solid #00FFFF44',
        borderLeft: '2px solid #00FFFF44',
      }} />
      <div style={{
        position: 'fixed', bottom: 16, right: 16,
        width: 40, height: 40,
        borderBottom: '2px solid #00FFFF44',
        borderRight: '2px solid #00FFFF44',
      }} />
    </div>
  )

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#020817' }}>

      <div style={{
        position: 'fixed', top: 16, left: 20, zIndex: 10,
        fontFamily: '"Share Tech Mono", monospace',
        background: '#000', border: '3px solid #000',
        boxShadow: '5px 5px 0px #00FFFF', padding: '6px 14px',
      }}>
        <div style={{ color: '#00FFFF', fontSize: 9, letterSpacing: '4px', textTransform: 'uppercase' }}>
          GLOBAL THREAT INTELLIGENCE
        </div>
        <div style={{ color: '#FFF', fontSize: 22, fontWeight: 700, letterSpacing: '2px' }}>
          CYBERPULSE
        </div>
      </div>

      <button
        onClick={() => exportCSV(threats)}
        style={{
          position: 'fixed', top: 16, right: 20, zIndex: 10,
          background: '#000', color: '#CCFF00',
          border: '2px solid #CCFF00', boxShadow: '3px 3px 0px #CCFF00',
          fontFamily: '"Share Tech Mono", monospace',
          fontSize: 10, padding: '6px 12px', cursor: 'pointer', fontWeight: 700,
        }}
      >
        ⬇ EXPORT CSV
      </button>

      <StatsBar
        threats={threats}
        topAttacker={topAttacker}
        threatTimestampsRef={threatTimestampsRef}
      />

      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, display: 'flex', gap: 8,
        fontFamily: '"Share Tech Mono", monospace',
      }}>
        {Object.entries(FILTER_COLORS).map(([type, color]) => {
          const active = filter === type
          return (
            <button key={type} onClick={() => setFilter(type)} style={{
              background: active ? color : '#000',
              color: active ? '#000' : color,
              border: `2px solid ${color}`,
              boxShadow: active ? `3px 3px 0px ${color}88` : 'none',
              fontFamily: '"Share Tech Mono", monospace',
              fontSize: 10, padding: '4px 10px',
              cursor: 'pointer', fontWeight: 700,
            }}>
              {type}
            </button>
          )
        })}
      </div>

      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        performance={{ min: 0.5 }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 3, 5]} intensity={2.5} color="#ffffff" />
        <pointLight position={[-5, 3, -5]} intensity={1.0} color="#4488ff" />
        <Stars radius={300} depth={60} count={3000} factor={4} fade />
        <Earth threats={threats.slice(0, EARTH_THREAT_WINDOW)} />
        <AttackArcs arcs={filteredArcs} />
        <ClickableEarth
          onCountryClick={setSelectedCountry}
          onCountryHover={handleCountryHover}
        />
        <GlobeControls />
      </Canvas>

      <SidebarFeed threats={filteredThreats} filter={filter} />
      <Leaderboard threats={threats} />
      <ToastAlert threats={threats} />

      <HoverTooltip
        visible={!!hoveredCountry} x={mouseX} y={mouseY}
        country={hoveredCountry}
        threatCount={hoveredThreats.length}
        topType={topType}
      />
      <CountryModal
        visible={!!selectedCountry}
        onClose={() => setSelectedCountry(null)}
        country={selectedCountry}
        threats={threats}
      />
    </div>
  )
}

export default App