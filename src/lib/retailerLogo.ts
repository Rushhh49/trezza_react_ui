import { API_CONFIG, getAuthHeaders } from '@/config/api';

/**
 * Fetch the first user id for a given retailer_id that has a non-empty company.
 */
export async function fetchUserIdByRetailerId(retailerId: number): Promise<number | null> {
  try {
    const filter = encodeURIComponent(JSON.stringify({
      $and: [
        { $and: [ { retailer_id: { $eq: retailerId } } ] },
        { $and: [ { company: { $notEmpty: true } } ] }
      ]
    }));

    const url = `${API_CONFIG.BASE_URL}/api/users:list?pageSize=20&sort[]=-updatedAt&appends[]=createdBy&page=1&filter=${filter}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) return null;
    const json = await res.json();
    const first = Array.isArray(json?.data) ? json.data[0] : null;
    return first?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Given a user id (from users:list), fetch the retailer logo url if present.
 * Returns an absolute url or null if not found.
 */
export async function fetchRetailerLogoUrlByUserId(userId: number): Promise<string | null> {
  try {
    const url = `${API_CONFIG.BASE_URL}/api/users:get?filterByTk=${encodeURIComponent(String(userId))}&appends[]=createdBy`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) return null;
    const json = await res.json();
    const logoArr = json?.data?.retailer_logo;
    const relUrl: string | undefined = Array.isArray(logoArr) && logoArr[0]?.url ? logoArr[0].url : undefined;
    if (!relUrl) return null;
    // Ensure absolute url
    return relUrl.startsWith('http') ? relUrl : `${API_CONFIG.BASE_URL}${relUrl}`;
  } catch {
    return null;
  }
}

/**
 * Convenience: given a retailer_id, fetch an absolute logo URL if available.
 */
export async function fetchRetailerLogoUrl(retailerId?: number | null): Promise<string | null> {
  if (!retailerId && retailerId !== 0) return null;
  const userId = await fetchUserIdByRetailerId(retailerId as number);
  if (!userId) return null;
  return await fetchRetailerLogoUrlByUserId(userId);
}


