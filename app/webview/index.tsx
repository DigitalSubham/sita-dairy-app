import { CustomHeader } from "@/components/common/CustomHeader";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function InAppWebViewScreen() {
    const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
    const [loading, setLoading] = useState(true);

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <CustomHeader
                title={title || "webview.title"}
                showBackButton
                showMenuButton={false}
            />

            <View style={styles.webviewContainer}>
                <WebView
                    source={{ uri: url }}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    startInLoadingState
                />
                {loading && (
                    <View style={styles.loaderOverlay}>
                        <ActivityIndicator size="large" color="#6366F1" />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    webviewContainer: {
        flex: 1,
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8FAFC",
    },
});
