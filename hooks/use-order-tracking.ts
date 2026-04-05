"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { Order } from "@/types";

export function useOrderTracking(orderId: string, initialOrder: Order) {
  const [order, setOrder] = useState<Order>(initialOrder);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const unsubscribe = onSnapshot(doc(firebaseDb, "orders", orderId), (snapshot) => {
      if (!snapshot.exists()) {
        return;
      }

      setOrder({ id: snapshot.id, ...(snapshot.data() as Omit<Order, "id">) });
    });

    return () => unsubscribe();
  }, [orderId]);

  return order;
}
