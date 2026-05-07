import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { HomePage } from './pages/HomePage'
import { WatchPage } from './pages/WatchPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { UploadPage } from './pages/UploadPage'
import { StudioPage } from './pages/StudioPage'
import { ChannelPage } from './pages/ChannelPage'
import { PlaylistPage } from './pages/PlaylistPage'
import { HistoryPage } from './pages/HistoryPage'
import { LikedVideosPage } from './pages/LikedVideosPage'
import { SubscriptionsPage } from './pages/SubscriptionsPage'
import { SettingsPage } from './pages/SettingsPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/watch/:videoId" element={<WatchPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/playlist/:playlistId" element={<PlaylistPage />} />
            <Route path="/channel/:username" element={<ChannelPage />} />

            <Route
              path="/upload"
              element={
                <RequireAuth>
                  <UploadPage />
                </RequireAuth>
              }
            />
            <Route
              path="/studio"
              element={
                <RequireAuth>
                  <StudioPage />
                </RequireAuth>
              }
            />
            <Route
              path="/history"
              element={
                <RequireAuth>
                  <HistoryPage />
                </RequireAuth>
              }
            />
            <Route
              path="/liked"
              element={
                <RequireAuth>
                  <LikedVideosPage />
                </RequireAuth>
              }
            />
            <Route
              path="/subscriptions"
              element={
                <RequireAuth>
                  <SubscriptionsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <SettingsPage />
                </RequireAuth>
              }
            />

            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}
