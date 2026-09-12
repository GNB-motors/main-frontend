import { useState, useEffect } from "react";
import apiClient from "../../utils/axiosConfig";
import useApi from "../../hooks/useApi";

// Start of today in IST, as an ISO instant for the backend window.
const startOfTodayIST = () => {
  const istNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  istNow.setHours(0, 0, 0, 0);
  const istOffsetMs = 5.5 * 3600 * 1000;
  return new Date(istNow.getTime() - istOffsetMs).toISOString();
};

/**
 * Today's estimated ₹ at risk across the fleet, split by theft (siphon
 * suspects), detours and idling. Figures come from /api/owner-value/money and
 * are estimates — please review before acting.
 *
 * Exposed as a hook so the dashboard can render it through the shared StatCard
 * and keep it visually identical to the other Fleet Overview tiles.
 */
export const useOwnerValueDigest = () => {
  const [money, setMoney] = useState(null);

  const { data: moneyResponse, loading: isLoading, error: moneyError } = useApi(
    (signal) => apiClient.get(`/api/owner-value/money`, {
      params: { from: startOfTodayIST() },
      signal,
    }),
    []
  );

  useEffect(() => {
    if (moneyResponse) setMoney(moneyResponse.data?.data || null);
  }, [moneyResponse]);

  useEffect(() => {
    if (moneyError) {
      console.error("API Error fetching owner value digest:", moneyError.response?.data || moneyError.message);
      setMoney(null);
    }
  }, [moneyError]);

  return { money, isLoading };
};

export default useOwnerValueDigest;
