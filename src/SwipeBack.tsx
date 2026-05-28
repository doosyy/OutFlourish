import { useEffect, useRef, type ReactNode } from 'react'

// iOS-style interactive edge-swipe back. The wrapped content follows the
// finger when a drag starts within EDGE px of the left edge. On release:
//   - past the threshold → slide fully off-screen, then onBack()
//   - short of it        → spring back to rest
//
// Transform/listeners only engage mid-gesture; at rest the transform is
// cleared so it never creates a containing block for fixed descendants.
interface Props {
  /** Evaluated at touch-start: should a back-swipe engage right now? */
  canGoBack: () => boolean
  onBack: () => void
  children: ReactNode
}

export default function SwipeBackContainer({ canGoBack, onBack, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const s = useRef({ active: false, decided: false, horizontal: false, startX: 0, startY: 0, dx: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const EDGE = 30
    const SPRING = 'transform 0.3s cubic-bezier(0.22,0.61,0.36,1)'
    const width = () => el.offsetWidth || window.innerWidth

    const apply = (x: number, animate: boolean) => {
      el.style.transition = animate ? SPRING : 'none'
      el.style.transform = `translate3d(${Math.max(0, x)}px,0,0)`
      el.style.boxShadow = '-14px 0 36px rgba(58,30,18,0.20)'
    }
    const clear = () => { el.style.transition = 'none'; el.style.transform = ''; el.style.boxShadow = '' }
    const reset = () => { const c = s.current; c.active = false; c.decided = false; c.horizontal = false; c.dx = 0 }

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) { reset(); return }
      const t = e.touches[0]
      if (t.clientX > EDGE || !canGoBack()) { reset(); return }
      const c = s.current
      c.active = true; c.decided = false; c.horizontal = false
      c.startX = t.clientX; c.startY = t.clientY; c.dx = 0
    }
    const onMove = (e: TouchEvent) => {
      const c = s.current
      if (!c.active) return
      const t = e.touches[0]
      const dx = t.clientX - c.startX
      const dy = t.clientY - c.startY
      if (!c.decided) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        c.decided = true
        c.horizontal = Math.abs(dx) > Math.abs(dy)
        if (!c.horizontal) { c.active = false; return } // vertical → let it scroll
      }
      e.preventDefault() // own the gesture: stop scroll/refresh
      c.dx = Math.max(0, dx)
      apply(c.dx, false)
    }
    const onEnd = () => {
      const c = s.current
      if (!c.active || !c.horizontal) { reset(); return }
      const { dx } = c
      const w = width()
      reset()
      if (dx > w * 0.4 || dx > 140) {
        apply(w, true)
        window.setTimeout(() => { onBack(); clear() }, 300)
      } else {
        apply(0, true)
        window.setTimeout(clear, 300)
      }
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [canGoBack, onBack])

  return <div ref={ref} style={{ willChange: 'transform' }}>{children}</div>
}
