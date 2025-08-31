import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

export default function UserOnlineDot({ online, size = 12 }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`relative inline-block rounded-full ${
          online ? "bg-green-500" : "bg-gray-400"
        }`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
        }}
      >
        {online && (
          <span
            className="absolute inset-0 rounded-full bg-green-400 opacity-70 animate-ping"
            style={{ zIndex: -1 }}
          />
        )}
      </span>
      <span
        className={`text-xs font-medium ${
          online ? "text-green-600" : "text-gray-500"
        }`}
      >
        {online ? "En ligne" : "Hors ligne"}
      </span>
      {online ? (
        <CheckCircle size={16} className="text-green-500" />
      ) : (
        <XCircle size={16} className="text-gray-400" />
      )}
    </div>
  );
}
