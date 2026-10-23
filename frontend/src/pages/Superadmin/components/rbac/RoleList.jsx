import { Plus, Shield, Lock, ShieldCheck } from 'lucide-react';

const RoleList = ({ loading, roles, selectedId, selectRole, setAddError, setAddOpen }) => (
  <div className="rbac-master">
    {loading && (
      <div className="ff-state">
        <div className="ff-spinner" />
      </div>
    )}
    {!loading &&
      roles.map((role) => (
        <button
          key={role._id}
          type="button"
          className={`rbac-role ${role._id === selectedId ? 'rbac-role--active' : ''}`}
          onClick={() => selectRole(role)}
        >
          <span className="rbac-role__name">
            {role.baseRole === 'OWNER' ? <ShieldCheck size={15} /> : <Shield size={15} />}
            {role.name}
            {role.isImmutable && <Lock size={12} style={{ color: '#a2a8bd' }} />}
          </span>
          <span className="rbac-role__meta">
            {role.baseRole}
            {role.isSystem ? ' · system' : role.isImmutable ? ' · built-in' : ' · custom'}
          </span>
        </button>
      ))}
    <button
      type="button"
      className="rbac-fab"
      onClick={() => {
        setAddError('');
        setAddOpen(true);
      }}
    >
      <Plus size={16} /> Add role
    </button>
  </div>
);

export default RoleList;
