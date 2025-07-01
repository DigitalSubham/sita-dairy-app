import { formatDate } from "@/utils/helper";
import type React from "react";
import { Image, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

interface Farmer {
  id: string;
  name: string;
  profilePic: string;
  totalMilk: number;
  pendingAmount: number;
}
interface MilkCollectionData {
  _id: string;
  byUser: Farmer;
  fat: string;
  date: string;
  price: string;
  rate: string;
  shift: string;
  snf: string;
  weight: string;
}

interface TransactionItemProps {
  data: MilkCollectionData;
  delay?: number;
}

const TransactionItem: React.FC<TransactionItemProps> = ({
  data,
  delay = 0,
}) => {


  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(600)}
      style={styles.transactionItem}
    >
      <Image
        source={{ uri: data.byUser.profilePic }}
        style={styles.transactionprofilePic}
      />
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionName}>{data.byUser.name}</Text>
        <Text style={styles.transactionDate}>{formatDate(data.date)}</Text>
        <Text style={styles.transactionSubInfo}>
          SNF: {data.snf}% • Fat: ₹{data.fat}% • Rate: ₹{data.rate}/L
        </Text>
      </View>
      <View style={styles.transactionDetails}>
        <View style={styles.transactionTypeBadge}>
          <Text style={styles.transactionTypeText}>{data.shift}</Text>
        </View>
        <Text style={styles.transactionAmount}>{data.weight}L</Text>
        <Text style={styles.transactionPrice}>₹{data.price}</Text>
        {/* <Text style={styles.transactionTime}>{formatTime(data.createdAt)}</Text> */}
      </View>
    </Animated.View>
  );
};

const styles = {
  transactionItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  transactionprofilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1A1A1A",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 2,
  },
  transactionSubInfo: {
    fontSize: 12,
    color: "#888888",
  },
  transactionDetails: {
    alignItems: "flex-end" as const,
  },
  transactionTypeBadge: {
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  transactionTypeText: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: "#2E7D32",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2E7D32",
    marginBottom: 2,
  },
  transactionPrice: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#1A1A1A",
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: "#888888",
  },
};

export default TransactionItem;
