import React, { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

const ATTACK_COLORS = {
  DDoS: '#FF2D78', Malware: '#FF8C00', Phishing: '#00FFFF',
  Ransomware: '#CCFF00', 'Brute Force': '#BF5FFF',
}

function latLonToVector3(lat, lon, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.sin(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.cos(theta)
  )
}

function createArcPoints(sourceLat, sourceLon, targetLat, targetLon, radius = 1) {
  const p1 = latLonToVector3(sourceLat, sourceLon, radius)
  const p2 = latLonToVector3(targetLat, targetLon, radius)
  const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)
  const dist = p1.distanceTo(p2)
  mid.normalize().multiplyScalar(radius + dist * 0.4)
  const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2)
  return { points: curve.getPoints(30).map(p => [p.x, p.y, p.z]), target: p2 }
}

// Particle burst — pooled into one Points object, no individual meshes
function LandingBurst({ position, color }) {
  const ref = useRef()
  const ageRef = useRef(0)
  const PARTICLE_COUNT = 12

  const { positions, directions } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const directions = Array.from({ length: PARTICLE_COUNT }, () =>
      new THREE.Vector3(
        (Math.random() - 0.5),
        (Math.random() - 0.5),
        (Math.random() - 0.5)
      ).normalize()
    )
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = position.x
      positions[i * 3 + 1] = position.y
      positions[i * 3 + 2] = position.z
    }
    return { positions, directions }
  }, [position])

  useFrame((_, delta) => {
    if (!ref.current) return
    ageRef.current += delta
    const t = Math.min(ageRef.current / 0.7, 1)
    const arr = ref.current.geometry.attributes.position.array
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const d = directions[i]
      arr[i * 3]     = position.x + d.x * t * 0.15
      arr[i * 3 + 1] = position.y + d.y * t * 0.15
      arr[i * 3 + 2] = position.z + d.z * t * 0.15
    }
    ref.current.geometry.attributes.position.needsUpdate = true
    ref.current.material.opacity = 1 - t
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.015}
        transparent
        opacity={1}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

function AnimatedArc({ attack }) {
  const lineRef = useRef()
  const ageRef = useRef(0)
  const [burst, setBurst] = useState(false)
  const burstFiredRef = useRef(false)

  const { points, target } = useMemo(() => {
    const { source, target: tgt } = attack
    if (!source || !tgt) return { points: null, target: null }
    return createArcPoints(source.lat, source.lon, tgt.lat, tgt.lon)
  }, [attack])

  useFrame((_, delta) => {
    if (!lineRef.current?.material) return
    ageRef.current += delta
    const age = ageRef.current

    // Animate dash
    lineRef.current.material.dashOffset -= 0.015

    // Fade out after 8 seconds
    const opacity = age < 6 ? 0.85 : Math.max(0, 0.85 - (age - 6) / 2)
    lineRef.current.material.opacity = opacity

    // Trigger burst once at ~1.5s
    if (age > 1.5 && !burstFiredRef.current) {
      burstFiredRef.current = true
      setBurst(true)
    }
  })

  if (!points) return null
  const color = ATTACK_COLORS[attack.type] || '#00FFFF'

  return (
    <>
      <Line
        ref={lineRef}
        points={points}
        color={color}
        lineWidth={1.5}
        dashed
        dashScale={30}
        dashSize={0.5}
        gapSize={0.3}
        transparent
        opacity={0.85}
      />
      {burst && target && <LandingBurst position={target} color={color} />}
    </>
  )
}

const MemoArc = React.memo(AnimatedArc, (prev, next) => prev.attack.id === next.attack.id)

export default function AttackArcs({ arcs }) {
  if (!arcs || arcs.length === 0) return null
  return (
    <group>
      {arcs.map((arc, i) => (
        <MemoArc key={arc.id || `arc-${i}`} attack={arc} />
      ))}
    </group>
  )
}