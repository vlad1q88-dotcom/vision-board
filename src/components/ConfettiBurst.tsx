import { useMemo } from 'react'
import { motion } from 'motion/react'
import styles from './ConfettiBurst.module.css'

const COLORS = ['#b78cf0', '#8a5fd8', '#e0648a', '#f3f0ff', '#6cc8a3', '#f0c869']
const PARTICLE_COUNT = 14

interface Particle {
  id: number
  color: string
  x: number
  y: number
  rotate: number
}

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.4
    const distance = 26 + Math.random() * 22
    return {
      id: i,
      color: COLORS[i % COLORS.length],
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      rotate: Math.random() * 360,
    }
  })
}

export function ConfettiBurst() {
  const particles = useMemo(createParticles, [])

  return (
    <div className={styles.burst}>
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className={styles.particle}
          style={{ background: particle.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: particle.x, y: particle.y, opacity: 0, rotate: particle.rotate, scale: 0.6 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}
