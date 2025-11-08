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
  payload?: any;
  method?: "GET" | "POST" | "PUT" | "DELETE";
}

export const fetchData = async <T>({
  apiUrl,
  setLoading,
  setRefreshing,
  setData,
  extractData,
  navigation,
  payload,
  method = "GET",
}: FetchOptions<T>): Promise<void> => {
  // Get token from AsyncStorage
  const token = (await AsyncStorage.getItem("token")) || "";
  const parsedToken: string = JSON.parse(token);

  if (!token) {
    setTimeout(() => navigation.navigate("Login"), 0);
    return;
  }

  try {
    setLoading(true);

    const options: RequestInit = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${parsedToken}`,
      },
    };

    if (payload) {
      options.body = JSON.stringify(payload);
      options.method = method; // or PUT/PATCH if needed
    }

    const response = await fetch(apiUrl, options);

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
