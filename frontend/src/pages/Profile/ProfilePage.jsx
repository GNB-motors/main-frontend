import React, { useState, useEffect } from 'react';
import DefaultAvatar from '../../assets/default-avatar.png';
import { ProfileService } from './ProfileService';
import { getThemeCSS } from '../../utils/colorTheme';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

import {
    User, Mail, Phone, MapPin, Building2, Hash,
    CreditCard, ShieldCheck, AlertCircle,
} from 'lucide-react';

// ── Field card ────────────────────────────────────────────────────────────────

const Field = ({ icon: Icon, label, value }) => (
    <div className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card px-4 py-3.5 shadow-sm transition-shadow hover:shadow-md">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
            <Icon size={15} />
        </div>
        <div className="min-w-0 flex-1">
            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
            </p>
            <p className="truncate text-sm font-medium text-foreground">
                {value || <span className="italic text-muted-foreground/60">Not provided</span>}
            </p>
        </div>
    </div>
);

// ── Loading skeleton ──────────────────────────────────────────────────────────

const ProfileSkeleton = () => (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6">
        {/* Hero card */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="flex items-center gap-5">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-56" />
                    <div className="flex gap-2 pt-1">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
        {/* Fields */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
        </div>
    </div>
);

// ── Status badge helper ───────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
    const active = status?.toLowerCase() === 'active';
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold
            ${active
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {status || 'Unknown'}
        </span>
    );
};

// ── UserInfo ──────────────────────────────────────────────────────────────────

const UserInfo = ({ user, organization }) => {
    const initials = [user?.firstName, user?.lastName]
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'U';

    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';

    return (
        <div className="space-y-5">
            {/* ── Hero card ── */}
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                {/* Decorative gradient banner */}
                <div className="h-24 w-full bg-gradient-to-r from-primary/80 via-primary to-primary/60" />

                <div className="px-6 pb-6">
                    {/* Avatar — overlaps banner */}
                    <div className="-mt-10 flex items-end justify-between">
                        <Avatar className="h-20 w-20 ring-4 ring-card shadow-lg">
                            <AvatarImage src={DefaultAvatar} alt={fullName} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>

                        <div className="mb-1 flex items-center gap-2">
                            <StatusBadge status={user?.status} />
                            <Badge
                                variant="outline"
                                className="capitalize border-border/60 bg-card text-xs font-semibold"
                            >
                                {user?.role || 'Unknown role'}
                            </Badge>
                        </div>
                    </div>

                    {/* Name + org */}
                    <div className="mt-3 space-y-0.5">
                        <h2 className="text-xl font-bold text-foreground">{fullName}</h2>
                        <p className="text-sm font-medium text-muted-foreground">
                            {organization?.companyName || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                            {user?.email || organization?.ownerEmail || '—'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Section: Personal info ── */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <User size={13} className="text-muted-foreground" />
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Personal Information
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field icon={User}        label="First Name"     value={user?.firstName} />
                    <Field icon={User}        label="Last Name"      value={user?.lastName} />
                    <Field icon={Mail}        label="Email"          value={user?.email} />
                    <Field icon={Phone}       label="Mobile Number"  value={user?.mobileNumber} />
                    <Field icon={MapPin}      label="Location"       value={user?.location} />
                    <Field icon={ShieldCheck} label="Role"           value={user?.role} />
                </div>
            </div>

            {/* ── Section: Organisation info ── */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <Building2 size={13} className="text-muted-foreground" />
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Organisation Details
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field icon={Building2}  label="Company Name"     value={organization?.companyName} />
                    <Field icon={Mail}       label="Owner Email"       value={organization?.ownerEmail} />
                    <Field icon={CreditCard} label="GSTIN"             value={organization?.gstin} />
                    <Field icon={Hash}       label="Organisation ID"   value={organization?._id} />
                </div>
            </div>

            {/* ── Notice ── */}
            <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3.5">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-500" />
                <p className="text-xs text-amber-700">
                    Your information is read-only. To make changes, please contact your administrator.
                </p>
            </div>
        </div>
    );
};

// ── ProfilePage ───────────────────────────────────────────────────────────────

const ProfilePage = () => {
    const [userData, setUserData] = useState(null);
    const [organizationData, setOrganizationData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [themeColors, setThemeColors] = useState(getThemeCSS());

    useEffect(() => {
        setThemeColors(getThemeCSS());
    }, []);

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
                    localStorage.setItem('primaryThemeColor', user.primaryThemeColor || '#007bff');
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

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-6" style={themeColors}>
            {error ? (
                <Card className="border-destructive/40">
                    <CardContent className="flex items-center justify-center gap-2 py-14 text-sm text-destructive">
                        <AlertCircle size={16} />
                        {error}
                    </CardContent>
                </Card>
            ) : (!userData || !organizationData) ? (
                <Card>
                    <CardContent className="py-14 text-center text-sm text-muted-foreground">
                        Could not load profile data.
                    </CardContent>
                </Card>
            ) : (
                <UserInfo user={userData} organization={organizationData} />
            )}
        </div>
    );
};

export default ProfilePage;
