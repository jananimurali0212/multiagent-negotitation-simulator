import React from 'react';

interface LogoProps {
  variant?: 'horizontal' | 'vertical' | 'icon-only';
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'horizontal', className = '', size = 48 }) => {
  const primaryColor = '#1E2230'; // Midnight Indigo
  const secondaryColor = '#C86D51'; // Terracotta Clay
  const accentColor = '#3B82F6'; // Soft Mint Teal
  
  const renderIcon = () => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block"
    >
      {/* Background container or tracks */}
      {/* Indigo circuit track */}
      <path
        d="M20 50 C20 30, 35 15, 55 15"
        stroke={primaryColor}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="20" cy="50" r="4" fill={primaryColor} />
      
      {/* Terracotta circuit track */}
      <path
        d="M80 50 C80 70, 65 85, 45 85"
        stroke={secondaryColor}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="80" cy="50" r="4" fill={secondaryColor} />
      
      {/* Soft Mint Teal track */}
      <path
        d="M50 20 C65 20, 80 35, 80 55"
        stroke={accentColor}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Indigo / Terracotta central 'N' path with arrows */}
      <g transform="translate(10, 10)">
        {/* Left leg of N (goes down) */}
        <path
          d="M25 25 L25 55 M25 55 L20 50 M25 55 L30 50"
          stroke={primaryColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Diagonal N link */}
        <path
          d="M25 25 L55 55"
          stroke={primaryColor}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Right leg of N (goes up) */}
        <path
          d="M55 55 L55 25 M55 25 L50 30 M55 25 L60 30"
          stroke={secondaryColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      
      {/* Dialogue bubble 1 - Terracotta */}
      <path
        d="M32 65 C32 61, 36 58, 42 58 C48 58, 52 61, 52 65 C52 69, 48 72, 42 72 L37 75 L39 71 C34 70, 32 68, 32 65 Z"
        fill={secondaryColor}
      />
      
      {/* Dialogue bubble 2 - Soft Mint Teal */}
      <path
        d="M68 35 C68 31, 64 28, 58 28 C52 28, 48 31, 48 35 C48 39, 52 42, 58 42 L63 45 L61 41 C66 40, 68 38, 68 35 Z"
        fill={accentColor}
      />
    </svg>
  );

  if (variant === 'icon-only') {
    return <div className={`flex items-center justify-center ${className}`}>{renderIcon()}</div>;
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="mb-4">
          {renderIcon()}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-primary uppercase">
          AI-Driven Multi-Agent
        </h1>
        <p className="text-xs font-semibold tracking-wider text-secondary uppercase mt-1">
          Negotiation Training and Simulation Platform
        </p>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {renderIcon()}
      <div className="flex flex-col">
        <span className="text-[9px] font-bold tracking-wider uppercase leading-none text-primary">
          AI-DRIVEN MULTI-AGENT
        </span>
        <span className="text-[7px] font-semibold uppercase tracking-wider mt-0.5 leading-none text-secondary">
          NEGOTIATION TRAINING PLATFORM
        </span>
      </div>
    </div>
  );
};
