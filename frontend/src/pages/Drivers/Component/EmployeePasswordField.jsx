import { useState } from 'react';
import { createPortal } from 'react-dom';
import { LockKeyhole } from 'lucide-react';
import PasswordField from '../../../components/auth/PasswordField';
import ResetPasswordDialog from '../../../components/auth/ResetPasswordDialog';
import { useFeatureFlags } from '../../../contexts/FeatureFlagsContext';
import useMutation from '../../../hooks/useMutation';
import { getUserId, getUserRole } from '../../../utils/session.js';
import { canResetRow } from '../canResetPassword';
import { DriverService } from '../DriverService';
import './EmployeePasswordField.css';

export default function EmployeePasswordField({ isEdit, employee = {}, value, onChange }) {
  const [resetting, setResetting] = useState(false);
  const { permissions } = useFeatureFlags();
  const target = { ...employee, id: employee.driverId || employee.id || employee._id };
  const canReset = isEdit && canResetRow(getUserRole(), target, permissions, getUserId());
  const reset = useMutation((body, { signal }) => {
    if (!canReset) throw new Error('You cannot reset this employee’s password.');
    return DriverService.resetPassword(target.id, body, { signal });
  });

  if (!isEdit) {
    return (
      <PasswordField
        label="Password *"
        aria-label="Password"
        value={value}
        onChange={onChange}
        required
        placeholder="Enter password"
        className="employee-password-field"
        inputClassName="basic-info-input"
        labelClassName="basic-info-label"
      />
    );
  }

  return (
    <div className="employee-password-field">
      <span className="basic-info-label">Password</span>
      <div className="employee-password-summary">
        <span className="employee-password-private">
          <LockKeyhole size={16} aria-hidden="true" />
          Not displayed
        </span>
        {canReset ? (
          <button
            type="button"
            className="employee-password-reset"
            onClick={() => setResetting(true)}
          >
            Reset password
          </button>
        ) : null}
      </div>
      {!canReset ? (
        <p className="employee-password-note">
          Password changes are managed by an authorised administrator.
        </p>
      ) : null}
      {resetting &&
        canReset &&
        createPortal(
          // Portal submissions must not bubble into the employee's Save form.
          <div onSubmit={(event) => event.stopPropagation()}>
            <ResetPasswordDialog
              open
              onClose={() => setResetting(false)}
              user={{
                id: target.id,
                name:
                  employee.name ||
                  [employee.firstName, employee.lastName].filter(Boolean).join(' ') ||
                  employee.mobileNumber ||
                  'this employee',
                email: employee.email || null,
              }}
              onSubmit={reset.mutate}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
