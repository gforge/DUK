import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import AppShell from '../components/layout/AppShell'

const Dashboard = lazy(() => import('../pages/Dashboard'))
const CaseDetail = lazy(() => import('../pages/CaseDetail'))
const PatientView = lazy(() => import('../pages/PatientView'))
const PolicyEditor = lazy(() => import('../pages/PolicyEditor'))
const DemoTools = lazy(() => import('../pages/DemoTools'))
const JourneyEditor = lazy(() => import('../pages/JourneyEditor'))

function Loader() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
      <CircularProgress />
    </Box>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppShell>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cases/:id" element={<CaseDetail />} />
            <Route path="/patient" element={<PatientView />} />
            <Route path="/policy" element={<PolicyEditor />} />
            <Route path="/journeys" element={<JourneyEditor />} />
            <Route path="/demo-tools" element={<DemoTools />} />
          </Routes>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  )
}
