import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// --- REUSABLE COLLAPSIBLE GRAPH ---
const CollapsibleGraph = ({ data }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="mt-6">
            <Button
                variant="outline"
                onClick={() => setOpen(!open)}
            >
                {open ? 'Hide Trip Analysis' : 'Show Trip Analysis Graph'}
                <ChevronDown
                    className={`transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
                />
            </Button>
            {open && (
                <div
                    className="mt-2 w-full rounded-md border bg-card p-4 text-card-foreground"
                    style={{ height: 400, boxShadow: 'var(--shadow-card)', borderColor: 'var(--color-grey-200)' }}
                >
                    <h6 className="mb-2 text-lg font-semibold">Mileage Variance per Trip</h6>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis label={{ value: 'km/l', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="fleetEdgeMileage" fill="#8884d8" name="FleetEdge Mileage" />
                            <Bar dataKey="billMileage" fill="#82ca9d" name="Bill Mileage" />
                            <Bar dataKey="variance" fill="#ffc658" name="Variance (Outliers)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default CollapsibleGraph;
