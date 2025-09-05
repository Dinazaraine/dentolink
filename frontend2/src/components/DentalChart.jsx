import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./DentalChart.css";

const DentalChart = ({
  selectedUpper = [],
  selectedLower = [],
  setSelectedUpper,
  setSelectedLower,
}) => {
  const chartRef = useRef(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });

  // ✅ États internes pour garder la couleur stable
  const [upper, setUpper] = useState(Array.isArray(selectedUpper) ? selectedUpper : []);
  const [lower, setLower] = useState(Array.isArray(selectedLower) ? selectedLower : []);

  // 🔄 Synchroniser avec props quand ça change
  useEffect(() => {
    if (Array.isArray(selectedUpper)) setUpper(selectedUpper);
  }, [selectedUpper]);

  useEffect(() => {
    if (Array.isArray(selectedLower)) setLower(selectedLower);
  }, [selectedLower]);

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
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // ✅ Toggle avec état interne
  const toggleTooth = (id, zone) => {
    if (zone === "upper") {
      const updated = upper.includes(id) ? upper.filter((t) => t !== id) : [...upper, id];
      setUpper(updated);
      setSelectedUpper?.(updated); // prop vers parent
    } else {
      const updated = lower.includes(id) ? lower.filter((t) => t !== id) : [...lower, id];
      setLower(updated);
      setSelectedLower?.(updated); // prop vers parent
    }
  };

  // Positions hautes et basses (FDI)
  const upperTeethLayout = [
    { id: 18, x: 0, y: 1.2 }, { id: 17, x: 1, y: 1.1 },
    { id: 16, x: 2, y: 1.0 }, { id: 15, x: 3, y: 1.0 },
    { id: 14, x: 4, y: 1.0 }, { id: 13, x: 5, y: 1.0 },
    { id: 12, x: 6, y: 1.1 }, { id: 11, x: 7, y: 1.2 },
    { id: 21, x: 8, y: 1.2 }, { id: 22, x: 9, y: 1.1 },
    { id: 23, x: 10, y: 1.0 }, { id: 24, x: 11, y: 1.0 },
    { id: 25, x: 12, y: 1.0 }, { id: 26, x: 13, y: 1.0 },
    { id: 27, x: 14, y: 1.1 }, { id: 28, x: 15, y: 1.2 },
  ];

  const lowerTeethLayout = [
    { id: 48, x: 0, y: 4.8 }, { id: 47, x: 1, y: 4.9 },
    { id: 46, x: 2, y: 5.0 }, { id: 45, x: 3, y: 5.0 },
    { id: 44, x: 4, y: 5.0 }, { id: 43, x: 5, y: 5.0 },
    { id: 42, x: 6, y: 4.9 }, { id: 41, x: 7, y: 4.8 },
    { id: 31, x: 8, y: 4.8 }, { id: 32, x: 9, y: 4.9 },
    { id: 33, x: 10, y: 5.0 }, { id: 34, x: 11, y: 5.0 },
    { id: 35, x: 12, y: 5.0 }, { id: 36, x: 13, y: 5.0 },
    { id: 37, x: 14, y: 4.9 }, { id: 38, x: 15, y: 4.8 },
  ];

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-primary text-white">🦷 Sélection des dents (FDI)</div>
      <div className="card-body">
        <div
          ref={chartRef}
          className="dental-chart-container border rounded bg-light"
          style={{ position: "relative", height: "300px" }}
        >
          <svg width="100%" height="100%" viewBox="0 0 16 6" preserveAspectRatio="xMidYMid meet">
            {/* Haut */}
            {upperTeethLayout.map((tooth) => (
              <g
                key={tooth.id}
                transform={`translate(${tooth.x}, ${tooth.y})`}
                onClick={() => toggleTooth(tooth.id, "upper")}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx="0.5"
                  cy="0.5"
                  r="0.4"
                  fill={upper.includes(tooth.id) ? "rgba(255, 0, 0, 0.6)" : "white"}
                  stroke="black"
                  strokeWidth="0.05"
                />
                <text
                  x="0.5"
                  y="0.5"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={upper.includes(tooth.id) ? "white" : "black"}
                  fontSize="0.3"
                >
                  {tooth.id}
                </text>
              </g>
            ))}

            {/* Bas */}
            {lowerTeethLayout.map((tooth) => (
              <g
                key={tooth.id}
                transform={`translate(${tooth.x}, ${tooth.y})`}
                onClick={() => toggleTooth(tooth.id, "lower")}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx="0.5"
                  cy="0.5"
                  r="0.4"
                  fill={lower.includes(tooth.id) ? "rgba(0, 128, 255, 0.6)" : "white"}
                  stroke="black"
                  strokeWidth="0.05"
                />
                <text
                  x="0.5"
                  y="0.5"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={lower.includes(tooth.id) ? "white" : "black"}
                  fontSize="0.3"
                >
                  {tooth.id}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Résumé des dents sélectionnées */}
        <div className="mt-3">
          <h6>Résumé :</h6>
          <p>
            <strong>Haut :</strong> {upper.length > 0 ? upper.join(", ") : "aucune"}
          </p>
          <p>
            <strong>Bas :</strong> {lower.length > 0 ? lower.join(", ") : "aucune"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DentalChart;
