'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import styles from './LiveLineChart.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LiveLineChartProps {
  data: number[];
  labels: string[];
  title: string;
  color: string;
  min?: number;
  max?: number;
}

export function LiveLineChart({ data, labels, title, color, min, max }: LiveLineChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data: data,
        borderColor: color,
        backgroundColor: `${color}20`, // 20% opacity for fill
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: color,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(15, 34, 54, 0.9)',
        titleColor: '#7aadcc',
        bodyColor: '#e2f0f9',
        borderColor: 'rgba(0, 212, 170, 0.2)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: false, // hide x-axis labels to look cleaner
        grid: { display: false }
      },
      y: {
        min: min,
        max: max,
        grid: {
          color: 'rgba(0, 212, 170, 0.05)',
        },
        ticks: {
          color: '#445d6e',
          font: { family: "'Space Mono', monospace", size: 10 }
        },
      },
    },
    animation: {
      duration: 0, // disable animation for real-time smoothness
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  return (
    <div className={styles.container}>
      <Line data={chartData} options={options} />
    </div>
  );
}
