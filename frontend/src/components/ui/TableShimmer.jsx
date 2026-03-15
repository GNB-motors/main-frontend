import React from 'react';

const shimmerStyle = {
    background: 'linear-gradient(90deg, #f0f0f3 25%, #e8e8ec 50%, #f0f0f3 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite ease-in-out',
    borderRadius: '6px',
    height: '14px',
};

const TableShimmer = ({ columns = 8, rows = 10 }) => {
    return (
        <>
            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
            <div className="table-wrapper">
                <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0 }}>
                    <thead>
                        <tr className="table-header-row">
                            {Array.from({ length: columns }).map((_, i) => (
                                <th key={i} style={{ padding: '16px 20px' }}>
                                    <div style={{ ...shimmerStyle, width: '70%', height: '12px', opacity: 0.6 }} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rows }).map((_, rowIdx) => (
                            <tr key={rowIdx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                {Array.from({ length: columns }).map((_, colIdx) => (
                                    <td key={colIdx} style={{ padding: '18px 20px' }}>
                                        <div style={{
                                            ...shimmerStyle,
                                            width: `${55 + ((rowIdx + colIdx) % 4) * 12}%`,
                                            animationDelay: `${(rowIdx * columns + colIdx) * 0.05}s`,
                                        }} />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default TableShimmer;
