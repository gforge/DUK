import React from 'react'
import type { JourneyTemplate } from '@/api/schemas'
import DeriveDialog from './DeriveDialog'
import SyncFromParentDialog from './SyncFromParentDialog'
import EditTemplateDialog from './EditTemplateDialog'

export default function JourneyTemplatesTabDialogs({
  deriveTarget,
  syncTarget,
  editTarget,
  setDeriveTarget,
  setSyncTarget,
  setEditTarget,
  onRefresh,
}: {
  deriveTarget: JourneyTemplate | null
  syncTarget: JourneyTemplate | null
  editTarget: JourneyTemplate | null | undefined
  setDeriveTarget: React.Dispatch<React.SetStateAction<JourneyTemplate | null>>
  setSyncTarget: React.Dispatch<React.SetStateAction<JourneyTemplate | null>>
  setEditTarget: React.Dispatch<React.SetStateAction<JourneyTemplate | null | undefined>>
  onRefresh?: () => void
}) {
  return (
    <>
      {deriveTarget && (
        <DeriveDialog
          parentTemplate={deriveTarget}
          onClose={() => setDeriveTarget(null)}
          onDerived={() => {
            setDeriveTarget(null)
            onRefresh?.()
          }}
        />
      )}
      {syncTarget && (
        <SyncFromParentDialog
          childTemplate={syncTarget}
          onClose={() => setSyncTarget(null)}
          onSynced={() => {
            setSyncTarget(null)
            onRefresh?.()
          }}
        />
      )}
      {editTarget !== null && (
        <EditTemplateDialog
          template={editTarget ?? undefined}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null)
            onRefresh?.()
          }}
        />
      )}
    </>
  )
}
