# FriendlyDrop: Project Structure, Custom Hooks, and State Architecture

This document provides a comprehensive overview of the directory structure of the FriendlyDrop workspace, along with in-depth explanations of the custom hooks and Zustand state stores that manage client-side behavior, authentication, and database synchronization.

---

## 📂 Project Directory Structure Overview

FriendlyDrop is built as a modern web application utilizing **Next.js** (App Router architecture), **Firebase Auth** (client-side verification and authentication), **Zustand** (client-side state persistence), and **Supabase / Firebase Firestore** (dual backend/data layers).

Below is the directory tree structure of the workspace:

*   **`app/`**: Next.js App Router directories. Contains routes, layouts, pages, and server-side API endpoints (`/api/*`).
*   **`components/`**: Reusable frontend UI components grouped by feature domain:
    *   `admin/`: Back-office administration and operational dashboards.
    *   `cart/`: Checkout, cart sliding panel, and cart actions.
    *   `cms/`: Custom page building and CMS content modules.
    *   `home/`: Hero components, product carousels, and landing layouts.
    *   `layout/`: Navigation bar (`navbar.tsx`), footers, and app wrapper structures.
    *   `product/`: Product listing grid, detail pages, and add-to-cart actions.
    *   `providers/`: Global React Context and synchronization wrappers (such as `StoreSync`).
    *   `shared/`: Generic elements like input fields, loading animations, and authentication panels.
    *   `support/`: Help widgets and client chat systems.
    *   `ui/`: Basic primitives (buttons, modals, badges) following tailwind/shadcn styling.
*   **`docs/`**: Technical specs, architectural decisions, and integration guidelines.
*   **`hooks/`**: Custom, reusable React utility hooks facilitating auth flow, polling, and performance enhancements.
*   **`lib/`**: Business logic engines, constants, validations, and database client initializers.
    *   `firebase/`: Client & Admin initializations and legacy Firestore helpers.
    *   `supabase/`: Supabase client and Postgres SQL connector utilities.
    *   `automation-engine.ts`, `settings-engine.ts`, `control-tower.ts`: Enterprise orchestration rules.
*   **`store/`**: Zustand state-store definitions powered by `localStorage` persistence.
*   **`supabase/migrations/`**: SQL migrations establishing tables and Row Level Security (RLS) policies.
*   **`types/`**: TypeScript type declarations mapping Firestore/Supabase tables, order types, and site settings.

---

## ⚓ Custom React Hooks (`/hooks`)

