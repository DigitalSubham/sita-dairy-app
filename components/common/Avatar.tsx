
import { StyleSheet, Text, View } from 'react-native';

type OfflineNameAvatarProps = {
    name: string;
    size?: number;  // optional
    color?: string; // optional
};

// Helper function to get initials (robust to extra spaces)

const getInitials = (name: string) => {
    const trimmed = name?.trim();
    if (!trimmed) return '';

    // Split by any whitespace and drop empty parts
    const parts = trimmed.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
        // First + last initials
        const first = parts[0][0] ?? '';
        const last = parts[parts.length - 1][0] ?? '';
        return (first + last).toUpperCase();
    } else {
        // Single word: take first two letters
        const word = parts[0];
        // Optionally, strip non-letter characters from the start
        const cleaned = word.replace(/^[^A-Za-z]+/, '');
        const two = cleaned.slice(0, 2);
        return two.toUpperCase();
    }
};


const OfflineNameAvatar = ({ name, size = 50, color = "#2F3192" }: OfflineNameAvatarProps) => {
    const initials = getInitials(name);
    const fontSize = size / 2.5;

    return (
        <View
            style={[
                styles.avatarContainer,
                { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
            ]}
            // Optional: accessibility
            accessibilityLabel={`Avatar for ${name} with initials ${initials}`}
            accessible
        >
            <Text style={[styles.avatarText, { fontSize }]}>{initials}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    avatarContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default OfflineNameAvatar;