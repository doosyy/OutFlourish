import { useEffect } from 'react'

// iOS-style edge-swipe-back. Fires onBack when a single touch starts within
// EDGE px of the left screen edge and is dragged right past THRESHOLD, while
// staying mostly horizontal. Listeners are passive (never block scrolling);
// we only decide on touchend.
export function useSwipeBack(onBack: () => void) {
  useEffect(() => {
    const EDGE = 30        // px from the left edge where a back-swipe can start
    const THRESHOLD = 80   // px of rightward travel required to trigger
    let active = false
    let startX = 0
    let startY = 0

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) { active = false; return }
      const t = e.touches[0]
      active = t.clientX <= EDGE
      startX = t.clientX
      startY = t.clientY
    }
    const onEnd = (e: TouchEvent) => {
      if (!active) return
      active = false
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      if (dx > THRESHOLD && Math.abs(dy) < 70 && dx > Math.abs(dy) * 1.5) {
        onBack()
      }
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [onBack])
}
