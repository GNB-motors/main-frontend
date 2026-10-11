import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import { defineConfig, globalIgnores } from 'eslint/config';

const API_IMPORT_MESSAGE =
  'Call the API from a *Service / *Api module and use useApi or useMutation in the component (rule 8).';

export default defineConfig([
  // Design mockups and handoff notes, not application source — never imported
  // by src/. Their vendored/generated JS (canvas support scripts) isn't meant
  // to pass app lint rules.
  // quarantine/ holds unreachable pages kept for recovery, not for shipping —
  // outside src/ so Vite never bundles them, and ignored here so dead code can't
  // fail the gate. See quarantine/README.md.
  // public/draco/ is the vendored Draco decoder (served verbatim, never bundled).
  globalIgnores(['dist', 'Design', 'amitansu-handoff', 'quarantine', 'public/draco']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    plugins: {
      react,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: { version: 'detect' },
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        // Chrome extension messaging (StepInstallExtension.jsx)
        ...globals.webextensions,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Rule 24: log through utils/logger.js (console in dev only, errors to Sentry).
      'no-console': 'error',
      // Rule 8: components fetch through a service / api module and useApi or
      // useMutation, never the HTTP client directly.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'axios', message: API_IMPORT_MESSAGE },
            {
              name: 'xlsx',
              message:
                "xlsx is large; load it where it is used: const XLSX = await import('xlsx').",
            },
          ],
          patterns: [
            { group: ['**/axiosConfig', '**/axiosConfig.js'], message: API_IMPORT_MESSAGE },
          ],
        },
      ],
      // localStorage is touched ONLY by utils/session.js — direct access,
      // including window.localStorage, is a build error.
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='localStorage']",
          message: 'Use utils/session.js instead of direct localStorage access.',
        },
        {
          selector:
            "CallExpression[callee.object.object.name='window'][callee.object.property.name='localStorage']",
          message: 'Use utils/session.js instead of direct localStorage access.',
        },
      ],
      // Accessibility violations — Phase 7 remediates these; warn until then
      ...Object.fromEntries(
        Object.entries(jsxA11y.configs.recommended.rules).map(([rule]) => [rule, 'warn']),
      ),
      // Deprecated by jsx-a11y in favour of label-has-associated-control; keeping
      // it double-reports every label. Off, not suppressed.
      'jsx-a11y/label-has-for': 'off',
      // React correctness rules that don't require prop-types
      'react/no-children-prop': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-unknown-property': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-deprecated': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
  {
    // The data layer is where the HTTP client belongs.
    files: [
      'src/services/**/*.{js,jsx}',
      'src/**/*Service.{js,jsx}',
      'src/**/*.service.{js,jsx}',
      'src/**/*[aA]pi.js',
      'src/utils/axiosConfig.js',
      'src/lib/liveStream.js',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // Components that still call the API directly (FRONTEND_AUDIT ARCH-8).
    // Remove a file from this list when its calls move into a service; never add one.
    files: [
      'src/components/FuelLogForm/FuelLogForm.jsx',
      'src/components/LocationAutocomplete/LocationAutocomplete.jsx',
      'src/contexts/FeatureFlagsContext.jsx',
      'src/pages/Approvals/ApprovalsPage.jsx',
      'src/pages/AutoTrips/MovementApprovalsPage.jsx',
      'src/pages/ErpAdvances/AdvanceMastersPage.jsx',
      'src/pages/ErpCallPlanning/CallSchedulesPage.jsx',
      'src/pages/ErpDeliveryOrders/DeliveryOrdersPage.jsx',
      'src/pages/ErpMasters/PartiesPage.jsx',
      'src/pages/ErpMasters/RatesPage.jsx',
      'src/pages/FieldAgentFuel/FieldAgentFuelUploadPage.jsx',
      'src/pages/Mileage/components/PumpLedgerView.jsx',
      'src/pages/MileageTracking/AdBlueLogPage.jsx',
      'src/pages/MileageTracking/AdBlueTrackingPage.jsx',
      'src/pages/MileageTracking/MileageIntervalDetailPage.jsx',
      'src/pages/MileageTracking/MileageTrackingVehicleDetail.jsx',
      'src/pages/MileageTracking/ModelComparisonPage.jsx',
      'src/pages/Onboarding/components/LaunchAnimation.jsx',
      'src/pages/Onboarding/OnboardingPage.jsx',
      'src/pages/Reports/reports/AdBlueComparisonReport.jsx',
      'src/pages/Superadmin/components/lemu/LemuFlagsTab.jsx',
      'src/pages/Superadmin/components/OrgFeatureFlagsDetailPage.jsx',
      'src/pages/Superadmin/components/OrgFeatureFlagsPage.jsx',
      'src/pages/Superadmin/components/ReceiptApprovalDetailPage.jsx',
      'src/pages/Superadmin/components/ReceiptApprovalDrawer.jsx',
      'src/pages/Superadmin/components/ReceiptApprovalPage.jsx',
      'src/pages/Superadmin/components/SuperAdminLearningPage.jsx',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // Test files: vitest globals
    files: ['**/*.test.{js,jsx}', '**/test/setup.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest,
      },
    },
    rules: {
      'react-refresh/only-export-components': 'off',
      // Tests legitimately exercise raw storage (prototype spies, jsdom resets)
      'no-restricted-syntax': 'off',
      'no-console': 'off',
      'no-restricted-imports': 'off',
    },
  },
]);
