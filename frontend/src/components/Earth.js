import { useMemo, useRef } from 'react'
import { useLoader, useFrame } from '@react-three/fiber'
import { TextureLoader } from 'three'
import * as THREE from 'three'

const ATTACK_COLORS = {
  DDoS: '#FF2D78', Malware: '#FF8C00', Phishing: '#00FFFF',
  Ransomware: '#CCFF00', 'Brute Force': '#BF5FFF',
}

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

function latLonToVec3(lat, lon, r = 1.018) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -(r * Math.sin(phi) * Math.sin(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.cos(theta)
  )
}

// Single Points draw call for ALL heatmap dots — massive perf win
function HeatmapPoints({ heatmap, maxCount }) {
  const pointsRef = useRef()
  const pulseRef = useRef(0)

  const { positions, colors, sizes } = useMemo(() => {
    const positions = []
    const colors = []
    const sizes = []
    for (const country of COUNTRIES) {
      const data = heatmap[country.name]
      if (!data) continue
      const v = latLonToVec3(country.lat, country.lon)
      positions.push(v.x, v.y, v.z)
      const intensity = data.count / maxCount
      sizes.push(4 + intensity * 10)
      const topType = Object.entries(data.types).sort((a, b) => b[1] - a[1])[0][0]
      const hex = ATTACK_COLORS[topType] || '#FFFFFF'
      const c = new THREE.Color(hex)
      colors.push(c.r, c.g, c.b)
    }
    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
      sizes: new Float32Array(sizes),
    }
  }, [heatmap, maxCount])

  // Gentle pulse — just modulates existing material, no re-renders
  useFrame(({ clock }) => {
    if (pointsRef.current?.material) {
      const pulse = 0.7 + 0.3 * Math.sin(clock.getElapsedTime() * 2)
      pointsRef.current.material.opacity = pulse
    }
  })

  if (positions.length === 0) return null

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

export default function Earth({ threats = [] }) {
  const [earthTexture, cloudsMap] = useLoader(TextureLoader, [
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png',
  ])

  const heatmap = useMemo(() => {
    const map = {}
    for (const t of threats) {
      const key = t.source_country
      if (!map[key]) map[key] = { count: 0, types: {} }
      map[key].count++
      map[key].types[t.type] = (map[key].types[t.type] || 0) + 1
    }
    return map
  }, [threats])

  const maxCount = useMemo(() =>
    Math.max(1, ...Object.values(heatmap).map(v => v.count))
  , [heatmap])

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 48, 48]} />
        <meshPhongMaterial
          map={earthTexture}
          specular={new THREE.Color(0x111111)}
          shininess={8}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.01, 32, 32]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
      <HeatmapPoints heatmap={heatmap} maxCount={maxCount} />
    </group>
  )
}