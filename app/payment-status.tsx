import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

// PhonePe redirects here after checkout (see Linking.createURL("payment-status")
// in components/buyer/AddAmountModal.tsx). The actual result handling happens via
// the Linking listener registered there; this route only exists so expo-router's
// own deep-link matching has somewhere real to land instead of falling through to
// +not-found, and immediately bounces back to wherever the user came from.
export default function PaymentStatusBounce() {
  const router = useRouter();

  useEffect(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }, [router]);

  return <View style={{ flex: 1, backgroundColor: "#F8FAFC" }} />;
}
