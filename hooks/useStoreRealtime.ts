import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { wsManager } from "@/lib/websocket";

/**
 * Store-owner realtime hook.
 * Listens to WS events that affect store-scoped queries and immediately
 * invalidates them so the UI reflects new orders and product changes.
 */
export function useStoreRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    wsManager.connect();

    // New order placed that includes this store's products — fires via
    // sendToUser(ownerId, "new-order") in server/routes.ts
    const offNewOrder = wsManager.on("new-order", () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/store/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    });

    // Broad order status change (admin/courier update) — keep store view fresh
    const offOrdersChanged = wsManager.on("orders-changed", () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/store/stats"] });
    });

    // Product catalogue changes — keep product list fresh
    const offProductsChanged = wsManager.on("products-changed", () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/store/stats"] });
    });

    return () => {
      offNewOrder();
      offOrdersChanged();
      offProductsChanged();
    };
  }, [queryClient]);
}
