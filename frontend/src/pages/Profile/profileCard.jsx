import { AlertCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import DefaultAvatar from '../../assets/default-avatar.png';
import { StatusBadge } from './profileAtoms';

/** Left-hand identity card: avatar, org quick-stats, read-only notice. */
export const ProfileCard = ({ user, organization }) => {
  const initials =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(41,64,211,0.1)]">
      {/* Blue banner */}
      <div className="relative h-28 mb-14 w-full bg-linear-to-br from-blue-600 via-blue-500 to-indigo-600">
        {/* subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />
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
        <p className="mt-1 text-sm font-medium text-slate-500">
          {organization?.companyName || '—'}
        </p>
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
            <p className="mt-1 truncate text-sm font-bold text-blue-700">
              {organization?.companyName || '—'}
            </p>
          </div>
          <div className="rounded-xl bg-indigo-50 px-3 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">GSTIN</p>
            <p className="mt-1 truncate text-sm font-bold text-indigo-700">
              {organization?.gstin || '—'}
            </p>
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

export const ProfileSkeleton = () => (
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
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <Skeleton className="mb-4 h-4 w-40" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  </div>
);
