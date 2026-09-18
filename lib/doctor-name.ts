import "server-only"
import { doctorDisplayName, doctorDisplayNames } from "@/lib/demo/store"

/**
 * Single source of truth for how a doctor's name is displayed in the UI.
 *
 * Uses the shortest "status = 'doctor'" source label for this master_id,
 * verbatim — no parsing, no reformatting. Falls back to "#<master_id>".
 */
export async function getDoctorDisplayName(masterId: string): Promise<string> {
  return doctorDisplayName(masterId)
}

/**
 * Batched variant of {@link getDoctorDisplayName} — one pass instead of N
 * lookups. Use for tables, selects, and other lists of doctors.
 */
export async function getDoctorDisplayNames(masterIds: string[]): Promise<Map<string, string>> {
  return doctorDisplayNames(masterIds)
}
