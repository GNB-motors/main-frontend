import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon, Business as BusinessIcon } from '@mui/icons-material';
import { PageHeader } from '../../Drivers/Component';
import apiClient from '../../../utils/axiosConfig';

const OrgFeatureFlagsPage = () => {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (localStorage.getItem('user_role') !== 'SUPER_ADMIN') {
      navigate('/overview');
    }
  }, [navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiClient.get('/api/admin/organizations');
        setOrgs(res.data?.data ?? []);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load organizations');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = orgs.filter((o) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (o.companyName || '').toLowerCase().includes(q) ||
      (o.ownerEmail || '').toLowerCase().includes(q) ||
      (o.gstin || '').toLowerCase().includes(q)
    );
  });

  const flagCount = (org) => {
    const flags = org.featureFlags || {};
    return Object.values(flags).filter((v) => v === true).length;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <PageHeader
        backLabel="Dashboard"
        backPath="/superadmin"
        currentLabel="Feature Flags"
        title="Feature Flags"
        description="Pick an organization to manage its enabled sidebar features."
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by name, email, GSTIN"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{
            width: 320,
            '& .MuiOutlinedInput-root': {
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          borderColor: '#E5E5E7',
          borderRadius: 2,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>Organization</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Owner Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>GSTIN</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Onboarded</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Enabled Features</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No organizations found.
                </TableCell>
              </TableRow>
            )}
            {!loading && filtered.map((org) => (
              <TableRow
                key={org._id}
                hover
                onClick={() => navigate(`/superadmin/feature-flags/${org._id}`)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <BusinessIcon fontSize="small" color="action" />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {org.companyName || '(unnamed)'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{org.ownerEmail || '—'}</TableCell>
                <TableCell>{org.gstin || '—'}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={org.isOnboarded ? 'Yes' : 'No'}
                    color={org.isOnboarded ? 'success' : 'default'}
                    variant={org.isOnboarded ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip size="small" label={flagCount(org)} variant="outlined" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default OrgFeatureFlagsPage;
