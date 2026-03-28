import React, { useEffect } from 'react';
import { X, FileText, Truck, Gauge, Weight } from 'lucide-react';

const WeightCertificateModal = ({ isOpen, onClose, trip }) => {

    useEffect(() => {
        if (isOpen) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatCurrency = (value) => {
        if (typeof value !== 'number') return '-';
        return `\u20B9${value.toLocaleString('en-IN')}`;
    };

    const driverName = trip?.driver?.fullName || trip?.driverName || '-';
    const vehicleReg = trip?.vehicle?.registrationNumber || trip?.vehicleRegNo || '-';
    const routeName = trip?.route?.name || trip?.route || '-';
    const grossWeight = trip?.weights?.grossWeight || trip?.grossWeight;
    const tareWeight = trip?.weights?.tareWeight || trip?.tareWeight;
    const netWeight = trip?.weights?.netWeight || trip?.netWeight;
    const revenue = trip?.performance?.totalRevenue;
    const expense = trip?.performance?.totalExpense;
    const profit = trip?.performance?.netProfit;
    const weightCertUrl = trip?.weightCertificateDoc?.publicUrl;
    const hasWeightData = grossWeight || tareWeight || netWeight;

    return (
        <div
            className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-[95%] max-w-[1100px] max-h-[85vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 m-0">
                        <FileText size={20} className="text-blue-600" />
                        Weight Certificate
                    </h3>
                    <button
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 border-none rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Trip Info */}
                    <p className="flex items-center gap-2 text-sm font-semibold text-gray-700 m-0 mb-3">
                        <Truck size={16} className="text-blue-600" />
                        Trip Information
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                            <label className="block text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1.5">Trip Date</label>
                            <p className="m-0 text-base font-semibold text-gray-900">{formatDate(trip?.tripDate)}</p>
                        </div>
                        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                            <label className="block text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1.5">Vehicle</label>
                            <p className="m-0 text-base font-semibold text-gray-900">{vehicleReg}</p>
                        </div>
                        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                            <label className="block text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1.5">Driver</label>
                            <p className="m-0 text-base font-semibold text-gray-900">{driverName}</p>
                        </div>
                        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                            <label className="block text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1.5">Route</label>
                            <p className="m-0 text-base font-semibold text-gray-900">{routeName}</p>
                        </div>
                    </div>

                    <div className="h-px bg-gray-200 my-5" />

                    {/* Weight Details */}
                    <p className="flex items-center gap-2 text-sm font-semibold text-gray-700 m-0 mb-3">
                        <Weight size={16} className="text-blue-600" />
                        Weight Details
                    </p>

                    {hasWeightData ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                                <label className="block text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1.5">Gross Weight</label>
                                <p className="m-0 text-base font-semibold text-gray-900">
                                    {grossWeight ? `${grossWeight.toLocaleString('en-IN')} kg` : '-'}
                                </p>
                            </div>
                            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                                <label className="block text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1.5">Tare Weight</label>
                                <p className="m-0 text-base font-semibold text-gray-900">
                                    {tareWeight ? `${tareWeight.toLocaleString('en-IN')} kg` : '-'}
                                </p>
                            </div>
                            <div className="col-span-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                                <label className="block text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1.5">Net Weight</label>
                                <p className="m-0 text-xl font-semibold text-blue-600">
                                    {netWeight ? `${netWeight.toLocaleString('en-IN')} kg` : '-'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-400">
                            <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                            <p className="m-0">No weight certificate data available for this trip.</p>
                        </div>
                    )}

                    {weightCertUrl && (
                        <>
                            <div className="h-px bg-gray-200 my-5" />
                            <p className="flex items-center gap-2 text-sm font-semibold text-gray-700 m-0 mb-3">
                                <FileText size={16} className="text-blue-600" />
                                Certificate Document
                            </p>
                            <img
                                src={weightCertUrl}
                                alt="Weight Certificate"
                                className="w-full rounded-lg cursor-pointer border border-gray-200 hover:opacity-90 transition-opacity"
                                onClick={() => window.open(weightCertUrl, '_blank')}
                            />
                            <p className="text-xs text-gray-400 text-center mt-2 m-0">
                                Click image to view full size
                            </p>
                        </>
                    )}

                    <div className="h-px bg-gray-200 my-5" />

                    {/* Financial Summary */}
                    <p className="flex items-center gap-2 text-sm font-semibold text-gray-700 m-0 mb-3">
                        <Gauge size={16} className="text-blue-600" />
                        Financial Summary
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                            <label className="block text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1.5">Revenue</label>
                            <p className="m-0 text-base font-semibold text-green-600">{formatCurrency(revenue)}</p>
                        </div>
                        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                            <label className="block text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1.5">Expense</label>
                            <p className="m-0 text-base font-semibold text-red-600">{formatCurrency(expense)}</p>
                        </div>
                        <div className="col-span-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                            <label className="block text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1.5">Net Profit</label>
                            <p className={`m-0 text-xl font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(profit)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeightCertificateModal;
