const AppIcon = ({ className = "w-12 h-12" }: { className?: string }) => {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background with gradient */}
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#B794F6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#F687B3', stopOpacity: 1 }} />
        </linearGradient>
        
        <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.25 }} />
          <stop offset="100%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.1 }} />
        </linearGradient>
      </defs>
      
      {/* Rounded square background */}
      <rect width="200" height="200" rx="45" fill="url(#bgGradient)"/>
      
      {/* Circular progress/cycle concept */}
      <g transform="translate(100, 100)">
        
        {/* Outer ring segments (representing cycle phases) */}
        <g opacity="0.3">
          <circle cx="0" cy="0" r="65" fill="none" stroke="#FFFFFF" strokeWidth="8" />
        </g>
        
        {/* Progress ring */}
        <circle cx="0" cy="0" r="65" fill="none" 
                stroke="#FFFFFF" 
                strokeWidth="8" 
                strokeDasharray="150 408" 
                strokeDashoffset="0"
                opacity="0.9"
                strokeLinecap="round"
                transform="rotate(-90)" />
        
        {/* Inner decorative circles */}
        <circle cx="0" cy="0" r="50" fill="url(#circleGradient)" opacity="0.4" />
        <circle cx="0" cy="0" r="38" fill="url(#circleGradient)" opacity="0.3" />
        
        {/* Static butterfly */}
        <g transform="translate(0, 0)">
          {/* Left wing top */}
          <ellipse cx="-12" cy="-8" rx="11" ry="15" fill="#FFFFFF" opacity="0.9" />
          <ellipse cx="-12" cy="-8" rx="8" ry="11" fill="#F687B3" opacity="0.6" />
          <circle cx="-15" cy="-10" r="3" fill="#FFFFFF" opacity="0.8"/>
          
          {/* Left wing bottom */}
          <ellipse cx="-10" cy="8" rx="9" ry="12" fill="#FFFFFF" opacity="0.9" />
          <ellipse cx="-10" cy="8" rx="6" ry="9" fill="#B794F6" opacity="0.6" />
          <circle cx="-12" cy="6" r="2.5" fill="#FFFFFF" opacity="0.8"/>
          
          {/* Right wing top */}
          <ellipse cx="12" cy="-8" rx="11" ry="15" fill="#FFFFFF" opacity="0.9" />
          <ellipse cx="12" cy="-8" rx="8" ry="11" fill="#F687B3" opacity="0.6" />
          <circle cx="15" cy="-10" r="3" fill="#FFFFFF" opacity="0.8"/>
          
          {/* Right wing bottom */}
          <ellipse cx="10" cy="8" rx="9" ry="12" fill="#FFFFFF" opacity="0.9" />
          <ellipse cx="10" cy="8" rx="6" ry="9" fill="#B794F6" opacity="0.6" />
          <circle cx="12" cy="6" r="2.5" fill="#FFFFFF" opacity="0.8"/>
          
          {/* Body */}
          <ellipse cx="0" cy="0" rx="3" ry="20" fill="#FFFFFF" opacity="0.95"/>
          <ellipse cx="0" cy="0" rx="2" ry="18" fill="#F687B3" opacity="0.7"/>
          
          {/* Antennae */}
          <path d="M 0,-18 Q -4,-25 -6,-28" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity="0.9" strokeLinecap="round"/>
          <path d="M 0,-18 Q 4,-25 6,-28" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity="0.9" strokeLinecap="round"/>
          <circle cx="-6" cy="-28" r="2" fill="#FFFFFF" opacity="0.9"/>
          <circle cx="6" cy="-28" r="2" fill="#FFFFFF" opacity="0.9"/>
        </g>
        
        {/* Small dots indicating cycle points */}
        <circle cx="0" cy="-65" r="5" fill="#FFFFFF" opacity="0.9" />
        <circle cx="46" cy="-46" r="4" fill="#FFFFFF" opacity="0.7" />
        <circle cx="65" cy="0" r="4" fill="#FFFFFF" opacity="0.7" />
        <circle cx="46" cy="46" r="4" fill="#FFFFFF" opacity="0.7" />
      </g>
    </svg>
  );
};

export default AppIcon;
