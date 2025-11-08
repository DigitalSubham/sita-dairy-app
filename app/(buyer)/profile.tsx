import { ProfileHeader } from "@/components/common/HeaderVarients";
import ProfileComponent from "@/components/common/Profile";
import { api } from "@/constants/api";
import { setReduxUser } from "@/store/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";

export default function ProfileScreen() {
    const [token, setToken] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState<boolean>(true);
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchToken = async () => {
            const storedToken = await AsyncStorage.getItem("token");
            setToken(storedToken ? JSON.parse(storedToken) : "");
        };
        fetchToken();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch(api.getUser, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error("Network response was not ok");

                const responseData = await response.json();

                if (responseData.success) {
                    dispatch(setReduxUser(responseData.user));
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchData();
        }
    }, [token]);

    return (
        <SafeAreaView style={styles.container}>
            <ProfileHeader setIsEditing={setIsEditing} isEditing={isEditing} />
            <ProfileComponent setIsEditing={setIsEditing} isEditing={isEditing} />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111827",
    },
});