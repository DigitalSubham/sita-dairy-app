import { api } from "@/constants/api";
import { Customer, CustomerRole } from "@/constants/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

export default function useCustomers({
  role,
  activeOnly,
}: { role?: CustomerRole; activeOnly?: boolean } = {}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");
  const isRefreshingRef = useRef(false);

  // Load token once
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        setToken(storedToken ? JSON.parse(storedToken) : "");
      } catch {
        setError("Failed to load auth token");
        setLoading(false);
      }
    };
    fetchToken();
  }, []);

  const fetchCustomers = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      if (!isRefreshingRef.current) setLoading(true);

      const res = activeOnly
        ? await fetch(api.dropdownUsers, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ code: "USERS", data: { role } }),
          })
        : await fetch(
            role ? `${api.getAllCustomers}?role=${role}` : api.getAllCustomers,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomers(activeOnly ? data.user : data.users);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
    } finally {
      setLoading(false);
      isRefreshingRef.current = false;
      setRefreshing(false);
    }
  }, [token, role, activeOnly]);

  // Fetch customers when token is available
  useEffect(() => {
    if (token) {
      fetchCustomers();
    }
  }, [token, fetchCustomers]);

  // Refresh function to expose
  const refresh = useCallback(() => {
    isRefreshingRef.current = true;
    setRefreshing(true);
    fetchCustomers();
  }, [fetchCustomers]);

  return { customers, loading, error, refreshing, refresh, token };
}
