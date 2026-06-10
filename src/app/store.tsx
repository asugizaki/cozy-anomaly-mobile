import {
  getRevenueCatOfferings,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
} from "@/lib/revenuecat";
import { loadProgressWithEnergy } from "@/lib/energy";
import { DEFAULT_PROGRESS, PlayerProgress } from "@/lib/player-progress";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FALLBACK_PRODUCTS = [
  {
    id: "hidden_tanuki_starter_pack",
    title: "Starter Pack",
    description: "500 coins, 50 energy, 3 crates",
    price: "$2.99",
    package: null,
  },
  {
    id: "hidden_tanuki_energy_small",
    title: "Small Energy Pack",
    description: "25 energy",
    price: "$0.99",
    package: null,
  },
  {
    id: "hidden_tanuki_energy_medium",
    title: "Medium Energy Pack",
    description: "100 energy",
    price: "$2.99",
    package: null,
  },
  {
    id: "hidden_tanuki_energy_large",
    title: "Large Energy Pack",
    description: "250 energy",
    price: "$5.99",
    package: null,
  },
  {
    id: "hidden_tanuki_remove_ads",
    title: "Remove Ads",
    description: "Remove optional ad prompts where supported",
    price: "$4.99",
    package: null,
  },
];

function normalizePackage(pkg: any) {
  const product = pkg.product || {};

  return {
    id: product.identifier || pkg.identifier,
    title: product.title || product.identifier || pkg.identifier,
    description: product.description || "Hidden Tanuki purchase",
    price: product.priceString || "",
    package: pkg,
  };
}

export default function StoreScreen() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [notice, setNotice] = useState("");
  const [progress, setProgress] =
    useState<PlayerProgress>(DEFAULT_PROGRESS);

  async function loadStore() {
    setLoading(true);

    const loadedProgress = await loadProgressWithEnergy();
    setProgress(loadedProgress);

    const offerings = await getRevenueCatOfferings();

    if (offerings.availablePackages?.length) {
      setProducts(offerings.availablePackages.map(normalizePackage));
      setNotice("");
    } else {
      setProducts(FALLBACK_PRODUCTS);
      setNotice(
        offerings.unavailableReason ||
          "Using local product preview. RevenueCat offerings not found."
      );
    }

    setLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      loadStore();
    }, [])
  );

  async function buy(product: any) {
    if (!product.package) {
      Alert.alert(
        "Store Preview",
        "This is a local product preview. Create a custom dev build and configure RevenueCat offerings to test real purchases."
      );
      return;
    }

    const result = await purchaseRevenueCatPackage(product.package);

    if (result.progress) {
      setProgress(result.progress);
    }

    Alert.alert(result.success ? "Purchase Complete" : "Purchase", result.message);
  }

  async function restore() {
    const result = await restoreRevenueCatPurchases();

    Alert.alert(result.success ? "Restored" : "Restore Purchases", result.message);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>Tanuki Shop</Text>
          <Text style={styles.subtitle}>Support Pon and keep restoring.</Text>
        </View>
      </View>

      <View style={styles.resources}>
        <Text style={styles.resourceText}>⚡ {progress.energy}/{progress.maxEnergy}</Text>
        <Text style={styles.resourceText}>🪙 {progress.coins}</Text>
        <Text style={styles.resourceText}>🎁 {progress.lootBoxes}</Text>
      </View>

      {!!notice && <Text style={styles.notice}>{notice}</Text>}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#FF5C8A" />
          <Text style={styles.loadingText}>Loading shop...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {products.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productCopy}>
                <Text style={styles.productTitle}>{product.title}</Text>
                <Text style={styles.productDescription}>
                  {product.description}
                </Text>
              </View>

              <Pressable
                style={styles.buyButton}
                onPress={() => buy(product)}
              >
                <Text style={styles.buyButtonText}>
                  {product.price || "Buy"}
                </Text>
              </Pressable>
            </View>
          ))}

          <Pressable style={styles.restoreButton} onPress={restore}>
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </Pressable>

          <Text style={styles.footerText}>
            Purchases require a custom dev build or production build. Expo Go
            can only show the product preview.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFF3E2", paddingHorizontal: 18 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingTop: 8 },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 40, color: "#4B2E20", marginTop: -5 },
  headerText: { flex: 1 },
  title: { fontSize: 31, fontWeight: "900", color: "#4B2E20" },
  subtitle: { marginTop: 2, fontSize: 14, fontWeight: "800", color: "#7B5A43" },
  resources: { marginTop: 16, flexDirection: "row", gap: 8 },
  resourceText: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "white",
    color: "#4B2E20",
    fontSize: 13,
    fontWeight: "900",
  },
  notice: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 10, color: "#7B5A43", fontWeight: "900" },
  list: { paddingTop: 16, paddingBottom: 28, gap: 12 },
  productCard: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  productCopy: { flex: 1 },
  productTitle: { fontSize: 18, fontWeight: "900", color: "#4B2E20" },
  productDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: "#7B5A43",
  },
  buyButton: {
    minWidth: 82,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
    alignItems: "center",
  },
  buyButtonText: { color: "white", fontSize: 14, fontWeight: "900" },
  restoreButton: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#F4D7C4",
    alignItems: "center",
  },
  restoreText: { color: "#6A3F2B", fontSize: 15, fontWeight: "900" },
  footerText: {
    marginTop: 6,
    color: "#7B5A43",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    textAlign: "center",
  },
});
