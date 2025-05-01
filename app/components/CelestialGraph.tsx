// app/components/CelestialGraph.tsx
'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { parseDate } from '@/app/utils/dateUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

interface HourlyData {
  time: Date | string; // allow strings from the API
  altitude: number;
  azimuth: number;
}

interface CelestialGraphProps {
  hourlyData: HourlyData[];
  currentTime: Date | string;
}

export default function CelestialGraph({
  hourlyData,
  currentTime,
}: CelestialGraphProps) {
  // Normalize currentTime to a Date
  const currentDate =
    currentTime instanceof Date ? currentTime : parseDate(currentTime);

  // Build an array of just the altitudes
  const altitudeData = hourlyData.map((point) => point.altitude);

  // Find the index matching currentDate
  const currentIndex = hourlyData.findIndex((d) => {
    const t = d.time instanceof Date ? d.time : parseDate(d.time);
    return t.getTime() === currentDate.getTime();
  });

  const fallbackIndex = currentIndex >= 0 ? currentIndex : 0;

  // Highlight only that one point
  const highlightData = altitudeData.map((val, i) =>
    i === fallbackIndex ? val : null,
  );

  const chartData = {
    labels: altitudeData.map((_, i) => i.toString()),
    datasets: [
      {
        data: altitudeData,
        borderColor: '#ffffff',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        data: highlightData,
        borderColor: 'transparent',
        backgroundColor: '#ffcc00',
        pointRadius: 6,
        pointBackgroundColor: '#ffcc00',
        showLine: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: {
        display: false,
        min: 0,
        max: 90,
      },
    },
  };

  return (
    <div className="w-full h-16">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}
