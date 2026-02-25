import * as service from '../service'
import type { Patient } from '../schemas'
import { withDelay } from './delay'

export const getPatients = (): Promise<Patient[]> => withDelay(() => service.getPatients())

export const getPatient = (id: string): Promise<Patient | undefined> =>
  withDelay(() => service.getPatient(id))

export const patientOpenedApp = (patientId: string): Promise<Patient> =>
  withDelay(() => service.patientOpenedApp(patientId))
