import { User, Mail, Phone, MapPin, Building2, Hash, CreditCard, ShieldCheck } from 'lucide-react';
import CompanyLogoUploader from '../../components/CompanyLogoUploader.jsx';
import { Field, SectionHeader } from './profileAtoms';
import { LocationsManager } from './profileLocationsManager';

/** Right-hand column: personal info, organisation details + logo, locations. */
export const DetailsPanel = ({
  user,
  organization,
  canEditLogo,
  canManageLocations,
  onLogoChange,
}) => (
  <div className="flex h-full flex-col gap-6">
    {/* Personal */}
    <div className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(41,64,211,0.08)]">
      <SectionHeader icon={User} title="Personal Information" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field icon={User} label="First Name" value={user?.firstName} />
        <Field icon={User} label="Last Name" value={user?.lastName} />
        <Field icon={Mail} label="Email" value={user?.email} />
        <Field icon={Phone} label="Mobile Number" value={user?.mobileNumber} />
        <Field icon={MapPin} label="Location" value={user?.location} />
        <Field icon={ShieldCheck} label="Role" value={user?.role} />
      </div>
    </div>

    {/* Organisation */}
    <div className="flex flex-col rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(41,64,211,0.08)]">
      <SectionHeader icon={Building2} title="Organisation Details" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field icon={Building2} label="Company Name" value={organization?.companyName} />
        <Field icon={Mail} label="Owner Email" value={organization?.ownerEmail} />
        <Field icon={CreditCard} label="GSTIN" value={organization?.gstin} />
        <Field icon={Hash} label="Organisation ID" value={organization?._id} />
      </div>

      {/* Company logo — only the org OWNER (or a super admin) may change it. */}
      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Company Logo
        </p>
        {canEditLogo ? (
          <CompanyLogoUploader
            orgId={organization?._id}
            logoUrl={organization?.logoUrl}
            onChange={onLogoChange}
          />
        ) : organization?.logoUrl ? (
          <img
            src={organization.logoUrl}
            alt="Company logo"
            className="max-h-16 max-w-[180px] object-contain"
          />
        ) : (
          <p className="text-sm text-slate-400">No logo uploaded. Ask an owner to add one.</p>
        )}
      </div>
    </div>

    {/* Locations (operating branches) */}
    <LocationsManager canManage={canManageLocations} />
  </div>
);
