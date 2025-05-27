import React, { useState } from "react";

export default function Tooltip({ content }) {
  const [show, setShow] = useState(false);

  return (
    <span
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0}
    >
      <span
        style={{
          display: "inline-block",
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#e5e7eb",
          color: "#333",
          fontWeight: "bold",
          fontSize: 13,
          textAlign: "center",
          lineHeight: "18px",
          border: "1px solid #ccc",
          marginLeft: 4,
          cursor: "pointer",
        }}
      >
        ?
      </span>
      {show && (
        <span
          style={{
            position: "absolute",
            left: "50%",
            bottom: "120%",
            transform: "translateX(-50%)",
            background: "#222",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 6,
            whiteSpace: "pre-line",
            zIndex: 100,
            minWidth: 260,
            fontSize: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            textAlign: "left",
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}