import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Fuel, Route, Timer, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import apiClient from "../../utils/axiosConfig";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

// Start of today in IST, as an ISO instant for the backend window.
const startOfTodayIST = () => {
  const istNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  istNow.setHours(0, 0, 0, 0);
  const istOffsetMs = 5.5 * 3600 * 1000;
  return new Date(istNow.getTime() - istOffsetMs).toISOString();
};

/**
 * Daily digest tile: today's estimated ₹ at risk across the fleet, split by
 * theft (siphon suspects), detours and idling. Figures come from
 * /api/owner-value/money and are estimates — please review before acting.
 */
const OwnerValueDigest = () => {
  const [money, setMoney] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMoney = async () => {
      try {
        const response = await apiClient.get(`/api/owner-value/money`, {
          params: { from: startOfTodayIST() },
        });
        setMoney(response.data?.data || null);
      } catch (error) {
        console.error("API Error fetching owner value digest:", error.response?.data || error.message);
        setMoney(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMoney();
  }, []);

  if (isLoading) {
    return <Skeleton className="h-[110px] w-full rounded-xl" />;
  }
  if (!money) return null;

  const split = [
    { label: "Fuel loss", value: money.money?.theftLossInr, icon: <Fuel size={14} /> },
    { label: "Detours", value: money.money?.detourWasteInr, icon: <Route size={14} /> },
    { label: "Idling", value: money.money?.idlingWasteInr, icon: <Timer size={14} /> },
  ];

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}
          >
            <ShieldAlert size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Est. ₹ at risk today
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(money.totalWasteInr)}
            </p>
          </div>
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-3 sm:justify-end">
          {split.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground"
              title="Estimate from telemetry — please review"
            >
              {s.icon}
              {s.label}: <span className="font-semibold text-foreground">{formatCurrency(s.value)}</span>
            </span>
          ))}
          <Link
            to="/owner-alerts"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Review alerts <ArrowRight size={12} />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default OwnerValueDigest;
