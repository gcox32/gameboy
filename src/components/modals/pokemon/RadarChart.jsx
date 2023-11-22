import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const RadarChart = ({ stats, chartTitle }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null); // Store the chart instance

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: Object.keys(stats),
                datasets: [{
                    label: chartTitle,
                    data: Object.values(stats),
                    fill: true,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgb(255, 99, 132)',
                    pointBackgroundColor: 'rgb(255, 99, 132)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(255, 99, 132)'
                }]
            },
            options: {
                elements: {
                    line: {
                        borderWidth: 3
                    }
                }
            }
        });
    }, [stats, chartTitle]);

    return <canvas ref={chartRef}></canvas>;
};

export default RadarChart;
