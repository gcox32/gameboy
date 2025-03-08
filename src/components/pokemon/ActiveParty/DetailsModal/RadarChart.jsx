import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const RadarChart = ({ stats, chartTitle }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: Object.keys(stats).map(key => key.toUpperCase()).reverse(),
                datasets: [{
                    label: chartTitle,
                    data: Object.values(stats).reverse(),
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
                scales: {
                    r: {
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.2)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.2)'
                        },
                        ticks: {
                            display: false // This removes the numbers
                        },
                        pointLabels: {
                            color: '#fff',
                            font: {
                                size: 12
                            }
                        },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false // This removes the legend
                    }
                },
                elements: {
                    line: {
                        borderWidth: 2
                    }
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [stats, chartTitle]);

    return <canvas ref={chartRef} style={{ transform: 'rotateY(180deg)' }}></canvas>;
};

export default RadarChart;
