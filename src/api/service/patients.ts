import type { Patient } from '../schemas'
import { getStore, patchStore, setStore } from '../storage'
import { now,uuid } from './utils'

export function getPatients(): Patient[] {
  return getStore().patients
}

export function getPatient(id: string): Patient | undefined {
  return getStore().patients.find((p) => p.id === id)
}

export function createPatient(
  data: Pick<Patient, 'displayName' | 'personalNumber' | 'dateOfBirth'>,
): Patient {
  const state = getStore()
  const patient: Patient = {
    id: uuid(),
    displayName: data.displayName,
    personalNumber: data.personalNumber,
    dateOfBirth: data.dateOfBirth,
    createdAt: now(),
  }
  setStore({ ...state, patients: [...state.patients, patient] })
  return patient
}

export function patientOpenedApp(patientId: string): Patient {
  const updated = patchStore((s) => ({
    ...s,
    patients: s.patients.map((p) => (p.id === patientId ? { ...p, lastOpenedAt: now() } : p)),
  }))
  return updated.patients.find((p) => p.id === patientId)!
}
