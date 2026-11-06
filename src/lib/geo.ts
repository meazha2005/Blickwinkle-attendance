export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  // Tier 1: OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "BlickwinkleAttendanceApp/2.0 (contact@blickwinkle.com)",
        "Accept-Language": "en",
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name && typeof data.display_name === "string") {
        return data.display_name;
      }
    }
  } catch {
    // Continue to Tier 2
  }

  // Tier 2: BigDataCloud Reverse Geocode API (fast, reliable, specifically for client coordinates)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const parts: string[] = [];
      if (data.locality) parts.push(data.locality);
      if (data.city && data.city !== data.locality) parts.push(data.city);
      if (data.principalSubdivision) parts.push(data.principalSubdivision);
      if (data.postcode) parts.push(data.postcode);
      if (data.countryName) parts.push(data.countryName);

      if (parts.length > 0) {
        return parts.join(", ");
      }
    }
  } catch {
    // Continue to Tier 3
  }

  // Tier 3: Photon Komoot OSM Reverse Geocode API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const feat = data?.features?.[0]?.properties;
      if (feat) {
        const parts = [feat.name, feat.street, feat.district, feat.city, feat.state, feat.country].filter(Boolean);
        if (parts.length > 0) {
          return parts.join(", ");
        }
      }
    }
  } catch {
    // Fallback
  }

  return `Coordinates: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}
