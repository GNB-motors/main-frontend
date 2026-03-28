import React, { useRef, useState } from 'react';

const SpotlightButton = ({ 
    children, 
    className = '', 
    spotlightColor = 'rgba(255, 255, 255, 0.6)', // The sharp outline
    surfaceColor = 'rgba(255, 255, 255, 0.02)',  // Removed milkiness completely
    onClick,
    type = 'button'
}) => {
    const divRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e) => {
        if (!divRef.current || isFocused) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleFocus = () => {
        setIsFocused(true);
        setOpacity(1);
    };

    const handleBlur = () => {
        setIsFocused(false);
        setOpacity(0);
    };

    const handleMouseEnter = () => setOpacity(1);
    const handleMouseLeave = () => setOpacity(0);

    return (
        <button
            ref={divRef}
            type={type}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`relative overflow-hidden ${className}`}
            style={{
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), inset 0 0 0 1px rgba(255,255,255,0.05)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            }}
        >
            {/* 1. Interactive Glossy Surface */}
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0 mix-blend-overlay"
                style={{
                    opacity,
                    background: `radial-gradient(150px circle at ${position.x}px ${position.y}px, ${surfaceColor}, transparent 100%)`,
                }}
            />
            
            {/* 2. Authentic Specular Border Highlight */}
            <div
                className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 z-10 p-[1px]"
                style={{
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    opacity,
                    background: `radial-gradient(100px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 50%)`,
                }}
            />
            
            {/* Button Content rendered directly inside */}
            {children}
        </button>
    );
};

export default SpotlightButton;
