import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag, Upload, Wallet, Banknote, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface Props {
  onBack: () => void;
}

const CartPage = ({ onBack }: Props) => {
  const { lang } = useLanguage();
  const { user, profile, refreshProfile } = useAuth();
  const { items, updateQuantity, removeItem, clearCart, totalPrice, totalItems } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash');
  const [walletNumber, setWalletNumber] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [minRedeemPoints, setMinRedeemPoints] = useState(50);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsDiscount, setPointsDiscount] = useState(0);

  useEffect(() => {
    supabase.from('site_settings').select('*').then(({ data }) => {
      if (data) {
        const settings = Object.fromEntries(data.map((s: any) => [s.key, s.value]));
        setWalletNumber(settings['wallet_number'] || '');
        setMinRedeemPoints(Number(settings['min_redeem_points'] || 50));
      }
    });
  }, []);

  const loyaltyPoints = profile?.loyalty_points || 0;
  const canRedeem = loyaltyPoints >= minRedeemPoints;
  const maxPointsDiscount = Math.min(loyaltyPoints, totalPrice);
  const finalPrice = Math.max(0, totalPrice - pointsDiscount);

  const togglePointsRedemption = () => {
    if (!canRedeem) return;
    if (usePoints) { setUsePoints(false); setPointsDiscount(0); }
    else { setUsePoints(true); setPointsDiscount(maxPointsDiscount); }
  };

  const handleCheckout = async () => {
    if (items.length === 0 || !user || !profile) return;
    if (paymentMethod === 'wallet' && !proofFile) {
      toast({ title: lang === 'ar' ? 'من فضلك ارفع صورة إثبات التحويل' : 'Please upload payment proof', variant: 'destructive' });
      return;
    }
    setLoading(true);

    let paymentProofUrl = '';
    if (paymentMethod === 'wallet' && proofFile) {
      const ext = proofFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('payment-proofs').upload(path, proofFile);
      if (uploadErr) {
        toast({ title: lang === 'ar' ? 'فشل رفع إثبات الدفع' : 'Failed to upload proof', variant: 'destructive' });
        setLoading(false);
        return;
      }
      // Bucket is private — store the storage path; admins resolve a signed URL on view.
      paymentProofUrl = path;
    }

    const { data: order, error } = await supabase.from('orders').insert({
      user_id: user.id,
      customer_name: profile.name,
      customer_phone: profile.phone,
      total: finalPrice,
      status: 'new',
      payment_method: paymentMethod,
      payment_proof: paymentProofUrl,
    } as any).select().single();

    if (error || !order) {
      toast({ title: error?.message || 'Error', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_name: item.name,
      quantity: item.quantity,
      price: item.price,
      ...(item.pendingItemId ? {} : { product_id: item.id }),
    }));
    await supabase.from('order_items').insert(orderItems);

    const updates: Record<string, any> = {
      total_purchases: (profile.total_purchases || 0) + finalPrice,
    };
    if (usePoints && pointsDiscount > 0) {
      updates.loyalty_points = loyaltyPoints - pointsDiscount;
    }
    await supabase.from('profiles').update(updates).eq('id', user.id);

    toast({
      title: lang === 'ar' ? 'تم إرسال طلبك بنجاح! 🎉' : 'Order placed successfully! 🎉',
      description: paymentMethod === 'wallet'
        ? (lang === 'ar' ? 'سيتم مراجعة إثبات الدفع' : 'Payment proof will be reviewed')
        : (lang === 'ar' ? 'الدفع عند الاستلام' : 'Cash on delivery'),
    });
    clearCart();
    setProofFile(null);
    setUsePoints(false);
    setPointsDiscount(0);
    await refreshProfile();
    setLoading(false);
  };

  return (
    <div className="bg-card/90 backdrop-blur-md rounded-xl border border-border shadow-lg max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 p-3 sm:p-4 border-b border-border">
        <button onClick={onBack} className="p-1.5 rounded-lg bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-heading font-bold text-foreground text-sm sm:text-base">{lang === 'ar' ? 'سلة المشتريات' : 'Shopping Cart'}</h2>
        {totalItems > 0 && <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full px-2 py-0.5 ms-auto">{totalItems}</span>}
      </div>

      <div className="p-3 sm:p-4">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag size={48} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-heading">{lang === 'ar' ? 'السلة فارغة' : 'Cart is empty'}</p>
            <Button variant="outline" onClick={onBack} className="mt-4">{lang === 'ar' ? 'تسوق الآن' : 'Shop Now'}</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-background/80 rounded-lg border border-border p-2 sm:p-3 flex items-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">{item.image}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading font-bold text-foreground text-xs sm:text-sm truncate">{item.name}</h4>
                  <p className="text-primary font-bold text-xs sm:text-sm">{item.price} {lang === 'ar' ? 'ج.م' : 'EGP'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 rounded bg-muted text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"><Minus size={12} /></button>
                  <span className="w-6 text-center font-bold text-foreground text-xs sm:text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"><Plus size={12} /></button>
                </div>
                <p className="font-bold text-foreground text-xs sm:text-sm w-14 text-end">{item.price * item.quantity}</p>
                <button onClick={() => removeItem(item.id)} className="p-1 sm:p-1.5 rounded bg-muted text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"><Trash2 size={12} /></button>
              </div>
            ))}

            {/* Loyalty */}
            {loyaltyPoints > 0 && (
              <div className={`rounded-lg border p-3 ${canRedeem ? 'border-green-500/50 bg-green-500/5' : 'border-border bg-background/80'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Star size={16} className={canRedeem ? 'text-green-500 shrink-0' : 'text-muted-foreground shrink-0'} />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-heading font-semibold text-foreground">
                        {lang === 'ar' ? `نقاطك: ${loyaltyPoints}` : `Points: ${loyaltyPoints}`}
                      </p>
                      {!canRedeem && <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? `الحد الأدنى: ${minRedeemPoints}` : `Min: ${minRedeemPoints}`}</p>}
                    </div>
                  </div>
                  {canRedeem && (
                    <Button size="sm" variant={usePoints ? 'destructive' : 'outline'} onClick={togglePointsRedemption} className="gap-1 text-xs shrink-0">
                      <Star size={12} />
                      {usePoints ? (lang === 'ar' ? 'إلغاء' : 'Cancel') : (lang === 'ar' ? `استخدم ${maxPointsDiscount}` : `Use ${maxPointsDiscount}`)}
                    </Button>
                  )}
                </div>
                {usePoints && <p className="text-xs text-green-600 font-semibold mt-2">{lang === 'ar' ? `خصم: -${pointsDiscount} ج.م` : `Discount: -${pointsDiscount} EGP`}</p>}
              </div>
            )}

            {/* Payment */}
            <div className="border-t border-border pt-3 space-y-3">
              <p className="text-xs sm:text-sm font-heading font-semibold text-foreground">{lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</p>
              <div className="flex gap-2 sm:gap-3">
                <button onClick={() => setPaymentMethod('cash')} className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 transition-colors ${paymentMethod === 'cash' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground'}`}>
                  <Banknote size={18} />
                  <span className="font-heading font-semibold text-xs sm:text-sm">{lang === 'ar' ? 'كاش' : 'Cash'}</span>
                </button>
                <button onClick={() => setPaymentMethod('wallet')} className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 transition-colors ${paymentMethod === 'wallet' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground'}`}>
                  <Wallet size={18} />
                  <span className="font-heading font-semibold text-xs sm:text-sm">{lang === 'ar' ? 'محفظة' : 'Wallet'}</span>
                </button>
              </div>

              {paymentMethod === 'wallet' && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4 space-y-3">
                  <p className="text-xs sm:text-sm text-foreground font-heading font-semibold">
                    {lang === 'ar' ? 'حوّل على الرقم:' : 'Transfer to:'}
                  </p>
                  <p className="text-base sm:text-lg font-bold text-primary font-mono text-center py-2 bg-background rounded-lg">
                    {walletNumber || '—'}
                  </p>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">{lang === 'ar' ? 'ارفع صورة الإثبات:' : 'Upload proof:'}</p>
                    <label className="flex items-center gap-2 px-3 py-2 sm:py-3 rounded-lg border border-dashed border-primary/40 bg-background cursor-pointer hover:bg-primary/5 transition-colors">
                      <Upload size={16} className="text-primary shrink-0" />
                      <span className="text-xs sm:text-sm text-foreground truncate">{proofFile ? proofFile.name : (lang === 'ar' ? 'اختر صورة...' : 'Choose image...')}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => setProofFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t border-border pt-3 space-y-3">
              {usePoints && (
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-muted-foreground">{lang === 'ar' ? 'قبل الخصم' : 'Subtotal'}</span>
                  <span className="text-muted-foreground line-through">{totalPrice} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-heading font-bold text-foreground text-sm sm:text-base">{lang === 'ar' ? 'الإجمالي' : 'Total'}</span>
                <span className="font-heading font-bold text-primary text-base sm:text-lg">{finalPrice} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
              </div>
              <Button onClick={handleCheckout} disabled={loading} className="w-full font-heading font-bold text-sm sm:text-base py-4 sm:py-5">
                {loading ? (lang === 'ar' ? 'جاري الإرسال...' : 'Placing...') : (lang === 'ar' ? 'إتمام الطلب' : 'Place Order')}
              </Button>
              <Button variant="outline" onClick={clearCart} className="w-full gap-2 text-sm">
                <Trash2 size={14} />{lang === 'ar' ? 'تفريغ السلة' : 'Clear Cart'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;