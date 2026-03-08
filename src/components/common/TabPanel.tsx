import { Box } from '@mui/material'
import React from 'react'

interface TabPanelProps {
  children: React.ReactNode
  value: number
  index: number
}

export default function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`journey-tabpanel-${index}`}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}
