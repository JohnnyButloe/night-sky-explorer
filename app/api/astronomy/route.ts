import { type NextRequest, NextResponse } from 'next/server';

const ASTRONOMY_API_URL = 'https://api.astronomyapi.com/api/v2';
const ASTRONOMY_API_KEY = process.env.NEXT_PUBLIC_ASTRONOMY_API_KEY;
const ASTRONOMY_API_SECRET = process.env.ASTRONOMY_API_SECRET;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latitude = searchParams.get('latitude');
  const longitude = searchParams.get('longitude');
  const timeOption = searchParams.get('time');

  if (!latitude || !longitude || !timeOption) {
    return NextResponse.json(
      { error: 'Latitude, longitude, and time are required' },
      { status: 400 },
    );
  }

  const now = new Date();
  let date = now.toISOString().split('T')[0];
  let time = now.toISOString().split('T')[1].split('.')[0];

  if (timeOption === 'tonight') {
    now.setHours(21, 0, 0, 0); // Set to 9 PM
    date = now.toISOString().split('T')[0];
    time = now.toISOString().split('T')[1].split('.')[0];
  }

  const apiUrl = `${ASTRONOMY_API_URL}/bodies/positions?latitude=${latitude}&longitude=${longitude}&from_date=${date}&to_date=${date}&time=${time}&elevation=1`;

  console.log('Fetching data from:', apiUrl);

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization:
          'Basic ' + btoa(`${ASTRONOMY_API_KEY}:${ASTRONOMY_API_SECRET}`),
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from Astronomy API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch celestial data' },
      { status: 500 },
    );
  }
}