Custom utility hooks are located in the [hooks](file:///c:/Users/ajay_/Downloads/friendlydrop.in/hooks) directory. They handle core client interactions.

### 1. `useAuth` Hook
*   **Path**: [use-auth.tsx](file:///c:/Users/ajay_/Downloads/friendlydrop.in/hooks/use-auth.tsx)
*   **Function Signature**: [useAuth](file:///c:/Users/ajay_/Downloads/friendlydrop.in/hooks/use-auth.tsx#L184)
*   **Purpose**: Manages the user's active session, triggers client-to-server cookie syncing, and returns the current user context, loading state, and roles.

#### Behind the Scenes:
*   Initializes Firebase Authentication ([getFirebaseAuth](file:///c:/Users/ajay_/Downloads/friendlydrop.in/hooks/use-auth.tsx#L67)).
*   Listens to authentication state changes via Firebase's [onAuthStateChanged](file:///c:/Users/ajay_/Downloads/friendlydrop.in/hooks/use-auth.tsx#L102).
*   Syncs authentication tokens to the Next.js server via `POST` or `DELETE` fetch requests to `/api/auth/session` so that server-side middleware and route handlers can authenticate user requests.
*   Fetches custom user metadata (e.g. user roles) from `/api/me`.

```typescript
type AuthContextValue = {
  user: User | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
};
```

---

### 2. `useDebounce` Hook
*   **Path**: [use-debounce.ts](file:///c:/Users/ajay_/Downloads/friendlydrop.in/hooks/use-debounce.ts)
*   **Function Signature**: [useDebounce](file:///c:/Users/ajay_/Downloads/friendlydrop.in/hooks/use-debounce.ts#L5)
*   **Purpose**: Delays updating a given React state value until a specific timeout (default: `300ms`) has passed since the value last changed. Commonly used to prevent API spam on search queries and keystroke updates.

```typescript
export function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}
```

---

### 3. `useOrderTracking` Hook
*   **Path**: [use-order-tracking.ts](file:///c:/Users/ajay_/Downloads/friendlydrop.in/hooks/use-order-tracking.ts)
*   **Function Signature**: [useOrderTracking](file:///c:/Users/ajay_/Downloads/friendlydrop.in/hooks/use-order-tracking.ts#L6)
*   **Purpose**: Polls the `/api/orders/[orderId]` route at a fixed interval of 15 seconds to fetch live progress updates for a specific order.

#### Behind the Scenes:
*   Initializes local state with `initialOrder` to ensure zero-layout-shift (immediate render).
*   Registers a `setInterval` that triggers a fetch request for updated status values.
*   Clears the active interval on component unmount to prevent memory leaks.

---

## 🗄️ Zustand State Stores (`/store`)

Client-side persistent stores are defined under the [store](file:///c:/Users/ajay_/Downloads/friendlydrop.in/store) directory. They act as centralized state managers utilizing Zustand's `persist` middleware to save state inside the client's local storage.

### 1. `useCartStore` Store Hook
*   **Path**: [use-cart-store.ts](file:///c:/Users/ajay_/Downloads/friendlydrop.in/store/use-cart-store.ts)
*   **Function Signature**: [useCartStore](file:///c:/Users/ajay_/Downloads/friendlydrop.in/store/use-cart-store.ts#L17)
*   **Local Storage Key**: `friendlydrop_cart`
*   **State & Actions**:
    *   `items`: Array of `CartItem` elements.
    *   `addItem(item)`: Inserts a new cart item, or increments the quantity (capped at a maximum of 20 items per item SKU) if it already exists.
    *   `removeItem(productId, variantId)`: Removes specific product line item.
    *   `updateQuantity(productId, quantity, variantId)`: Updates line item quantity, automatically deleting the item if the quantity is adjusted to `0` or below.
    *   `clearCart()`: Empties the cart.
    *   `subtotal()`: Computes total checkout pricing before discounts.

---

### 2. `useRecentlyViewedStore` Store Hook
*   **Path**: [use-recently-viewed-store.ts](file:///c:/Users/ajay_/Downloads/friendlydrop.in/store/use-recently-viewed-store.ts)
*   **Function Signature**: [useRecentlyViewedStore](file:///c:/Users/ajay_/Downloads/friendlydrop.in/store/use-recently-viewed-store.ts#L12)
*   **Local Storage Key**: `friendlydrop_recent`
*   **State & Actions**:
    *   `items`: Array of product ID strings.
    *   `addItem(productId)`: Adds the newly viewed product to the front of the queue, filters out duplicates, and slices the queue based on the global `RECENTLY_VIEWED_LIMIT`.

---

### 3. `useWishlistStore` Store Hook
*   **Path**: [use-wishlist-store.ts](file:///c:/Users/ajay_/Downloads/friendlydrop.in/store/use-wishlist-store.ts)
*   **Function Signature**: [useWishlistStore](file:///c:/Users/ajay_/Downloads/friendlydrop.in/store/use-wishlist-store.ts#L14)
*   **Local Storage Key**: `friendlydrop_wishlist`
*   **State & Actions**:
    *   `productIds`: List of product ID strings that have been favorited.
    *   `toggle(productId)`: Removes the ID if it's already in the wishlist, otherwise appends it.
    *   `has(productId)`: Inline checks if a given product ID is currently favorited.
    *   `clear()`: Flushes all favorited items.

---

## 🔄 The Data Synchronization Engine (`StoreSync`)

One of the most important components in FriendlyDrop is the [StoreSync](file:///c:/Users/ajay_/Downloads/friendlydrop.in/components/providers/store-sync.tsx#L8) provider. It serves as the bridge between client-side Zustand stores and the user's permanent account storage in the database.

### How Synchronization Works:
1. **Initial Login Fetch**:
   * When `user` context transitions from `null` to a valid user session, `StoreSync` fetches `/api/cart` and `/api/wishlist` values.
   * It then sets the retrieved database items into local Zustand states ([setItems](file:///c:/Users/ajay_/Downloads/friendlydrop.in/store/use-cart-store.ts#L21) and [setProductIds](file:///c:/Users/ajay_/Downloads/friendlydrop.in/store/use-wishlist-store.ts#L18)).
2. **Real-time Local-to-Server Sync**:
   * Two separate `useEffect` hooks monitor state modifications in `cartItems` and `wishlistIds`.
   * When changes occur and a user is signed in, it updates the remote database by performing a `PUT` fetch containing the serialized payload to `/api/cart` and `/api/wishlist` endpoints.

This architecture ensures that users enjoy a seamless shopping experience: guest users can add items to their local storage cart, and upon log in, their cart is synced and persisted in their permanent database account.
