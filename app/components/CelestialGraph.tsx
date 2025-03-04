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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

interface HourlyData {
  time: Date;
  altitude: number;
  azimuth: number;
}

interface CelestialGraphProps {
  hourlyData: HourlyData[];
  currentTime: Date;
}

export default function CelestialGraph({
  hourlyData,
  currentTime,
}: CelestialGraphProps) {
  // Convert each hour’s altitude into a data point (index-based).
  const altitudeData = hourlyData.map((data) => data.altitude);

  // Find the index corresponding to currentTime.
  const currentIndex = hourlyData.findIndex(
    (d) => d.time.getTime() === currentTime.getTime(),
  );
  // If no exact match, fallback to 0.
  const fallbackIndex = currentIndex >= 0 ? currentIndex : 0;

  // Highlight dataset: single point at the current index.
  const highlightData = altitudeData.map((val, i) =>
    i === fallbackIndex ? val : null,
  );

  const chartData = {
    labels: altitudeData.map((_, i) => i.toString()),
    datasets: [
      {
        // Main altitude line
        data: altitudeData,
        borderColor: '#ffffff',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        // Single point representing the current time
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
        max: 90, // altitude range
      },
    },
  };

  return (
    <div className="w-full h-16">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}
