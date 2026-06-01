import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Switch,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
} from '@mui/material';
import { Save as SaveIcon, RestartAlt as ResetIcon } from '@mui/icons-material';
import { PageHeader } from '../../Drivers/Component';
import apiClient from '../../../utils/axiosConfig';

const FEATURE_LABELS = {
  overview: 'Overview',
  reports: 'Reports',
  vehicles: 'Vehicles',
  vehicleActivity: 'Vehicle Activity',
  drivers: 'Employees / Drivers',
  locations: 'Locations',
  fuelComparison: 'Fuel Comparison',
  khataLedger: 'Khata Ledger',
};

const OrgFeatureFlagsDetailPage = () => {
  const navigate = useNavigate();
  const { orgId } = useParams();

  const [orgName, setOrgName] = useState('');
  const [flags, setFlags] = useState({});
  const [original, setOriginal] = useState({});
  const [knownKeys, setKnownKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (localStorage.getItem('user_role') !== 'SUPER_ADMIN') {
      navigate('/overview');
    }
  }, [navigate]);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError('');
    try {
      const [flagsRes, orgsRes] = await Promise.all([
        apiClient.get(`/api/feature-flags/${orgId}`),
        apiClient.get('/api/admin/organizations'),
      ]);
      const payload = flagsRes.data?.data ?? {};
      setFlags(payload.flags || {});
      setOriginal(payload.flags || {});
      setKnownKeys(payload.knownKeys || []);
      const list = orgsRes.data?.data ?? [];
      const me = list.find((o) => o._id === orgId);
      setOrgName(me?.companyName || me?.ownerEmail || orgId);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load flags');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (key) => {
    setFlags((prev) => ({ ...prev, [key]: !prev?.[key] }));
  };

  const dirty = knownKeys.some(
    (k) => (flags?.[k] === true) !== (original?.[k] === true),
  );

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const features = {};
      knownKeys.forEach((k) => {
        features[k] = flags?.[k] === true;
      });
      const res = await apiClient.patch(`/api/feature-flags/${orgId}`, { features });
      const next = res.data?.data?.flags || features;
      setFlags(next);
      setOriginal(next);
      setToast('Saved');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => setFlags(original);

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <PageHeader
        backLabel="Organizations"
        backPath="/superadmin/feature-flags"
        currentLabel={orgName || '…'}
        title={orgName || 'Organization'}
        description="Toggle which sidebar features this organization can access."
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ResetIcon />}
          onClick={reset}
          disabled={!dirty || saving}
          sx={{
            textTransform: 'none',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            borderColor: '#D3D3D5',
            color: '#121214',
            '&:hover': { borderColor: '#a0a0a0', background: '#f5f5f5' },
          }}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={save}
          disabled={!dirty || saving}
          sx={{
            textTransform: 'none',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            background: 'var(--primary-color, #4f46e5)',
            '&:hover': { background: 'var(--primary-dark, #4338ca)' },
          }}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
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
              <TableCell sx={{ fontWeight: 600 }}>Feature</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Key</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Enabled</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}
            {!loading && knownKeys.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No known feature keys.
                </TableCell>
              </TableRow>
            )}
            {!loading && knownKeys.map((key) => {
              const enabled = flags?.[key] === true;
              return (
                <TableRow key={key} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {FEATURE_LABELS[key] || key}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                      {key}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={enabled ? 'Enabled' : 'Denied'}
                      color={enabled ? 'success' : 'default'}
                      variant={enabled ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Switch
                      checked={enabled}
                      onChange={() => toggle(key)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: 'var(--primary-color, #4f46e5)',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: 'var(--primary-color, #4f46e5)',
                        },
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={!!toast}
        autoHideDuration={2500}
        onClose={() => setToast('')}
        message={toast}
      />
    </Box>
  );
};

export default OrgFeatureFlagsDetailPage;
