import type { ContactMode } from '@/api/schemas'

const MODE_TO_SEGMENT: Record<ContactMode, string> = {
  DIGITAL: 'digital',
  PHONE: 'phone',
  VISIT: 'visit',
  CLOSE: 'close',
}

const SEGMENT_TO_MODE: Record<string, ContactMode> = {
  digital: 'DIGITAL',
  phone: 'PHONE',
  visit: 'VISIT',
  close: 'CLOSE',
}

export function contactModeToRouteSegment(mode: ContactMode): string {
  return MODE_TO_SEGMENT[mode]
}

export function routeSegmentToContactMode(segment?: string): ContactMode | null {
  if (!segment) return null
  return SEGMENT_TO_MODE[segment.toLowerCase()] ?? null
}
