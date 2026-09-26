import React from 'react'

import type { JourneyTemplate } from '@/api/schemas'
import DeriveDialog from '@/components/journey/editor/DeriveDialog'
import EditTemplateDialog from '@/components/journey/editor/EditTemplateDialog'
import SyncFromParentDialog from '@/components/journey/editor/SyncFromParentDialog'

export function JourneyTemplatesTabDialogs({
  deriveTarget,
  syncTarget,
  editTarget,
  setDeriveTarget,
  setSyncTarget,
  setEditTarget,
  onRefresh,
  onCreated,
}: {
  deriveTarget: JourneyTemplate | null
  syncTarget: JourneyTemplate | null
  editTarget: JourneyTemplate | null | undefined
  setDeriveTarget: React.Dispatch<React.SetStateAction<JourneyTemplate | null>>
  setSyncTarget: React.Dispatch<React.SetStateAction<JourneyTemplate | null>>
  setEditTarget: React.Dispatch<React.SetStateAction<JourneyTemplate | null | undefined>>
  onRefresh?: () => void
  /** Called with a newly created or derived template so it can be selected. */
  onCreated?: (template: JourneyTemplate) => void
}) {
  return (
    <>
      {deriveTarget && (
        <DeriveDialog
          parentTemplate={deriveTarget}
          onClose={() => setDeriveTarget(null)}
          onDerived={(derived) => {
            setDeriveTarget(null)
            onRefresh?.()
            onCreated?.(derived)
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
          onSaved={(saved) => {
            const isNew = editTarget === undefined
            setEditTarget(null)
            onRefresh?.()
            if (isNew) onCreated?.(saved)
          }}
        />
      )}
    </>
  )
}
