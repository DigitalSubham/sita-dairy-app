import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

type SetState<T> = (value: T) => void;

interface FetchOptions<T> {
  apiUrl: string;
  setLoading: SetState<boolean>;
  setRefreshing: SetState<boolean>;
  setData: SetState<T>;
  extractData?: (responseJson: any) => T;
  navigation: any; // pass navigation to redirect
}

export const fetchData = async <T>({
  apiUrl,
  setLoading,
  setRefreshing,
  setData,
  extractData,
  navigation,
}: FetchOptions<T>): Promise<void> => {
  // Get token from AsyncStorage
  const token = (await AsyncStorage.getItem("token")) || "";

  if (!token) {
    // Redirect to login immediately
    navigation.navigate("Login");
    return;
  }

  try {
    setLoading(true);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();

    const result: T = extractData
      ? extractData(data)
      : data?.data && Array.isArray(data.data)
      ? data.data
      : [];

    setData(result);
  } catch (error) {
    console.error("Error fetching data:", error);
    Alert.alert("Error", "Failed to load data");
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};
