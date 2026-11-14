import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ExperimentSelectionProvider } from './context/ExperimentSelection'
import Layout from './components/Layout'
import Dashboard from './screens/Dashboard'
import Experiments from './screens/Experiments'
import Measurements from './screens/Measurements'
import Assistant from './screens/Assistant'
import Vision from './screens/Vision'
import Mission from './screens/Mission'
import Settings from './screens/Settings'

export default function App() {
  return (
    <ExperimentSelectionProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="experiments" element={<Experiments />} />
            <Route path="measurements" element={<Measurements />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="vision" element={<Vision />} />
            <Route path="mission" element={<Mission />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ExperimentSelectionProvider>
  )
}

