"use client";
import React, { useState } from "react";

export default function Paper() {
  const [isChecked, setIsChecked] = useState(false);

  const handleChange = () => {
    setIsChecked(!isChecked);
  };

  return (
    <>
      <div className="toggle">
        <input type="checkbox" id="btn" checked={isChecked} onChange={handleChange} />
        <label htmlFor="btn">
          <span className="thumb"></span>
        </label>
        <div className={`light ${isChecked ? "on" : ""}`}></div>
      </div>

      <style jsx>{`
        body {
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white; /* Temporary to ensure visibility */
        }
        .toggle {
          position: relative;
          width: 200px;
          height: 100px;
          background-color: lightgray; /* Add background for visibility */
        }
        .thumb {
          width: 80px;
          height: 80px;
          background-color: red;
        }
      `}</style>
    </>
  );
}
