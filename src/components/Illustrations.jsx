import React from 'react';


export const ConciergeIllustration = ({ className }) => (
  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Abstract background elements */}
    <circle cx="200" cy="150" r="120" fill="currentColor" fillOpacity="0.03" />
    <rect x="50" y="50" width="300" height="200" rx="40" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />

    {/* Central "Matching" Motif */}
    <g className="animate-pulse-slow">
      <rect x="120" y="100" width="60" height="80" rx="12" fill="white" stroke="currentColor" strokeWidth="2" />
      <rect x="220" y="100" width="60" height="80" rx="12" fill="white" stroke="currentColor" strokeWidth="2" />

      {/* Connector lines */}
      <path d="M180 140H220" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="200" cy="140" r="15" fill="var(--primary)" fillOpacity="0.1" />
      <path d="M195 140L200 145L205 135" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    {/* Floating badges */}
    <rect x="260" y="60" width="80" height="30" rx="15" fill="var(--primary)" />
    <text x="300" y="80" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">VERIFIED</text>

    <circle cx="80" cy="220" r="25" fill="var(--accent)" />
    <path d="M75 220L80 225L85 215" stroke="var(--accent-foreground)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const RoadmapIllustration = ({ className }) => (
  <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M40 100C120 100 160 50 200 50C240 50 280 150 360 150" stroke="currentColor" strokeWidth="2" strokeOpacity="0.1" />
    <circle cx="40" cy="100" r="8" fill="var(--primary)" />
    <circle cx="200" cy="50" r="10" fill="var(--primary)" className="animate-pulse" />
    <circle cx="360" cy="150" r="8" fill="var(--primary)" />
  </svg>
);

export const InteractiveRoadmap = ({ steps, className }) => (
  <svg viewBox="0 80 1300 650" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Soft Background Landscape - Realism touch */}
    <circle cx="200" cy="500" r="300" fill="oklch(0.72 0.14 195)" fillOpacity="0.05" />
    <circle cx="1000" cy="200" r="400" fill="oklch(0.24 0.04 230)" fillOpacity="0.04" />

    {/* The Winding Road - Extended for no overlaps */}
    <path
      d="M50 600C150 600 150 200 300 200C450 200 450 550 600 550C750 550 750 250 900 250C1050 250 1050 500 1150 500L1150 480"
      stroke="oklch(0.24 0.04 230)"
      strokeWidth="70"
      strokeLinecap="round"
    />
    {/* Road Stripes */}
    <path
      d="M50 600C150 600 150 200 300 200C450 200 450 550 600 550C750 550 750 250 900 250C1050 250 1050 500 1150 500"
      stroke="oklch(0.72 0.14 195)"
      strokeWidth="4"
      strokeDasharray="25 25"
      strokeLinecap="round"
    />

    {/* Map Pins and Labels */}
    {steps.map((s, i) => {
      const allPos = [
        { x: 50, y: 600, labelPos: 'right' },   // 1
        { x: 170, y: 450, labelPos: 'left' },    // 2
        { x: 230, y: 250, labelPos: 'right' },   // 3
        { x: 380, y: 200, labelPos: 'top' },     // 4
        { x: 520, y: 400, labelPos: 'left' },    // 5
        { x: 680, y: 550, labelPos: 'bottom' },  // 6
        { x: 820, y: 400, labelPos: 'right' },   // 7
        { x: 880, y: 250, labelPos: 'top' },     // 8
        { x: 1050, y: 350, labelPos: 'left' },   // 9
        { x: 1150, y: 500, labelPos: 'bottom' }, // 10
      ];

      // If we have 6 steps, pick 6 points along the road to avoid bunching at the start
      const sixStepIndices = [0, 2, 4, 6, 8, 9];
      const pos = steps.length === 6 ? allPos[sixStepIndices[i]] : allPos[i];

      if (!pos) return null;

      // Ensure labels don't overlap with pins or the final building
      const isLast = i === steps.length - 1;
      const actualLabelPos = isLast ? 'right' : pos.labelPos;

      return (
        <g key={i}>
          {/* Pin Shadow */}
          <circle cx={pos.x} cy={pos.y + 6} r="28" fill="black" fillOpacity="0.1" />
          {/* Pin Body */}
          <circle cx={pos.x} cy={pos.y} r="28" fill="oklch(0.72 0.14 195)" stroke="oklch(0.24 0.04 230)" strokeWidth="5" />
          <text x={pos.x} y={pos.y + 8} textAnchor="middle" fill="oklch(0.24 0.04 230)" fontSize="24" fontWeight="900">{i + 1}</text>

          {/* Label Container */}
          <g transform={`translate(${
            actualLabelPos === 'left' ? pos.x - 45 : actualLabelPos === 'right' ? pos.x + 45 : pos.x
          }, ${
            actualLabelPos === 'top' ? pos.y - 55 : actualLabelPos === 'bottom' ? pos.y + 65 : pos.y
          })`}>
            {/* White Background Glow for text */}
            <text
              textAnchor={actualLabelPos === 'left' ? 'end' : actualLabelPos === 'right' ? 'start' : 'middle'}
              fill="white"
              stroke="white"
              strokeWidth="10"
              strokeLinejoin="round"
              fontSize="20"
              fontWeight="900"
              className="uppercase tracking-tight"
            >
              {s.title}
            </text>
            {/* Real Text */}
            <text
              textAnchor={actualLabelPos === 'left' ? 'end' : actualLabelPos === 'right' ? 'start' : 'middle'}
              fill="#1A1C1E"
              fontSize="20"
              fontWeight="900"
              className="uppercase tracking-tight"
            >
              {s.title}
            </text>
          </g>
        </g>
      );
    })}

    {/* Destination: The Practice (Accurate image-based redesign) */}
    <g transform="translate(1080, 520)">
       {/* Ground / Base Line */}
       <line x1="-50" y1="120" x2="200" y2="120" stroke="oklch(0.25 0.02 240)" strokeWidth="2" />

       {/* Left Building (Blueish) */}
       <rect x="0" y="40" width="60" height="80" fill="oklch(0.42 0.08 225)" />
       <rect x="10" y="55" width="10" height="10" fill="white" fillOpacity="0.5" />
       <rect x="30" y="55" width="10" height="10" fill="white" fillOpacity="0.5" />
       <rect x="10" y="75" width="10" height="10" fill="white" fillOpacity="0.5" />
       <rect x="30" y="75" width="10" height="10" fill="white" fillOpacity="0.5" />
       <rect x="10" y="95" width="10" height="10" fill="white" fillOpacity="0.5" />
       <rect x="30" y="95" width="10" height="10" fill="white" fillOpacity="0.5" />

       {/* Main Building (Emerald/Teal) */}
       <rect x="60" y="20" width="100" height="100" fill="oklch(0.72 0.14 195)" />
       <rect x="60" y="20" width="100" height="8" fill="oklch(0.28 0.04 180)" fillOpacity="0.2" />

       {/* The Glasses Sign */}
       <rect x="75" y="40" width="70" height="40" rx="8" fill="white" />
       <g transform="translate(85, 48) scale(0.4)">
          <circle cx="20" cy="20" r="15" stroke="oklch(0.24 0.04 230)" strokeWidth="8" fill="none" />
          <circle cx="70" cy="20" r="15" stroke="oklch(0.24 0.04 230)" strokeWidth="8" fill="none" />
          <path d="M35 20H55" stroke="oklch(0.24 0.04 230)" strokeWidth="8" strokeLinecap="round" />
       </g>

       {/* Doorway */}
       <rect x="85" y="90" width="22" height="30" fill="oklch(0.25 0.02 240)" />
       <rect x="113" y="90" width="22" height="30" fill="oklch(0.25 0.02 240)" />

       {/* Tree on Right */}
       <g transform="translate(160, 80)">
          <rect x="8" y="20" width="4" height="20" fill="#78350F" />
          <circle cx="10" cy="15" r="15" fill="#22C55E" />
       </g>

       {/* Bush on Left */}
       <circle cx="-10" cy="110" r="15" fill="#22C55E" />
       <circle cx="10" cy="112" r="10" fill="#22C55E" />

       {/* Welcome Sign removed */}
       <line x1="190" y1="70" x2="190" y2="120" stroke="#1A1C1E" strokeWidth="2" />
    </g>
  </svg>
);

