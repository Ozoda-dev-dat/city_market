import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { wsManager } from "@/lib/websocket";

export function useRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    wsManager.connect();

    const offProducts = wsManager.on("products-changed", () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    });

    const offCategories = wsManager.on("categories-changed", () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    });

    const offOrders = wsManager.on("orders-changed", () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/my"] });
    });

    return () => {
      offProducts();
      offCategories();
      offOrders();
    };
  }, [queryClient]);
}
