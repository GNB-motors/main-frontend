import React, { useState, useEffect } from 'react';
import DefaultAvatar from '../../assets/default-avatar.png';
import { ProfileService } from './ProfileService';
import { getThemeCSS } from '../../utils/colorTheme';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// ── helpers ──────────────────────────────────────────────────────────────────

const Field = ({ label, value }) => (
    <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
        </span>
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
            {value || '—'}
        </div>
    </div>
);

// ── UserInfo ──────────────────────────────────────────────────────────────────

const UserInfo = ({ user, organization }) => {
    const initials = [user?.firstName, user?.lastName]
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'U';

    const statusVariant =
        user?.status?.toLowerCase() === 'active' ? 'default' : 'secondary';

    return (
        <Card className="w-full shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold">Your account information</CardTitle>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6 space-y-8">
                {/* Avatar row */}
                <div className="flex items-center gap-5">
                    <Avatar className="h-20 w-20 ring-2 ring-border">
                        <AvatarImage src={DefaultAvatar} alt="User Avatar" />
                        <AvatarFallback className="text-xl font-bold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1">
                        <p className="text-lg font-bold leading-tight">
                            {organization?.companyName || 'Company Name'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {organization?.ownerEmail || user?.email || '—'}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                            <Badge variant="outline" className="capitalize text-xs">
                                {user?.role || 'Unknown role'}
                            </Badge>
                            <Badge variant={statusVariant} className="capitalize text-xs">
                                {user?.status || 'Unknown status'}
                            </Badge>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Fields grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="First Name"     value={user?.firstName} />
                    <Field label="Last Name"      value={user?.lastName} />
                    <Field label="Email"          value={user?.email} />
                    <Field label="Mobile Number"  value={user?.mobileNumber} />
                    <Field label="Location"       value={user?.location} />
                    <Field label="GSTIN"          value={organization?.gstin} />
                    <Field label="Company Name"   value={organization?.companyName} />
                    <Field label="Organisation ID" value={organization?._id} />
                </div>

                <Separator />

                {/* Notice */}
                <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-center">
                    <p className="text-sm italic text-muted-foreground">
                        To edit your information, please contact the administrator.
                    </p>
                </div>
            </CardContent>
        </Card>
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

    const renderContent = () => {
        if (isLoading) {
            return (
                <Card className="w-full shadow-sm">
                    <CardContent className="flex items-center justify-center py-16">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
                            <p className="text-sm">Loading profile…</p>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (error) {
            return (
                <Card className="w-full border-destructive/40 shadow-sm">
                    <CardContent className="py-10 text-center text-sm text-destructive">
                        {error}
                    </CardContent>
                </Card>
            );
        }

        if (!userData || !organizationData) {
            return (
                <Card className="w-full shadow-sm">
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                        Could not load profile data.
                    </CardContent>
                </Card>
            );
        }

        return <UserInfo user={userData} organization={organizationData} />;
    };

    return (
        <div className="w-full max-w-3xl mx-auto py-6 px-4" style={themeColors}>
            {renderContent()}
        </div>
    );
};

export default ProfilePage;
