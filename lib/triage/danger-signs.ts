// =============================================================================
// MaaSwara — WHO Antenatal Danger Signs (Encoded)
// Reference: WHO recommendations on antenatal care (2016, updated 2022)
// Spec: §5.1
// =============================================================================

import { DangerSign, DangerSignId, Severity } from '@/lib/types';

/**
 * Complete WHO danger-sign table.
 * D1–D10 are danger signs requiring clinical attention.
 * G1 is the "normal pregnancy discomfort" catch-all.
 */
export const DANGER_SIGNS: DangerSign[] = [
  {
    id: 'D1',
    name: 'Vaginal Bleeding',
    description: 'Any amount of vaginal bleeding during pregnancy',
    severity: 'RED',
    action: 'Go to clinic NOW',
  },
  {
    id: 'D2',
    name: 'Severe Headache with Vision Changes',
    description: 'Severe headache combined with blurred vision or seeing spots',
    severity: 'RED',
    action: 'Suspect preeclampsia → clinic NOW',
  },
  {
    id: 'D3',
    name: 'Convulsions / Fits',
    description: 'Any seizure, convulsion, fainting, or loss of consciousness',
    severity: 'RED',
    action: 'Emergency — clinic NOW',
  },
  {
    id: 'D4',
    name: 'High Fever',
    description: 'Fever above 38°C (100.4°F)',
    severity: 'RED',
    action: 'Clinic same day',
  },
  {
    id: 'D5',
    name: 'Severe Abdominal Pain',
    description: 'Severe or persistent pain in the abdomen',
    severity: 'RED',
    action: 'Clinic NOW',
  },
  {
    id: 'D6',
    name: 'Reduced / Absent Fetal Movement',
    description: 'Fewer than 10 movements in 2 hours after 28 weeks of pregnancy',
    severity: 'RED',
    action: 'Clinic same day',
  },
  {
    id: 'D7',
    name: 'Swelling of Face or Hands',
    description: 'Unusual swelling of face, hands, or sudden weight gain',
    severity: 'YELLOW',
    action: 'Check blood pressure — likely preeclampsia. Clinic within 24h.',
  },
  {
    id: 'D8',
    name: 'Difficulty Breathing',
    description: 'Shortness of breath or difficulty breathing at rest',
    severity: 'RED',
    action: 'Clinic NOW',
  },
  {
    id: 'D9',
    name: 'Water Breaking Before 37 Weeks',
    description: 'Leaking of amniotic fluid (water breaking) before 37 weeks',
    severity: 'RED',
    action: 'Clinic NOW',
  },
  {
    id: 'D10',
    name: 'Severe Persistent Vomiting',
    description: 'Vomiting that won\'t stop, unable to keep food or water down',
    severity: 'YELLOW',
    action: 'Clinic same day, hydrate immediately',
  },
  {
    id: 'G1',
    name: 'Normal Pregnancy Discomfort',
    description: 'Mild nausea, fatigue, normal aches, mild swelling of feet',
    severity: 'GREEN',
    action: 'Reassure + general advice (rest, hydration, nutrition)',
  },
];

/**
 * Quick lookup map: sign ID → DangerSign object
 */
export const DANGER_SIGN_MAP: Record<DangerSignId, DangerSign> = Object.fromEntries(
  DANGER_SIGNS.map((sign) => [sign.id, sign])
) as Record<DangerSignId, DangerSign>;

/**
 * Get all RED danger signs
 */
export function getRedSigns(): DangerSign[] {
  return DANGER_SIGNS.filter((s) => s.severity === 'RED');
}

/**
 * Get all YELLOW danger signs
 */
export function getYellowSigns(): DangerSign[] {
  return DANGER_SIGNS.filter((s) => s.severity === 'YELLOW');
}

/**
 * Given a list of sign IDs, return the highest severity.
 * Priority: RED > YELLOW > GREEN
 */
export function getHighestSeverity(signIds: DangerSignId[]): Severity {
  if (signIds.length === 0) return 'GREEN';

  const severities = signIds.map((id) => DANGER_SIGN_MAP[id]?.severity ?? 'GREEN');

  if (severities.includes('RED')) return 'RED';
  if (severities.includes('YELLOW')) return 'YELLOW';
  return 'GREEN';
}
