// RevenueCat / Play Billing foundation phase.
export async function initializeIap() {
  console.log("[iap] initialize");
}

export async function purchaseProduct(productId: string) {
  console.log("[iap] purchase", productId);

  return {
    success: false,
    message: "IAP not connected yet.",
  };
}
