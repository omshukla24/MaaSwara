// =============================================================================
// MaaSwara — Clinic Matcher (Haversine Distance)
// Spec: §5 — clinic matching component
//
// Finds the nearest partner clinic based on latitude/longitude.
// Uses seed data initially; will be replaced with Supabase queries in Phase 2.
// =============================================================================

import { PartnerClinic } from '@/lib/types';
import partnerClinics from '@/seed/partner-clinics.json';

/**
 * Earth's radius in kilometers
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate the Haversine distance between two points on Earth.
 *
 * @param lat1 - Latitude of point 1
 * @param lng1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lng2 - Longitude of point 2
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Find the nearest partner clinics to a given location using Supabase.
 *
 * @param lat - User's latitude
 * @param lng - User's longitude
 * @param count - Number of clinics to return (default: 3)
 * @returns Array of nearest clinics, sorted by distance (closest first)
 */
export async function findNearestClinics(
  lat: number,
  lng: number,
  count: number = 3
): Promise<PartnerClinic[]> {
  const { getServiceSupabase } = await import('@/lib/supabase/client');
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('partner_clinics')
    .select('*')
    .eq('active', true);

  if (error || !data) {
    console.error('[MaaSwara] Error fetching clinics for matching:', error);
    return [];
  }

  const clinics: PartnerClinic[] = (data as PartnerClinic[])
    .map((clinic) => ({
      ...clinic,
      distance_km: Math.round(
        haversineDistance(lat, lng, clinic.lat, clinic.lng) * 10
      ) / 10,
    }))
    .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));

  return clinics.slice(0, count);
}

/**
 * Get a single nearest clinic (convenience wrapper).
 */
export async function findNearestClinic(
  lat: number,
  lng: number
): Promise<PartnerClinic | null> {
  const results = await findNearestClinics(lat, lng, 1);
  return results[0] ?? null;
}
