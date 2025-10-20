import { ReaarangeUsersHeader } from "@/components/common/HeaderVarients"
import DairyLoadingScreen from "@/components/Loading"
import { api } from "@/constants/api"

import { Customer, CustomerRole } from "@/constants/types"
import useCustomers from "@/hooks/useCustomer"
import { sortByPosition } from "@/utils/helper"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import { Alert, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import DraggableFlatList, { ScaleDecorator, type RenderItemParams } from "react-native-draggable-flatlist"
import { GestureHandlerRootView } from "react-native-gesture-handler"




export default function Rearrange() {

    const [isEditMode, setIsEditMode] = useState(false)
    const [selectedRole, setSelectedRole] = useState<CustomerRole>("Farmer")

    const { customers, loading, refresh, token } = useCustomers({
        role: selectedRole,
    })

    const [users, setUsers] = useState<Customer[]>(sortByPosition(customers));

    useEffect(() => setUsers(sortByPosition(customers)), [customers]);

    useFocusEffect(
        useCallback(() => setUsers(sortByPosition(customers)), [customers])
    );



    const renderUserCard = ({ item, drag, isActive }: RenderItemParams<Customer>) => {
        return (
            <ScaleDecorator>
                <TouchableOpacity
                    onLongPress={drag}
                    disabled={!isEditMode}
                    style={[styles.userCard, isActive && styles.activeCard, !isEditMode && styles.disabledCard]}
                >
                    <View style={styles.cardContent}>
                        <Image source={{ uri: item.profilePic }} style={styles.userImage} />
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{item.name} - {item.positionNo}</Text>
                            <Text style={styles.userEmail}>{item.mobile}</Text>
                            <Text style={styles.userRole}>{item.role}</Text>
                        </View>
                        <View style={styles.cardActions}>
                            <Text style={styles.userId}>#{item.id}</Text>
                            {isEditMode && <Ionicons name="reorder-three-outline" size={24} color="#666" style={styles.dragIcon} />}
                        </View>
                    </View>
                </TouchableOpacity>
            </ScaleDecorator>
        )
    }

    const handleSaveOrder = async () => {
        try {
            setIsEditMode(false)
            const updatedUsers = JSON.stringify({
                users: users.map(({ _id, positionNo }) => ({ userId: _id, positionNo })),
            })

            // Save updated users with their positionNos to the server
            const response = await fetch(api.changePosition, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`, // assuming token from useCustomers
                },
                body: updatedUsers,
            })

            const data = await response.json()

            if (data.success) {
                refresh()
            } else {
                throw new Error(data.message || "Failed to save user order")
            }
        } catch (error) {
            console.error("Failed to save user order:", error);
            Alert.alert("Error", "Failed to save user order.");
        }
    }


    const handleResetOrder = () => {
        setUsers(customers)
        Alert.alert("Reset", "User order has been reset to default!")
    }


    const handleRoleFilter = useCallback((role: CustomerRole) => {
        setSelectedRole(role)
    }, [])

    if (loading) {
        return <DairyLoadingScreen loading={loading} loadingText="Syncing your Customer data..." />
    }



    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ReaarangeUsersHeader selectedRole={selectedRole} onRoleFilter={handleRoleFilter} isEditMode={isEditMode} setIsEditMode={setIsEditMode} handleResetOrder={handleResetOrder} handleSaveOrder={handleSaveOrder} />

                {/* User List */}
                <DraggableFlatList
                    data={users}
                    onDragEnd={({ data }) => {
                        const updatedUsers = data.map((user, index) => {
                            return { ...user, positionNo: index + 1 };
                        });

                        // NEW: inspect the new positions
                        // console.log(
                        //     "🆕 updatedUsers positions:",
                        //     updatedUsers.map(u => ({ _id: u._id, positionNo: u.positionNo }))
                        // );

                        setUsers(updatedUsers);
                    }}


                    keyExtractor={(item) => item._id}
                    renderItem={renderUserCard}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            </SafeAreaView>
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e9ecef",
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#212529",
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: "#6c757d",
    },

    listContainer: {
        paddingHorizontal: 10,
        paddingTop: 20,
        paddingBottom: 150,
    },
    userCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    activeCard: {
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        transform: [{ scale: 1.02 }],
    },
    disabledCard: {
        opacity: 1,
    },
    cardContent: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    userImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 16,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#212529",
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: "#6c757d",
        marginBottom: 2,
    },
    userRole: {
        fontSize: 14,
        color: "#007bff",
        fontWeight: "500",
    },
    cardActions: {
        alignItems: "flex-end",
    },
    userId: {
        fontSize: 12,
        color: "#adb5bd",
        marginBottom: 8,
    },
    dragIcon: {
        opacity: 0.6,
    },
})
