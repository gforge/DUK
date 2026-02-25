import { getStore, patchStore } from '../storage'
import { now } from './utils'
import type { Patient } from '../schemas'

export function getPatients(): Patient[] {
  return getStore().patients
}

export function getPatient(id: string): Patient | undefined {
  return getStore().patients.find((p) => p.id === id)
}

export function patientOpenedApp(patientId: string): Patient {
  const updated = patchStore((s) => ({
    ...s,
    patients: s.patients.map((p) => (p.id === patientId ? { ...p, lastOpenedAt: now() } : p)),
  }))
  return updated.patients.find((p) => p.id === patientId)!
}
