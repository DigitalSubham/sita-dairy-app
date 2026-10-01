import { api } from "@/constants/api";
import { Customer, CustomerRole } from "@/constants/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

type UseCustomersOptions = {
  role?: CustomerRole;
  // true = source from the dropdown API (/general/dropdown): the full,
  // unpaginated list of *active* users of a role, meant for picker/filter UI
  // (farmer/buyer selection, report filters). false/omitted = the customer
  // directory API (/user/all-customers), which includes inactive users too.
  activeOnly?: boolean;
  // Only used against the directory API — the dropdown API has no search
  // param, since pickers filter their (already in-memory) list client-side.
  search?: string;
  // Opt-in: when set, the directory API is fetched in `pageSize`-row pages
  // via loadMore() instead of once in a single (backend-capped) request.
  // Omit this for callers that need the *complete* role roster back from a
  // single fetch (e.g. drag-to-reorder) — they keep their original behavior.
  pageSize?: number;
};

export default function useCustomers({
  role,
  activeOnly,
  search,
  pageSize,
}: UseCustomersOptions = {}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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

  const fetchCustomers = useCallback(
    async (pageToFetch: number, { append }: { append: boolean }) => {
      if (!token) return;
      try {
        setError(null);
        if (append) {
          setLoadingMore(true);
        } else if (!isRefreshingRef.current) {
          setLoading(true);
        }

        if (activeOnly) {
          const res = await fetch(api.dropdownUsers, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ code: "USERS", data: { role } }),
          });
          if (!res.ok) throw new Error("Failed to fetch customers");
          const data = await res.json();
          setCustomers(data.user ?? []);
          setTotalCount(data.user?.length ?? 0);
          return;
        }

        const params = new URLSearchParams();
        if (role) params.set("role", role);
        if (search) params.set("search", search);
        if (pageSize) {
          params.set("page", String(pageToFetch));
          params.set("limit", String(pageSize));
        }
        const query = params.toString();
        const res = await fetch(
          query ? `${api.getAllCustomers}?${query}` : api.getAllCustomers,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (!res.ok) throw new Error("Failed to fetch customers");
        const data = await res.json();
        const rows: Customer[] = data.users ?? [];
        setTotalCount(data.totalCount ?? rows.length);
        setCustomers((prev) => (append ? [...prev, ...rows] : rows));
        setPage(pageToFetch);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isRefreshingRef.current = false;
        setRefreshing(false);
      }
    },
    [token, role, activeOnly, search, pageSize],
  );

  // (Re-)fetch from page 1 whenever the token arrives or the filters change.
  useEffect(() => {
    if (token) {
      fetchCustomers(1, { append: false });
    }
    // fetchCustomers already depends on every filter that should trigger this
  }, [token, fetchCustomers]);

  // Refresh function to expose
  const refresh = useCallback(() => {
    isRefreshingRef.current = true;
    setRefreshing(true);
    fetchCustomers(1, { append: false });
  }, [fetchCustomers]);

  const hasMore = !!pageSize && customers.length < totalCount;

  const loadMore = useCallback(() => {
    if (!pageSize || loadingMore || loading || !hasMore) return;
    fetchCustomers(page + 1, { append: true });
  }, [pageSize, loadingMore, loading, hasMore, page, fetchCustomers]);

  return {
    customers,
    loading,
    error,
    refreshing,
    refresh,
    token,
    totalCount,
    hasMore,
    loadingMore,
    loadMore,
  };
}
