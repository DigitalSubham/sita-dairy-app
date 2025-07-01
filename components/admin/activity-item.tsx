import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

type ActivityItemProps = {
  user: string;
  action: string;
  time: string;
  avatar: string;
  index: number;
};

export function ActivityItem({
  user,
  action,
  time,
  avatar,
  index,
}: ActivityItemProps) {
  return (
    <Animated.View
      entering={FadeInRight.delay(100 * index)}
      style={styles.activityItem}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: avatar }}
          style={styles.avatar}
          defaultSource={require('../../assets/images/favicon.png')}
        />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>
          <Text style={styles.userName}>{user}</Text> {action}
        </Text>
        <Text style={styles.timeText}>{time}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    color: '#e5e7eb',
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  timeText: {
    color: '#9ca3af',
    fontSize: 12,
  },
});
