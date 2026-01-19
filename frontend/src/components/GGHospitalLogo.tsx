import React from 'react';

interface GGHospitalLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function GGHospitalLogo({ className = '', width = 200, height = 120 }: GGHospitalLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Heart/Stethoscope Shape */}
      <g>
        {/* Heart shape outline */}
        <path
          d="M100 85 C100 85, 60 55, 60 40 C60 28, 68 20, 75 20 C82 20, 90 25, 100 35 C110 25, 118 20, 125 20 C132 20, 140 28, 140 40 C140 55, 100 85, 100 85 Z"
          stroke="#DC2626"
          strokeWidth="3"
          fill="none"
        />
        {/* Stethoscope extension */}
        <path
          d="M140 40 Q150 30, 155 25 L160 20"
          stroke="#DC2626"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Stethoscope earpiece circle */}
        <circle
          cx="160"
          cy="20"
          r="8"
          stroke="#DC2626"
          strokeWidth="3"
          fill="none"
        />
      </g>

      {/* Caduceus Symbol Inside Heart */}
      <g transform="translate(100, 45)">
        {/* Staff */}
        <line
          x1="0"
          y1="-15"
          x2="0"
          y2="25"
          stroke="#F59E0B"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Wings */}
        <path
          d="M0 -15 Q-8 -20, -8 -12 Q-8 -8, -5 -8 Q-8 -8, -8 -4 Q-8 4, 0 -1 M0 -15 Q8 -20, 8 -12 Q8 -8, 5 -8 Q8 -8, 8 -4 Q8 4, 0 -1"
          stroke="#10B981"
          strokeWidth="2"
          fill="none"
        />
        {/* Left Snake */}
        <path
          d="M0 -5 Q-10 0, -12 8 Q-10 15, 0 18"
          stroke="#10B981"
          strokeWidth="2.5"
          fill="none"
        />
        {/* Right Snake */}
        <path
          d="M0 -5 Q10 0, 12 8 Q10 15, 0 18"
          stroke="#10B981"
          strokeWidth="2.5"
          fill="none"
        />
      </g>

      {/* GG HOSPITAL Text */}
      <text
        x="100"
        y="105"
        textAnchor="middle"
        fill="#DC2626"
        fontSize="20"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
        letterSpacing="2px"
      >
        GG HOSPITAL
      </text>
      
      {/* Underline */}
      <line
        x1="30"
        y1="110"
        x2="170"
        y2="110"
        stroke="#DC2626"
        strokeWidth="1.5"
      />
    </svg>
  );
}

