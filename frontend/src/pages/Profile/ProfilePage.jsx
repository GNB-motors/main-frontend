import React, { useState, useEffect } from 'react';
import DefaultAvatar from '../../assets/default-avatar.png';
import { ProfileService } from './ProfileService';
import { getThemeCSS } from '../../utils/colorTheme';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

import {
    User, Mail, Phone, MapPin, Building2, Hash,
    CreditCard, ShieldCheck, AlertCircle,
} from 'lucide-react';

// ── Field row ─────────────────────────────────────────────────────────────────

const Field = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3.5 shadow-[0_1px_4px_rgba(41,64,211,0.06)] transition-shadow hover:shadow-[0_2px_10px_rgba(41,64,211,0.1)]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Icon size={15} />
        </div>
        <div className="min-w-0 flex-1">
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {label}
            </p>
            <p className="truncate text-sm font-semibold text-slate-800">
                {value || <span className="font-normal italic text-slate-300">Not provided</span>}
            </p>
        </div>
    </div>
);

// ── Section header ────────────────────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title }) => (
    <div className="mb-3 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-500">
            <Icon size={13} />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
    </div>
);

// ── Status badge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
    const active = status?.toLowerCase() === 'active';
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide
            ${active ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-600 ring-1 ring-amber-200'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            {status || 'Unknown'}
        </span>
    );
};

// ── Left profile card ─────────────────────────────────────────────────────────

const ProfileCard = ({ user, organization }) => {
    const initials = [user?.firstName, user?.lastName]
        .filter(Boolean).map(n => n[0]).join('').toUpperCase() || 'U';
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(41,64,211,0.1)]">
            {/* Blue banner */}
            <div className="relative h-28 mb-14 w-full bg-linear-to-br from-blue-600 via-blue-500 to-indigo-600">
                {/* subtle pattern overlay */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
            </div>

            {/* Avatar — overlaps banner */}
            <div className="flex flex-1 flex-col items-center px-6 pb-6 pt-4">
                <div className="-mt-16 mb-5">
                    <Avatar className="h-24 w-24 ring-4 ring-white shadow-xl">
                        <AvatarImage src={DefaultAvatar} alt={fullName} />
                        <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </div>

                <h2 className="text-lg font-bold text-slate-900">{fullName}</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">{organization?.companyName || '—'}</p>
                <p className="mt-1 text-xs text-slate-400">{user?.email || '—'}</p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <StatusBadge status={user?.status} />
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-600 ring-1 ring-blue-200">
                        {user?.role || 'Unknown'}
                    </span>
                </div>

                {/* divider */}
                <div className="my-6 h-px w-full bg-slate-100" />

                {/* Quick stats */}
                <div className="grid w-full grid-cols-2 gap-3">
                    <div className="rounded-xl bg-blue-50 px-3 py-3 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Company</p>
                        <p className="mt-1 truncate text-sm font-bold text-blue-700">{organization?.companyName || '—'}</p>
                    </div>
                    <div className="rounded-xl bg-indigo-50 px-3 py-3 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">GSTIN</p>
                        <p className="mt-1 truncate text-sm font-bold text-indigo-700">{organization?.gstin || '—'}</p>
                    </div>
                </div>

                {/* Spacer pushes notice to bottom */}
                <div className="flex-1" />
            </div>

            {/* Notice — pinned to bottom */}
            <div className="px-6 pb-6 pt-2">
                <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3.5">
                    <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-500" />
                    <p className="text-[11px] leading-relaxed text-amber-700">
                        Read-only. Contact your administrator to make changes.
                    </p>
                </div>
            </div>
        </div>
    );
};

// ── Right details panel ───────────────────────────────────────────────────────

const DetailsPanel = ({ user, organization }) => (
    <div className="flex h-full flex-col gap-6">
        {/* Personal */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(41,64,211,0.08)]">
            <SectionHeader icon={User} title="Personal Information" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field icon={User}        label="First Name"    value={user?.firstName} />
                <Field icon={User}        label="Last Name"     value={user?.lastName} />
                <Field icon={Mail}        label="Email"         value={user?.email} />
                <Field icon={Phone}       label="Mobile Number" value={user?.mobileNumber} />
                <Field icon={MapPin}      label="Location"      value={user?.location} />
                <Field icon={ShieldCheck} label="Role"          value={user?.role} />
            </div>
        </div>

        {/* Organisation */}
        <div className="flex flex-1 flex-col rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(41,64,211,0.08)]">
            <SectionHeader icon={Building2} title="Organisation Details" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field icon={Building2}  label="Company Name"   value={organization?.companyName} />
                <Field icon={Mail}       label="Owner Email"    value={organization?.ownerEmail} />
                <Field icon={CreditCard} label="GSTIN"          value={organization?.gstin} />
                <Field icon={Hash}       label="Organisation ID" value={organization?._id} />
            </div>
        </div>
    </div>
);

// ── Skeleton ──────────────────────────────────────────────────────────────────

const ProfileSkeleton = () => (
    <div className="flex h-full w-full gap-6 p-6">
        <div className="w-72 shrink-0">
            <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
                <Skeleton className="h-28 w-full rounded-xl" />
                <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
        </div>
        <div className="flex-1 space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
                <Skeleton className="mb-4 h-4 w-40" />
                <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
                <Skeleton className="mb-4 h-4 w-40" />
                <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
            </div>
        </div>
    </div>
);

// ── ProfilePage ───────────────────────────────────────────────────────────────

const ProfilePage = () => {
    const [userData, setUserData] = useState(null);
    const [organizationData, setOrganizationData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [themeColors] = useState(getThemeCSS());

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { user, organization } = await ProfileService.getProfile();
                setUserData(user);
                setOrganizationData(organization);

                if (user) {
                    localStorage.setItem('profile_id', user.id);
                    localStorage.setItem('profile_owner_email', user.email);
                    localStorage.setItem('primaryThemeColor', user.primaryThemeColor || '#2940d3');
                    // Dispatch so Sidebar/Navbar re-render with the loaded colour in the same tab
                    window.dispatchEvent(new CustomEvent('themeColorChange'));
                }
                if (organization) {
                    localStorage.setItem('profile_company_name', organization.companyName);
                    localStorage.setItem('profile_gstin', organization.gstin);
                    localStorage.setItem('profile_owner_email', organization.ownerEmail);
                }
            } catch (err) {
                console.error('Failed to load profile:', err);
                setError('Failed to load profile information.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (isLoading) return <ProfileSkeleton />;

    if (error || !userData || !organizationData) {
        return (
            <div className="flex h-full w-full items-center justify-center p-6">
                <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
                    <AlertCircle size={16} />
                    {error || 'Could not load profile data.'}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-50 p-6" style={themeColors}>
            <div className="flex w-full gap-6 items-stretch">
                {/* Left sidebar */}
                <div className="w-72 shrink-0">
                    <ProfileCard user={userData} organization={organizationData} />
                </div>

                {/* Right details */}
                <div className="min-w-0 flex-1">
                    <DetailsPanel user={userData} organization={organizationData} />
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;