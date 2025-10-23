import RenderDeleteModal from "@/components/common/DeleteModal";
import { ProductsHeader } from "@/components/common/HeaderVarients";
import { api } from "@/constants/api";
import { Product, ProductFormData } from "@/constants/types";
import { fetchData } from "@/utils/services";
import { Entypo, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "expo-router";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  ScrollView, StyleSheet, Text,
  TextInput,
  TouchableOpacity, View, type ListRenderItemInfo
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");


export default function AdminProductsScreen(): React.ReactElement {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const drawerPosition = useSharedValue(width);
  const [token, setToken] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [imageFile, setImageFile] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<ProductFormData>({
    _id: "",
    title: "",
    price: "",
    description: "",
    thumbnail: "",
    isFeatured: false,
  });
  const navigation = useNavigation()
  // Filtered products based on search
  const filteredProducts = products.filter((product) =>
    product?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Drawer animation styles
  const drawerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: drawerPosition.value }],
    };
  });

  // Open/close drawer with animation
  const toggleDrawer = (open: boolean) => {
    if (open) {
      setDrawerOpen(true);
      drawerPosition.value = withTiming(0, { duration: 300 });
    } else {
      drawerPosition.value = withTiming(width, { duration: 300 });

      // Use a timeout to ensure the animation completes before updating state
      setTimeout(() => {
        setDrawerOpen(false);
      }, 300);
    }
  };

  // Simulated API calls
  // Assuming fetchData is imported
  const fetchProducts = async (): Promise<void> => {
    await fetchData({
      apiUrl: api.getProducts,
      setLoading,
      setRefreshing,
      setData: setProducts,
      extractData: (res) => (res.success && res.product ? res.product : []),
      navigation
    });
  };


  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      setToken(storedToken ? JSON.parse(storedToken) : "");
    };
    fetchToken();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const saveProduct = async (): Promise<void> => {
    try {
      setLoading(true);

      if (!currentProduct.title || !currentProduct.price) {
        Alert.alert("Validation Error", "Please fill in all required fields");
        setLoading(false);
        return;
      }

      // Prepare FormData
      const formData = new FormData();

      formData.append("title", currentProduct.title);
      formData.append("description", currentProduct.description);
      formData.append("price", currentProduct.price?.toString());
      formData.append("isFeatured", currentProduct.isFeatured?.toString());

      if (imageFile) {
        const fileUri = imageFile.uri;
        const filename = fileUri.split("/").pop() || "profile.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image";

        formData.append("thumbnail", {
          uri: fileUri,
          name: filename,
          type,
        } as any); // Type assertion needed for React Native file upload
      }

      if (isEditing && currentProduct._id) {
        formData.append("_id", currentProduct._id);
      }

      const apiUrl = isEditing
        ? `${api.updateProduct}/${currentProduct._id}`
        : api.createProduct;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(apiUrl, {
        method,
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save product");
      }

      if (result.success) {
        Toast.show({
          type: "success",
          text1: result.message,
        });
        fetchProducts();
      } else {
        Toast.show({
          type: "error",
          text1: result.message,
        });
      }

      // Reset and close drawer
      setTimeout(() => {
        setLoading(false);
        toggleDrawer(false);
        resetForm();
      }, 800);
    } catch (error) {
      console.error('Error saving product:', error);

      let errorMessage = "Failed to save product";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setLoading(false);
      Alert.alert("Error", errorMessage);
    }
  };

  const confirmDeleteProduct = (productId: string) => {
    setSelectedProduct(productId);
    setShowDeleteModal(true);
  };

  const deleteProduct = async (_id: string): Promise<void> => {
    if (!token) return;
    try {
      setIsDeleting(true);
      const response = await fetch(
        `${api.deleteProduct}/${_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete product");
      }

      if (result.success) {
        Toast.show({
          type: "success",
          text1: result.message,
        });
        fetchProducts();
      } else {
        Toast.show({
          type: "error",
          text1: result.message,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error deleting product:', error);

      let errorMessage = "Failed to delete product";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setLoading(false);
      Alert.alert("Error", errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setSelectedProduct(null);
    }
  };

  const pickImage = async (): Promise<void> => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need camera roll permissions to change your profile picture"
        );
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setImageFile(selectedAsset);

        setCurrentProduct({
          ...currentProduct,
          thumbnail: selectedAsset.uri,
        });
      }
    } catch (error) {
      console.error('Error picking thumbnail:', error);
      Alert.alert("Error", "Failed to select thumbnail");
    }
  };

  const editProduct = (product: Product): void => {
    setIsEditing(true);
    setCurrentProduct({
      ...product,
      price: product.price?.toString(),
    });
    toggleDrawer(true);
  };

  const addNewProduct = (): void => {
    setIsEditing(false);
    resetForm();
    toggleDrawer(true);
  };

  const resetForm = (): void => {
    setCurrentProduct({
      _id: "",
      title: "",
      price: "",
      description: "",
      thumbnail: "",
      isFeatured: false,
    });
    setImageFile(null);
  };

  // Load products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [token, fetchProducts]);

  const renderProductItem = ({
    item,
    index,
  }: ListRenderItemInfo<Product>): React.ReactElement => (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(300)}
      style={styles.productCard}
    >
      <View style={styles.productHeader}>
        <Image
          source={{
            uri: item.thumbnail || "https://via.placeholder.com/150",
            cache: "force-cache",
          }}
          style={styles.productImage}
          defaultSource={require("../../assets/images/icon.png")} // for local fallback
        />
        {/* <Image source={{ uri: item.thumbnail }} style={styles.productImage} /> */}
        <View style={styles.productTitleContainer}>
          <Text style={styles.productTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.productMeta}>
            {item.isFeatured && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.productDetails}>
        <View style={styles.priceStockContainer}>
          <Text style={styles.productPrice}>₹{item.price.toFixed(2)}</Text>
        </View>

        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => editProduct(item)}
          >
            <FontAwesome name="edit" size={16} color="#ffffff" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => confirmDeleteProduct(item._id)}
          >
            <FontAwesome name="trash" size={16} color="#ffffff" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <ProductsHeader addNewProduct={addNewProduct} />


      <RenderDeleteModal
        text="product"
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        isDeleting={isDeleting}
        selectedItem={selectedProduct}
        handleDelete={deleteProduct}
      />


      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <FontAwesome
            name="search"
            size={20}
            color="#6b7280"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Products List */}
      {loading && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A00E0" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#374151"
              colors={["#007AFF"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "No products match your search"
                  : "No products found"}
              </Text>
            </View>
          }
        />
      )}

      {/* Slide-in Drawer for Add/Edit Product */}
      {drawerOpen && (
        <View style={styles.drawerOverlay}>
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => toggleDrawer(false)}
          />

          <Animated.View style={[styles.drawer, drawerAnimatedStyle]}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>
                {isEditing ? "Edit Product" : "Add New Product"}
              </Text>
              <TouchableOpacity
                onPress={() => toggleDrawer(false)}
                style={styles.closeButton}
              >
                <Entypo name="cross" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.formContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContentContainer}
            >
              {/* Image Picker */}
              <TouchableOpacity
                style={styles.imagePickerContainer}
                onPress={pickImage}
              >
                {currentProduct.thumbnail ? (
                  <Image
                    source={{ uri: currentProduct.thumbnail }}
                    style={styles.previewImage}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <FontAwesome name="camera" size={40} color="#6b7280" />
                    <Text style={styles.imagePlaceholderText}>
                      Tap to select product image
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Form Fields */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Product Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter product title"
                  placeholderTextColor="#6b7280"
                  value={currentProduct.title}
                  onChangeText={(text) =>
                    setCurrentProduct({ ...currentProduct, title: text })
                  }
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Price *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0.00"
                    placeholderTextColor="#6b7280"
                    keyboardType="decimal-pad"
                    value={currentProduct.price}
                    onChangeText={(text) =>
                      setCurrentProduct({ ...currentProduct, price: text })
                    }
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Enter product description"
                  placeholderTextColor="#6b7280"
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={currentProduct.description}
                  onChangeText={(text) =>
                    setCurrentProduct({
                      ...currentProduct,
                      description: text,
                    })
                  }
                />
              </View>

              <View style={styles.formField}>
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      currentProduct.isFeatured && styles.checkboxChecked,
                    ]}
                    onPress={() =>
                      setCurrentProduct({
                        ...currentProduct,
                        isFeatured: !currentProduct.isFeatured,
                      })
                    }
                  >
                    {currentProduct.isFeatured && (
                      <FontAwesome name="check" size={16} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>Featured Product</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveProduct}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isEditing ? "Update Product" : "Add Product"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </Animated.View >
        </View >
      )
      }
    </View >


  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // Light gray background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    backgroundColor: "#ffffff", // White header
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb", // Light border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6", // Light gray button
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827", // Dark text
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4A00E0",
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#ffffff", // White background
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb", // Very light gray
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    color: "#111827", // Dark text
    fontSize: 16,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#4A00E0",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#6b7280", // Medium gray
    marginTop: 10,
    fontSize: 16,
  },
  productsList: {
    padding: 20,
  },
  productCard: {
    backgroundColor: "#ffffff", // White card
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  productHeader: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6", // Light border
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 16,
  },
  productTitleContainer: {
    flex: 1,
    justifyContent: "center",
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827", // Dark text
    marginBottom: 6,
  },
  productMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  productCategory: {
    fontSize: 14,
    color: "#6b7280", // Medium gray
  },
  featuredBadge: {
    backgroundColor: "#4A00E0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 0,
  },
  featuredText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
  },
  productDetails: {
    padding: 16,
  },
  priceStockContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827", // Dark text
  },
  stockContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#f0fdf4", // Light green background
  },
  stockValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  stockHigh: {
    color: "#059669", // Green
  },
  stockMedium: {
    color: "#d97706", // Orange
  },
  stockLow: {
    color: "#dc2626", // Red
  },
  productDescription: {
    fontSize: 14,
    color: "#6b7280", // Medium gray
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: 6,
  },
  editButton: {
    backgroundColor: "#4A00E0",
  },
  deleteButton: {
    backgroundColor: "#dc2626", // Red
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    color: "#6b7280", // Medium gray
    fontSize: 16,
    textAlign: "center",
  },
  // Drawer styles
  drawerOverlay: {
    position: "absolute",
    top: 5,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  drawerBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent overlay
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "85%",
    height: "100%",
    backgroundColor: "#ffffff", // White drawer
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb", // Light border
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827", // Dark text
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6", // Light gray
    alignItems: "center",
    justifyContent: "center",
  },
  formContainer: {
    flex: 1,
  },
  formContentContainer: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  imagePickerContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    backgroundColor: "#f9fafb", // Very light gray
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#d1d5db", // Light gray border
    borderStyle: "dashed",
    borderRadius: 12,
  },
  imagePlaceholderText: {
    color: "#6b7280", // Medium gray
    marginTop: 10,
    fontSize: 14,
  },
  formField: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  fieldLabel: {
    color: "#374151", // Dark gray
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  textInput: {
    backgroundColor: "#f9fafb", // Very light gray
    borderRadius: 8,
    padding: 12,
    color: "#111827", // Dark text
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  dropdownButton: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  dropdownButtonText: {
    color: "#111827",
    fontSize: 16,
  },
  placeholderText: {
    color: "#6b7280",
  },
  dropdownMenu: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownItemText: {
    color: "#111827",
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#4A00E0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: "#4A00E0",
  },
  checkboxLabel: {
    color: "#374151", // Dark gray
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#4A00E0",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
