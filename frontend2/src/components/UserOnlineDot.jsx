import React from "react";
import { CheckCircle, XCircle } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

export default function UserOnlineDot({ online, size = 12 }) {
  return (
    <div className="d-flex align-items-center gap-2">
      {/* Pastille en ligne / hors ligne */}
      <span
        className={`rounded-circle border ${
          online ? "bg-success border-success" : "bg-secondary border-secondary"
        }`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          display: "inline-block",
        }}
      ></span>

      {/* Texte état */}
      <span
        className={`fw-semibold small ${
          online ? "text-success" : "text-muted"
        }`}
      >
        {online ? "En ligne" : "Hors ligne"}
      </span>

      {/* Icône état */}
      {online ? (
        <CheckCircle size={16} className="text-success" />
      ) : (
        <XCircle size={16} className="text-secondary" />
      )}
    </div>
  );
}
