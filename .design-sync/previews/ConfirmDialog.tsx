import { ConfirmDialog } from 'duk-clinical-triage-demo'

export const CloseCase = () => (
  <ConfirmDialog
    open
    title="Avsluta ärende?"
    message="Ärendet för Karin Nilsson flyttas till Stängda. Patientresan fortsätter enligt plan."
    confirmLabel="Avsluta ärende"
    confirmColor="primary"
    onConfirm={() => {}}
    onCancel={() => {}}
  />
)

export const DeleteDestructive = () => (
  <ConfirmDialog
    open
    title="Ta bort bokning?"
    message="Bokningen 14 okt kl 09:30 hos SSK Anna Holmberg tas bort permanent."
    confirmLabel="Ta bort"
    onConfirm={() => {}}
    onCancel={() => {}}
  />
)
