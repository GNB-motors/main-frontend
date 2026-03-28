import React, { useRef, useState } from 'react';

const SpotlightCard = ({ 
    children, 
    className = '', 
    spotlightColor = 'rgba(255, 255, 255, 0.5)', // Sharpened sharp border highlight
    surfaceColor = 'rgba(255, 255, 255, 0.03)',  // Reduced to 0.03 to eliminate milkiness
    isActive = true
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

    if (!isActive) {
        return <div className={className}>{children}</div>;
    }

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`relative overflow-hidden ${className}`}
            style={{
                // Ambient lighting structural effect common in iOS
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), inset 0 0 0 1px rgba(255,255,255,0.05)',
                // Reintroduce proper saturated blurring for 'pop'
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            }}
        >
            {/* 1. Internal Authentic Glossy Surface Sheen */}
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-500 z-0 mix-blend-overlay"
                style={{
                    opacity,
                    background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${surfaceColor}, transparent 100%)`,
                }}
            />
            
            {/* 2. Specular Dynamic Edge Highlight (The Magic Mask Trick) */}
            <div
                className="pointer-events-none absolute inset-0 transition-[opacity,transform] duration-500 z-10 p-[1px]"
                style={{
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    opacity,
                    // A tighter, brighter radius specifically for the border
                    background: `radial-gradient(150px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 50%)`,
                }}
            />
            
            {/* Preserve children naturally to not break flex/grid */}
            {children}
        </div>
    );
};

export default SpotlightCard;
