"use client";

import { useState } from "react";

export default function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);

  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        marginLeft: "6px",
        cursor: "pointer",
      }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {/* "i" icon */}
      <span
        style={{
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: "#374151",
          color: "#9ca3af",
          fontSize: "11px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
        }}
      >
        i
      </span>

      {/* Tooltip */}
      {show && (
        <div
          style={{
            position: "absolute",
            bottom: "125%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#111827",
            color: "#e5e7eb",
            padding: "8px 10px",
            borderRadius: "6px",
            fontSize: "12px",
            whiteSpace: "nowrap",
            zIndex: 50,
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
}