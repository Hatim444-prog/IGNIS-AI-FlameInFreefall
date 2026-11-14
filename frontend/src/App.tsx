import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import Shell from '@/research/Shell'
import { Overview, Explorer, Detail, Investigations } from '@/research/Catalog'
import Analytics from '@/research/Analytics'
import Assistant from '@/research/Assistant'
import Mission from '@/research/Mission'
import { Media, Library } from '@/research/Media'
import { Settings, Sources } from '@/research/Settings'

function ExperimentDetail() {
  const { code } = useParams()
  if (!code) return null
  return <Detail code={decodeURIComponent(code)} />
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="experiments" element={<Explorer />} />
          <Route path="experiments/:code" element={<ExperimentDetail />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="media" element={<Media />} />
          <Route path="media/library" element={<Library />} />
          <Route path="mission-advisor" element={<Mission />} />
          <Route path="investigations" element={<Investigations />} />
          <Route path="sources" element={<Sources />} />
          <Route path="settings" element={<Settings />} />
          <Route
            path="measurements"
            element={<Navigate to="/analytics" replace />}
          />
          <Route path="vision" element={<Navigate to="/media" replace />} />
          <Route
            path="mission"
            element={<Navigate to="/mission-advisor" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}