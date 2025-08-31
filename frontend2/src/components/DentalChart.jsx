import React, { useState, useRef, useEffect } from 'react';
import './DentalChart.css';

const DentalChart = ({ selectedTeeth, setSelectedTeeth }) => {
  const chartRef = useRef(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (chartRef.current) {
        setChartDimensions({
          width: chartRef.current.offsetWidth,
          height: chartRef.current.offsetHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const toothWidth = chartDimensions.width / 16; // 16 positions horizontales
  const toothHeight = chartDimensions.height / 6; // 6 rangées pour espacement

  const toggleTooth = (id) => {
    setSelectedTeeth((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  // Positions des dents selon la norme FDI (11-18, 21-28, 31-38, 41-48) avec courbure
  const teethLayout = [
    // Arcade supérieure droite (11-18)
    { id: 11, x: 0, y: 1.2, arcY: -0.2 },
    { id: 12, x: 1, y: 1.1, arcY: -0.15 },
    { id: 13, x: 2, y: 1.0, arcY: -0.1 },
    { id: 14, x: 3, y: 1.0, arcY: -0.05 },
    { id: 15, x: 4, y: 1.0, arcY: 0 },
    { id: 16, x: 5, y: 1.0, arcY: 0.05 },
    { id: 17, x: 6, y: 1.1, arcY: 0.1 },
    { id: 18, x: 7, y: 1.2, arcY: 0.15 },
    // Arcade supérieure gauche (21-28)
    { id: 21, x: 8, y: 1.2, arcY: 0.15 },
    { id: 22, x: 9, y: 1.1, arcY: 0.1 },
    { id: 23, x: 10, y: 1.0, arcY: 0.05 },
    { id: 24, x: 11, y: 1.0, arcY: 0 },
    { id: 25, x: 12, y: 1.0, arcY: -0.05 },
    { id: 26, x: 13, y: 1.1, arcY: -0.1 },
    { id: 27, x: 14, y: 1.2, arcY: -0.15 },
    { id: 28, x: 15, y: 1.3, arcY: -0.2 },
    // Arcade inférieure gauche (31-38)
    { id: 31, x: 0, y: 4.8, arcY: 0.2 },
    { id: 32, x: 1, y: 4.9, arcY: 0.15 },
    { id: 33, x: 2, y: 5.0, arcY: 0.1 },
    { id: 34, x: 3, y: 5.0, arcY: 0.05 },
    { id: 35, x: 4, y: 5.0, arcY: 0 },
    { id: 36, x: 5, y: 5.0, arcY: -0.05 },
    { id: 37, x: 6, y: 4.9, arcY: -0.1 },
    { id: 38, x: 7, y: 4.8, arcY: -0.15 },
    // Arcade inférieure droite (41-48)
    { id: 41, x: 8, y: 4.8, arcY: -0.15 },
    { id: 42, x: 9, y: 4.9, arcY: -0.1 },
    { id: 43, x: 10, y: 5.0, arcY: -0.05 },
    { id: 44, x: 11, y: 5.0, arcY: 0 },
    { id: 45, x: 12, y: 5.0, arcY: 0.05 },
    { id: 46, x: 13, y: 4.9, arcY: 0.1 },
    { id: 47, x: 14, y: 4.8, arcY: 0.15 },
    { id: 48, x: 15, y: 4.7, arcY: 0.2 },
  ];

  return (
    <div className="dental-chart-container" ref={chartRef} style={{ position: 'relative' }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 16 6"
        preserveAspectRatio="xMidYMid meet"
      >
        {teethLayout.map((tooth) => (
          <g
            key={tooth.id}
            transform={`translate(${tooth.x}, ${tooth.y + tooth.arcY})`}
            onClick={() => toggleTooth(tooth.id)}
            className={selectedTeeth.includes(tooth.id) ? 'selected' : ''}
          >
            <path
              d="M 0.3 0.1 C 0.2 0.3, 0.4 0.5, 0.5 0.5 C 0.6 0.5, 0.8 0.3, 0.7 0.1 C 0.6 0.0, 0.4 0.0, 0.3 0.1 Z"
              fill={selectedTeeth.includes(tooth.id) ? 'rgba(255, 0, 0, 0.6)' : 'rgba(255, 245, 230, 0.9)'}
              stroke="black"
              strokeWidth="0.05"
            />
            <path
              d="M 0.35 0.2 L 0.45 0.4 L 0.55 0.2 L 0.65 0.4 L 0.75 0.2 Z"
              fill={selectedTeeth.includes(tooth.id) ? 'yellow' : 'black'}
              transform="scale(0.4) translate(0.2, 0.1)"
            />
            <text
              x="0.5"
              y="0.8" // Déplacé en bas (y=0.8 au lieu de 0.5)
              textAnchor="middle"
              dominantBaseline="middle"
              fill={selectedTeeth.includes(tooth.id) ? 'white' : 'black'}
              fontSize="0.3"
              fontWeight="bold"
            >
              {tooth.id}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default DentalChart;