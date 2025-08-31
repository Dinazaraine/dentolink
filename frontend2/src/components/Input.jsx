// src/components/Input.jsx
import React from "react";

const Input = React.forwardRef(function Input(
  { style, ...props }, // accepte onChange, onBlur, name, id, type, etc.
  ref
) {
  return (
    <input
      ref={ref}
      {...props}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #ccc",
        ...(style || {}),
      }}
    />
  );
});

export default Input;
