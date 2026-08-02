import { useState, useEffect } from "react";
import apiClient from "../../utils/axiosConfig";

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

  return { money, isLoading };
};

export default useOwnerValueDigest;
