import { api } from "@/constants/api";
import { Customer } from "@/constants/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";

export const getCurrentDate = () => {
  return new Date().toISOString().split("T")[0];
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

export const getCurrentShift = () => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "Morning" : "Evening";
};

export const calculateTotal = (w: string, r: string) => {
  const weightNum = Number.parseFloat(w) || 0;
  const rateNum = Number.parseFloat(r) || 0;
  return (weightNum * rateNum).toFixed(2);
};

export const handleDeleteEntry = async (
  entryId: string,
  fetchTodayEntries: () => void,
  token: string
) => {
  Alert.alert("Confirm Delete", "Are you sure you want to delete this entry?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Delete",
      style: "destructive",
      onPress: () => {
        (async () => {
          try {
            const response = await fetch(`${api.deleteRecord}/${entryId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await response.json();
            if (data.success) {
              Alert.alert("Success", "Entry deleted successfully");
              fetchTodayEntries();
            } else {
              Alert.alert("Error", data.message);
            }
          } catch (error) {
            console.error("Delete Error:", error);
            Alert.alert("Error", "Failed to delete entry");
          }
        })();
      },
    },
  ]);
};

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export const fetchTodayEntries = async (
  apiUrl: string,
  setLoading: (loading: boolean) => void,
  date: string | undefined,
  shift: string | undefined,
  setData: (data: any[]) => void
): Promise<void> => {
  setLoading(true);
  try {
    const storedToken = await AsyncStorage.getItem("token");
    if (!storedToken) {
      Toast.show({
        type: "error",
        text1: "Authentication token not found",
      });
      return;
    }
    const parsedToken: string = JSON.parse(storedToken);
    const queryParams = new URLSearchParams();
    if (date)
      queryParams.append("date", date ?? format(new Date(), "yyyy-MM-dd"));
    queryParams.append(
      "shift",
      shift ?? (new Date().getHours() < 12 ? "Morning" : "Evening")
    );

    const response = await fetch(`${apiUrl}?${queryParams}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${parsedToken}`,
      },
    });
    const data: ApiResponse<any[]> = await response.json();
    if (data.success) {
      setData(data.data ?? []);
    }
  } catch (error) {
    console.error("Error fetching entries:", error);
  } finally {
    setLoading(false);
  }
};

export const sortByPosition = (list: Customer[]) =>
  [...list].sort((a, b) => {
    if (a.positionNo === undefined && b.positionNo === undefined) return 0;
    if (a.positionNo === undefined) return 1;
    if (b.positionNo === undefined) return -1;
    return a.positionNo - b.positionNo;
  });

export const buildMarkedRange = (start: string, end: string) => {
  const marked: any = {};
  let current = new Date(start);
  const last = new Date(end);

  while (current <= last) {
    const dateStr = format(current, "yyyy-MM-dd");

    marked[dateStr] = {
      color: "#0ea5e9",
      textColor: "white",
      ...(dateStr === start && { startingDay: true }),
      ...(dateStr === end && { endingDay: true }),
    };

    current.setDate(current.getDate() + 1);
  }

  return marked;
};
