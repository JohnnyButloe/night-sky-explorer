// app/api/location-search/route.ts

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { error: 'Missing query parameter' },
      { status: 400 },
    );
  }

  try {
    // countrycodes=us restricts results to the United States
    // limit=10 can help limit the number of returned suggestions
    const url =
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&` +
      `format=json&` +
      `countrycodes=us&` +
      `limit=10`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch locations');
    const data = await res.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
