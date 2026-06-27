import { CartList } from "@/components/cart/cart-list";

export default function CartPage() {
  return (
    <main className="space-y-6">
      <h1 className="font-display text-4xl font-bold text-ink">Your Cart</h1>
      <CartList />
    </main>
  );
}
