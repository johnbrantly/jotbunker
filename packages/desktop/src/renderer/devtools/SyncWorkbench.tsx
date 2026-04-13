import React, { useEffect } from 'react'
import WorkbenchLayout from './components/WorkbenchLayout'
import { virtualClient } from './client/VirtualPhoneClient'
import { handleStateSync } from './client/storeSync'

export default function SyncWorkbench() {
  useEffect(() => {
    virtualClient.onStateSync = (ss) => handleStateSync(ss, virtualClient)

    return () => {
      virtualClient.disconnect()
    }
  }, [])

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#e0e0e0',
        fontFamily: 'DMSans, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <WorkbenchLayout />
    </div>
  )
}
