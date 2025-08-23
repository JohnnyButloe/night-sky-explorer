// /node-api/utils/nominatimClient.js

import fetch from 'node-fetch';

// Allow the base URL to be overridden (useful for tests).
const BASE_URL =
  process.env.GEOCODE_API_BASE || 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'NightSkyExplorer/1.0 (jbutl007@outlook.com)';

/**
 * Geocide a free-form query with optional filters.
 * opts: { featureType?: 'country' |'state'|'city'|'settlement', countrycodes?: string, adressdetails?: boolean }
 * See: https://nominatim.org/release-docs/latest/api/Search/
 */
export async function geocodeAddress(q, limit = 5, opts = {}) {
  const params = new URLSearchParams({
    format: 'json',
    q,
    limit: String(limit),
  });
  if (opts.featureType) params.set('featureType', opts.featureType);
  if (opts.countrycodes) params.set('countrycodes', opts.countrycodes);
  if (opts.addressdetails) params.set('addressdetails', '1');
  const url = `${BASE_URL}/search?${params.toString()}`;

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const error = new Error(
      `Geocode failed: ${res.status} ${res.statusText} ${text || ''}`.trim(),
    );
    error.response = { status: res.status, body: text };
    throw error;
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
    const error = new Error(`Reverse geocode failed: ${res.status}`);
    error.response = { status: res.status };
    throw error;
  }
  return res.json();
}

/**
 * Structured search (postalcode, city, state, country, street, etc.).
 * NOTE: Cannot be combined with q= per docs.
 * params: { postalcode?, city?, county?, state?, country?, street? }
 * opts:   { featureType?, countrycodes?, addressdetails? }
 * See: https://nominatim.org/release-docs/latest/api/Search/ (Structured query)
 */

export async function geocodeStructured(paramsObj = {}, limit = 5, opts = {}) {
  const params = new URLSearchParams({
    format: 'json',
    limit: String(limit),
  });
  for (const k of [
    'postalcode',
    'city',
    'county',
    'state',
    'country',
    'street',
  ]) {
    if (paramsObj[k]) params.set(k, String(paramsObj[k]));
  }
  if (opts.featureType) params.set('featureType', opts.featureType);
  if (opts.countrycodes) params.set('countrycodes', opts.countrycodes);
  if (opts.addressdetails) params.set('addressdetails', '1');
  const url = `${BASE_URL}/search?${params.toString()}`;

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const error = new Error(
      `Structured geocode failed: ${res.status} ${res.statusText} ${text || ''}`.trim(),
    );
    error.response = { status: res.status, body: text };
    throw error;
  }
  return res.json();
}
