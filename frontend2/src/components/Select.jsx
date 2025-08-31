import React from "react"

export default function Select({ label, value, onChange, options = [], ...props }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      {label && <label style={{ display: "block", marginBottom: "4px" }}>{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
        style={{
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          width: "100%"
        }}
      >
        <option value="">-- Sélectionnez --</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
