// /node-api/utils/nominatimClient.js

import fetch from 'node-fetch';

const BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'NightSkyExplorer/1.0 (jbutl007@outlook.com)';

// Exported function #1: Geocode address
export async function geocodeAddress(q, limit = 5) {
  const params = new URLSearchParams({ format: 'json', q, limit });
  const url = `${BASE_URL}/search?${params.toString()}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Geocode failed: ${res.status}`);
  }
  return res.json();
}

// Exported function #2: Reverse geocode coords
export async function reverseGeocode(lat, lon) {
  const params = new URLSearchParams({
    format: 'json',
    lat,
    lon,
    addressdetails: 1,
  });
  const url = `${BASE_URL}/reverse?${params.toString()}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Reverse geocode failed: ${res.status}`);
  }
  return res.json();
}
