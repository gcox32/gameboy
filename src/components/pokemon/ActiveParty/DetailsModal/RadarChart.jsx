import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const RadarChart = ({ labels, values, max, color }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        const chart = new Chart(chartRef.current.getContext('2d'), {
            type: 'radar',
            data: {
                labels,
                datasets: [{
                    data: values,
                    fill: true,
                    backgroundColor: `${color}33`,
                    borderColor: color,
                    borderWidth: 2,
                    pointBackgroundColor: color,
                    pointBorderColor: '#fff',
                }]
            },
            options: {
                scales: {
                    r: {
                        min: 0,
                        max, // A fixed scale keeps shapes comparable between Pokémon
                        angleLines: { color: 'rgba(255, 255, 255, 0.2)' },
                        grid: { color: 'rgba(255, 255, 255, 0.2)' },
                        ticks: { display: false },
                        pointLabels: {
                            color: '#e8e0f4',
                            font: { family: 'gameboy', size: 8 }
                        },
                    }
                },
                plugins: {
                    legend: { display: false }
                },
            }
        });

        return () => chart.destroy();
    }, [labels, values, max, color]);

    return <canvas ref={chartRef}></canvas>;
};

export default RadarChart;
