import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DashboardStatsProvider } from './context/DashboardStatsContext'
import Layout from './components/Layout'
import SourceList from './pages/SourceList'
import Reader from './pages/vecchi/Reader'
import YouTubeViewer from './pages/YouTubeViewer'
import DashboardV2 from './pages/DashboardV2'
import Training from './pages/Training'
import Training2 from './pages/Training2'

export default function App() {
  return (
    <BrowserRouter>
      <DashboardStatsProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<SourceList />} />
            <Route path="/source/:sourceId" element={<Reader />} />
            <Route path="/dashboard" element={<DashboardV2 />} />
            <Route path="/youtube" element={<YouTubeViewer />} />
            <Route path="/training" element={<Training />} />
            <Route path="/training2" element={<Training2 />} />
          </Routes>
        </Layout>
      </DashboardStatsProvider>
    </BrowserRouter>
  )
}
