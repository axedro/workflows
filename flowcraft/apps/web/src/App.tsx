import React, { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Loading from './components/Loading'

// Lazy load components
const Dashboard = React.lazy(() => import('./components/Dashboard'))
const WorkflowEditor = React.lazy(() => import('./components/WorkflowEditor'))
const Auth = React.lazy(() => import('./components/Auth'))

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workflow/:id" element={<WorkflowEditor />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App 