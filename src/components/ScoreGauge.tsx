'use client'

import { useEffect, useRef } from 'react'
import { getScoreColor, getNiveauLabel } from '@/lib/utils'
import { NiveauRisque } from '@/types/analysis'

interface ScoreGaugeProps {
  score: number
  niveau: NiveauRisque
  size?: number
}

export function ScoreGauge({ score, niveau, size = 200 }: ScoreGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>()
  const currentScoreRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const radius = size * 0.38
    const startAngle = Math.PI * 0.75
    const endAngle = Math.PI * 2.25
    const totalAngle = endAngle - startAngle

    const targetScore = score

    function draw(current: number) {
      if (!ctx) return
      ctx.clearRect(0, 0, size, size)

      // Background arc
      ctx.beginPath()
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = size * 0.07
      ctx.lineCap = 'round'
      ctx.stroke()

      // Score arc
      const scoreAngle = startAngle + (current / 100) * totalAngle
      const color = getScoreColor(current)

      const gradient = ctx.createLinearGradient(0, 0, size, size)
      gradient.addColorStop(0, color + 'aa')
      gradient.addColorStop(1, color)

      ctx.beginPath()
      ctx.arc(cx, cy, radius, startAngle, scoreAngle)
      ctx.strokeStyle = gradient
      ctx.lineWidth = size * 0.07
      ctx.lineCap = 'round'
      ctx.stroke()

      // Glow effect
      ctx.shadowColor = color
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.arc(cx, cy, radius, startAngle, scoreAngle)
      ctx.strokeStyle = color
      ctx.lineWidth = size * 0.02
      ctx.stroke()
      ctx.shadowBlur = 0

      // Score text
      ctx.fillStyle = '#ffffff'
      ctx.font = `600 ${size * 0.22}px "Martian Mono", monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(Math.round(current).toString(), cx, cy - size * 0.04)

      // /100
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = `400 ${size * 0.08}px "Martian Mono", monospace`
      ctx.fillText('/100', cx, cy + size * 0.12)
    }

    function animate() {
      const diff = targetScore - currentScoreRef.current
      if (Math.abs(diff) < 0.5) {
        currentScoreRef.current = targetScore
        draw(targetScore)
        return
      }
      currentScoreRef.current += diff * 0.08
      draw(currentScoreRef.current)
      animRef.current = requestAnimationFrame(animate)
    }

    if (animRef.current) cancelAnimationFrame(animRef.current)
    animate()

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [score, size])

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="drop-shadow-lg"
      />
      <span
        className="text-sm font-mono font-bold px-3 py-1 rounded-full border"
        style={{
          color: getScoreColor(score),
          borderColor: getScoreColor(score) + '50',
          backgroundColor: getScoreColor(score) + '15',
        }}
      >
        {getNiveauLabel(niveau)}
      </span>
    </div>
  )
}
