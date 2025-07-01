import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

interface CustomerCardProps {
  customer: {
    id: string;
    name: string;
    email: string;
    totalWalletAmount: number;
    CouponsRedeemed: number;
    pointsWithdrawn: number;
    profilePic: string;
    joinDate: string;
  };
}

export function CustomerCard({ customer }: CustomerCardProps) {
  const router = useRouter();

  return (
    <Pressable
      style={styles.cardContainer}
      onPress={() => router.push(`/customer/${customer.id}`)}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <Image
            source={{ uri: customer.profilePic }}
            style={styles.profilePic}
          />
          <View style={styles.headerText}>
            <Text style={styles.name}>{customer.name}</Text>
            <Text style={styles.email}>{customer.email}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['rgba(0,122,255,0.2)', 'rgba(0,122,255,0.1)']}
            style={styles.statItem}
          >
            <Text style={styles.statValue}>{customer.totalWalletAmount}</Text>
            <Text style={styles.statLabel}>Wallet Points</Text>
          </LinearGradient>

          <LinearGradient
            colors={['rgba(88,86,214,0.2)', 'rgba(88,86,214,0.1)']}
            style={styles.statItem}
          >
            <Text style={styles.statValue}>{customer.CouponsRedeemed}</Text>
            <Text style={styles.statLabel}>Coupons Used</Text>
          </LinearGradient>

          <LinearGradient
            colors={['rgba(52,199,89,0.2)', 'rgba(52,199,89,0.1)']}
            style={styles.statItem}
          >
            <Text style={styles.statValue}>{customer.pointsWithdrawn}</Text>
            <Text style={styles.statLabel}>Points Withdrawn</Text>
          </LinearGradient>
        </View>

        <View style={styles.footer}>
          <Text style={styles.joinDate}>
            Member since {format(new Date(customer.joinDate), 'MMM dd, yyyy')}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profilePic: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  joinDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
});
