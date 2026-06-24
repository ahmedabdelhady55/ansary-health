import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
  pendingItemId?: string; // tracks DB pending_cart_items row
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user } = useAuth();

  // Load pending cart items from DB (medicine added by pharmacist)
  useEffect(() => {
    if (!user) return;

    const loadPendingItems = async () => {
      const { data } = await supabase
        .from('pending_cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (data && data.length > 0) {
        setItems(prev => {
          const newItems = [...prev];
          for (const item of data) {
            // Don't add duplicates
            const exists = newItems.some(i => i.pendingItemId === item.id);
            if (!exists) {
              newItems.push({
                id: `pending-${item.id}`,
                name: item.name,
                price: Number(item.price),
                image: item.image,
                quantity: 1,
                category: item.category,
                pendingItemId: item.id,
              });
            }
          }
          return newItems;
        });

        // Mark as added_to_cart
        const ids = data.map(i => i.id);
        await supabase
          .from('pending_cart_items')
          .update({ status: 'added_to_cart' })
          .in('id', ids);
      }
    };

    loadPendingItems();

    // Listen for new pending items in realtime
    const channel = supabase
      .channel('pending-cart')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pending_cart_items',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const item = payload.new as any;
        if (item.status === 'pending') {
          setItems(prev => {
            if (prev.some(i => i.pendingItemId === item.id)) return prev;
            return [...prev, {
              id: `pending-${item.id}`,
              name: item.name,
              price: Number(item.price),
              image: item.image,
              quantity: 1,
              category: item.category,
              pendingItemId: item.id,
            }];
          });
          // Mark as added
          supabase.from('pending_cart_items').update({ status: 'added_to_cart' }).eq('id', item.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.id !== id));
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};
