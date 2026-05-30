// Top-level error boundary. A render error anywhere below would otherwise
// blank the whole WKWebView with no recovery. This catches it and shows a
// calm cream fallback with a reload, keeping the app's voice and palette.

import React from 'react'
import { PCT } from '../tokens'

interface Props { children: React.ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    // Surfaced to the native log via Capacitor's console bridge.
    console.error('OutFlourish render error:', error)
  }

  private reload = () => {
    this.setState({ hasError: false })
    window.location.hash = '#/'
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-center"
        style={{ background: PCT.cream, padding: '0 32px' }}
      >
        <div style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase',
          color: PCT.terracotta, marginBottom: 14,
        }}>A small hiccup</div>
        <h1 style={{
          margin: 0,
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 34, lineHeight: 1.05, color: PCT.ink, letterSpacing: '-0.02em',
        }}>
          Something needed<br />
          <span style={{ fontStyle: 'italic', color: PCT.terracottaDeep }}>a moment to settle</span>
          <span style={{ color: PCT.terracotta }}>.</span>
        </h1>
        <p style={{
          maxWidth: 280, marginTop: 18, marginBottom: 32,
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 15, lineHeight: 1.55, color: PCT.inkSoft,
        }}>
          Your plants and history are safe on this device. Reload to pick up where you left off.
        </p>
        <button
          onClick={this.reload}
          style={{
            padding: '15px 30px',
            background: PCT.terracotta, color: PCT.cream,
            borderRadius: 999, border: 'none',
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 17,
            boxShadow: '0 12px 28px rgba(165,78,38,0.32)',
          }}
        >
          Reload OutFlourish
        </button>
      </div>
    )
  }
}
