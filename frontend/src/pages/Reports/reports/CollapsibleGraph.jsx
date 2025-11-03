import React, { useState } from 'react';
import {
    Box, Paper, Typography, Collapse, Button,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// --- REUSABLE COLLAPSIBLE GRAPH ---
const CollapsibleGraph = ({ data }) => {
    const [open, setOpen] = useState(false);
    return (
        <Box sx={{ mt: 3 }}>
            <Button
                variant="outlined"
                onClick={() => setOpen(!open)}
                endIcon={<ExpandMore sx={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />}
            >
                {open ? 'Hide Trip Analysis' : 'Show Trip Analysis Graph'}
            </Button>
            <Collapse in={open}>
                <Paper sx={{ p: 2, mt: 1, height: 400, width: '100%', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-grey-200)' }}>
                    <Typography variant="h6" gutterBottom>Mileage Variance per Trip</Typography>
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
                </Paper>
            </Collapse>
        </Box>
    );
};

export default CollapsibleGraph;
