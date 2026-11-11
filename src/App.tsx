import { useEffect, useMemo, useState } from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AppSidebar from './components/AppSidebar'
import TopNavigation from './components/TopNavigation'
import { ToastProvider } from './components/ToastProvider'
import { ThemeProvider } from './components/ThemeProvider'
import { WorkspaceProvider } from './lib/store'
import { PageSkeleton } from './components/LoadingSkeleton'
import Overview from './pages/Overview'
import AnalyzeMedia from './pages/AnalyzeMedia'
import ImageForensics from './pages/ImageForensics'
import VideoIntelligence from './pages/VideoIntelligence'
import ContentCredentials from './pages/ContentCredentials'
import AssetFingerprints from './pages/AssetFingerprints'
import VerificationHistory from './pages/VerificationHistory'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import TeamManagement from './pages/TeamManagement'
import Settings from './pages/Settings'

function PageShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const ta = setTimeout(() => setLoading(false), 320)
    return () => clearTimeout(ta)
  }, [location.pathname])

  return (
    <div key={location.pathname} className="animate-fadeUp p-4 lg:p-8">
      {loading ? <PageSkeleton /> : children}
    </div>
  )
}

function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  // close the mobile drawer on navigation
  useEffect(() => setDrawerOpen(false), [location.pathname])

  // lock body scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  return (
    <div className="flex min-h-screen bg-base">
      {/* Desktop sidebar */}
      <div className="sticky top-0 hidden h-screen lg:block">
        <AppSidebar />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="animate-fadeIn absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 h-full animate-drawerIn">
            <AppSidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavigation onOpenSidebar={() => setDrawerOpen(true)} />
        <main className="min-w-0 flex-1">
          <PageShell>{children}</PageShell>
        </main>
        <footer className="border-t border-line px-4 py-3 text-micro text-ink3 lg:px-8">
          Adobe CreativeTrust AI · Conceptual prototype — forensic results shown are simulated · v1.0.0
        </footer>
      </div>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const routes = useMemo(
    () => (
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/analyze" element={<AnalyzeMedia />} />
        <Route path="/image-forensics" element={<ImageForensics />} />
        <Route path="/video-intelligence" element={<VideoIntelligence />} />
        <Route path="/credentials" element={<ContentCredentials />} />
        <Route path="/fingerprints" element={<AssetFingerprints />} />
        <Route path="/history" element={<VerificationHistory />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/team" element={<TeamManagement />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    ),
    [],
  )

  return (
    <ThemeProvider>
      <ToastProvider>
        <WorkspaceProvider>
          <HashRouter>
            <ScrollToTop />
            <WorkspaceLayout>{routes}</WorkspaceLayout>
          </HashRouter>
        </WorkspaceProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
