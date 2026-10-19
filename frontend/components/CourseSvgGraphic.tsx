'use client'

import { useState, useEffect } from 'react'

interface CourseSvgGraphicProps {
  title: string;
  category: 'academic' | 'skill' | 'teacher';
  width?: number;
  height?: number;
}

export default function CourseSvgGraphic({ 
  title, 
  category, 
  width = 400, 
  height = 200 
}: CourseSvgGraphicProps) {
  // Split the title into words for better layout
  const words = title.split(' ');
  
  // Generate a unique ID for gradient
  const [gradientId, setGradientId] = useState('');
  
  useEffect(() => {
    // Generate a random ID for the gradient to avoid conflicts
    setGradientId(`gradient-${Math.random().toString(36).substr(2, 9)}`);
  }, []);
  
  // Colors based on category
  const getColors = () => {
    switch(category) {
      case 'academic':
        return {
          primary: '#6A3EA1', // Purple
          secondary: '#9966CC',
          background: '#F8F5FF',
          icon: '📚' // Book icon
        };
      case 'skill':
        return {
          primary: '#3E9FA1', // Teal
          secondary: '#66CCCC',
          background: '#F5FCFF',
          icon: '🧠' // Brain icon
        };
      case 'teacher':
        return {
          primary: '#A13E9F', // Magenta
          secondary: '#CC66CC',
          background: '#FFF5FC',
          icon: '👩‍🏫' // Teacher icon
        };
      default:
        return {
          primary: '#6A3EA1',
          secondary: '#9966CC',
          background: '#F8F5FF',
          icon: '📚'
        };
    }
  };
  
  const colors = getColors();

  // Patterns based on category
  const getPatternElement = () => {
    switch(category) {
      case 'academic':
        return (
          <g className="pattern">
            <circle cx="30" cy="30" r="5" fill={colors.primary} opacity="0.2" />
            <circle cx="80" cy="60" r="8" fill={colors.primary} opacity="0.2" />
            <circle cx="140" cy="20" r="6" fill={colors.primary} opacity="0.2" />
            <circle cx="200" cy="70" r="10" fill={colors.primary} opacity="0.2" />
            <circle cx="270" cy="40" r="7" fill={colors.primary} opacity="0.2" />
            <circle cx="350" cy="60" r="9" fill={colors.primary} opacity="0.2" />
          </g>
        );
      case 'skill':
        return (
          <g className="pattern">
            <rect x="20" y="20" width="10" height="10" fill={colors.primary} opacity="0.2" transform="rotate(45 25 25)" />
            <rect x="80" y="50" width="15" height="15" fill={colors.primary} opacity="0.2" transform="rotate(45 87.5 57.5)" />
            <rect x="150" y="30" width="12" height="12" fill={colors.primary} opacity="0.2" transform="rotate(45 156 36)" />
            <rect x="220" y="60" width="18" height="18" fill={colors.primary} opacity="0.2" transform="rotate(45 229 69)" />
            <rect x="290" y="25" width="14" height="14" fill={colors.primary} opacity="0.2" transform="rotate(45 297 32)" />
            <rect x="350" y="55" width="16" height="16" fill={colors.primary} opacity="0.2" transform="rotate(45 358 63)" />
          </g>
        );
      case 'teacher':
        return (
          <g className="pattern">
            <path d="M30,30 L40,40 L30,50 L20,40 Z" fill={colors.primary} opacity="0.2" />
            <path d="M90,50 L105,65 L90,80 L75,65 Z" fill={colors.primary} opacity="0.2" />
            <path d="M160,20 L172,32 L160,44 L148,32 Z" fill={colors.primary} opacity="0.2" />
            <path d="M230,60 L248,78 L230,96 L212,78 Z" fill={colors.primary} opacity="0.2" />
            <path d="M300,30 L314,44 L300,58 L286,44 Z" fill={colors.primary} opacity="0.2" />
            <path d="M360,50 L376,66 L360,82 L344,66 Z" fill={colors.primary} opacity="0.2" />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      className="rounded-lg overflow-hidden"
    >
      {/* Background */}
      <rect width={width} height={height} fill={colors.background} rx="8" ry="8" />
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.primary} />
          <stop offset="100%" stopColor={colors.secondary} />
        </linearGradient>
      </defs>
      
      {/* Background pattern */}
      {getPatternElement()}
      
      {/* Category label */}
{/*       <rect x="10" y="10" width="130" height="30" fill="rgba(255, 215, 0, 0.9)" rx="15" ry="15" />
      <text x="20" y="30" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#000">
        {category === 'academic' ? 'Academic Program' : 
          category === 'skill' ? 'Skill Development' : 
          'Teacher Training'}
      </text> */}
      
      {/* Course title */}
      <g>
        {(() => {
          // Get font size based on title length
          const getFontSize = () => {
            if (title.length > 40) return 16;
            if (title.length > 30) return 18;
            if (title.length > 20) return 20;
            return 24;
          };

          // Group words into chunks for better layout
          const chunks = [];
          const wordsPerLine = title.length > 40 ? 3 : 
                              title.length > 30 ? 2 : 
                              words.length > 5 ? 2 : 1;
          
          for (let i = 0; i < words.length; i += wordsPerLine) {
            chunks.push(words.slice(i, i + wordsPerLine).join(' '));
          }
          
          // Render text with adjusted positioning for better layout
          return chunks.map((chunk, index) => (
            <text
              key={index}
              x={width / 2}
              y={height / 2 - (chunks.length - 1) * 15 + index * 30}
              fontFamily="Arial, sans-serif"
              fontSize={getFontSize()}
              fontWeight="bold"
              fill={`url(#${gradientId})`}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {chunk}
            </text>
          ));
        })()}
      </g>
      
      {/* Decorative element */}
      <text
        x={width - 40}
        y={height - 30}
        fontFamily="Arial, sans-serif"
        fontSize="36"
        fill={colors.primary}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {colors.icon}
      </text>
      
      {/* Bottom accent line */}
      <rect x="50" y={height - 20} width={width - 100} height="4" fill={`url(#${gradientId})`} rx="2" ry="2" />
    </svg>
  );
}