export const ConfidentialIllustration = ({ className }) => (
  <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="150" cy="150" r="100" fill="currentColor" fillOpacity="0.05" />
    <g className="animate-bounce-slow">
      <rect x="100" y="120" width="100" height="120" rx="20" fill="white" stroke="currentColor" strokeWidth="2" />
      <path d="M120 120V90C120 73.4315 133.431 60 150 60C166.569 60 180 73.4315 180 90V120" stroke="currentColor" strokeWidth="2" />
      <circle cx="150" cy="180" r="10" fill="var(--primary)" fillOpacity="0.2" />
      <rect x="148" y="185" width="4" height="15" rx="2" fill="var(--primary)" />
    </g>

    {/* Radar-like rings */}
    <circle cx="150" cy="150" r="120" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" />
    <circle cx="150" cy="150" r="140" stroke="currentColor" strokeOpacity="0.03" strokeWidth="1" />
  </svg>
);

export const OptometryIllustration = ({ className }) => (
  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Abstract Eye Shape */}
    <path
      d="M50 150C50 150 120 70 200 70C280 70 350 150 350 150C350 150 280 230 200 230C120 230 50 150 50 150Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeOpacity="0.2"
    />
    <circle cx="200" cy="150" r="60" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
    <circle cx="200" cy="150" r="30" fill="var(--accent)" fillOpacity="0.8" />

    {/* Professional Elements */}
    <g transform="translate(300, 50)">
       <rect x="0" y="0" width="60" height="80" rx="4" fill="white" stroke="currentColor" strokeWidth="1" strokeOpacity="0.1" />
       <line x1="10" y1="15" x2="50" y2="15" stroke="currentColor" strokeOpacity="0.1" strokeWidth="2" />
       <line x1="10" y1="25" x2="40" y2="25" stroke="currentColor" strokeOpacity="0.1" strokeWidth="2" />
       <line x1="10" y1="35" x2="50" y2="35" stroke="currentColor" strokeOpacity="0.1" strokeWidth="2" />
    </g>

    {/* Stethoscope touch */}
    <path
      d="M100 250C100 250 100 280 150 280C200 280 200 240 250 240C300 240 300 270 350 270"
      stroke="var(--primary)"
      strokeWidth="4"
      strokeLinecap="round"
      opacity="0.3"
    />
  </svg>
);

export const MedicalBadge = ({ className }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="90" fill="var(--primary)" />
    <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
    <path
      d="M100 60V140M60 100H140"
      stroke="white"
      strokeWidth="20"
      strokeLinecap="round"
    />
    <path
      d="M75 145L100 170L125 145"
      stroke="var(--accent)"
      strokeWidth="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
