import { api } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

type CustomerRole = "User" | "Farmer" | "Buyer";

type Customer = {
  _id: string;
  id: string;
  name: string;
  profilePic: string;
  isVerified: boolean;
  mobile: string;
  fatherName: string;
  dailryName: string;
  collectionCenter: string;
  createdAt: string;
  role: CustomerRole;
};

export default function useCustomers({ role }: { role?: CustomerRole } = {}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");

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
      if (!refreshing) setLoading(true);

      const url = role
        ? `${api.getAllCustomers}?role=${role}`
        : api.getAllCustomers;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomers(data.users);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, refreshing, role]);

  // Fetch customers when token is available
  useEffect(() => {
    if (token) {
      fetchCustomers();
    }
  }, [token, fetchCustomers]);

  // Refresh function to expose
  const refresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  return { customers, loading, error, refreshing, refresh, token };
}
