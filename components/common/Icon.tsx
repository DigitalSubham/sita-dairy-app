// @/components/common/Icon.tsx
import { Image } from "react-native";

const icons = {
    home: require("@/assets/icons/home.png"),
    wallet: require("@/assets/icons/wallet.png"),
    products: require("@/assets/icons/products.png"),
    ledger: require("@/assets/icons/ledger.png"),
    "up-arrow": require("@/assets/icons/up-arrow.png"),
    user: require("@/assets/icons/user.png"),
    users: require("@/assets/icons/man.png"),
    rearrange: require("@/assets/icons/rearrange.png"),
    collection: require("@/assets/icons/collection.png"),
    entry: require("@/assets/icons/dataC.png"),
    settings: require("@/assets/icons/settings.png"),
    language: require("@/assets/icons/languages.png")
};

export default function Icon(name: keyof typeof icons) {
    return (size: number, color: string) => (
        <Image
            source={icons[name]}
            style={{ width: size, height: size, }}
            resizeMode="contain"
        />
    );
}
