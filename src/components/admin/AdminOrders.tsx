import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, MessageCircle, Package, Trash2, CheckCircle, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { resolveSignedUrl } from '@/lib/storageUrl';

const SignedImage = ({
  bucket,
  value,
  className,
}: {
  bucket: 'prescription-images' | 'payment-proofs';
  value: string;
  className?: string;
}) => {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let active = true;
    resolveSignedUrl(bucket, value).then(u => { if (active) setUrl(u); });
    return () => { active = false; };
  }, [bucket, value]);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img src={url} alt="" className={className} />
    </a>
  );
};

interface OrderItem {
  id: string;
  product_name: string;
  product_id: string | null;
  quantity: number;
  price: number;
}

interface ChatMessage {
  id: string;
  message: string;
  sender_type: string;
  image_url?: string | null;
  created_at: string;
}

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  total: number;
  status: string;
  payment_method: string;
  payment_proof: string;
  payment_confirmed: boolean;
  created_at: string;
  user_id: string | null;
  items: OrderItem[];
  chat_messages: ChatMessage[];
}

const statusLabels: Record<string, { ar: string; en: string; style: string }> = {
  new: { ar: 'جديد', en: 'New', style: 'bg-secondary/20 text-secondary' },
  preparing: { ar: 'جاري التجهيز', en: 'Preparing', style: 'bg-primary/20 text-primary' },
  ready: { ar: 'جاهز للتسليم', en: 'Ready', style: 'bg-accent/20 text-accent-foreground' },
  delivered: { ar: 'تم التسليم', en: 'Delivered', style: 'bg-muted text-muted-foreground' },
};

const AdminOrders = () => {
  const { lang } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!data) return;

    const enriched = await Promise.all(
      (data as any[]).map(async (order) => {
        const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id);
        let chatMessages: ChatMessage[] = [];
        if (order.user_id) {
          const { data: convs } = await supabase.from('conversations').select('id').eq('user_id', order.user_id).order('updated_at', { ascending: false }).limit(1);
          if (convs && convs.length > 0) {
            const { data: msgs } = await supabase.from('conversation_messages').select('*').eq('conversation_id', convs[0].id).order('created_at', { ascending: true });
            if (msgs) chatMessages = msgs as ChatMessage[];
          }
        }
        return { ...order, items: (items || []) as OrderItem[], chat_messages: chatMessages } as Order;
      })
    );
    setOrders(enriched);
  };

  const changeStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    fetchOrders();
  };

  const confirmPayment = async (order: Order) => {
    if (!confirm(lang === 'ar' ? 'تأكيد الدفع وإضافة نقاط الولاء؟' : 'Confirm payment and add loyalty points?')) return;

    const { data: loyaltyRules } = await supabase.from('loyalty_rules').select('*');
    let totalPoints = 0;

    if (loyaltyRules && order.user_id) {
      const spendByCategory: Record<string, number> = {};
      for (const item of order.items) {
        let category = 'Medicine';
        if (item.product_id) {
          const { data: product } = await supabase.from('products').select('category_id').eq('id', item.product_id).single();
          if (product) {
            const { data: cat } = await supabase.from('categories').select('name_en, name').eq('id', product.category_id).single();
            if (cat) category = cat.name_en || cat.name;
          }
        }
        spendByCategory[category] = (spendByCategory[category] || 0) + item.price * item.quantity;
      }
      for (const [cat, spent] of Object.entries(spendByCategory)) {
        const rule = loyaltyRules.find(r => r.category_en === cat || r.category === cat);
        if (rule && rule.spend_amount > 0) {
          totalPoints += Math.floor(spent / Number(rule.spend_amount)) * rule.points_earned;
        }
      }

      const { data: profile } = await supabase.from('profiles').select('loyalty_points').eq('id', order.user_id).single();
      if (profile) {
        await supabase.from('profiles').update({
          loyalty_points: (profile.loyalty_points || 0) + totalPoints,
        }).eq('id', order.user_id);
      }
    }

    await supabase.from('orders').update({ payment_confirmed: true } as any).eq('id', order.id);
    toast({ title: lang === 'ar' ? `تم تأكيد الدفع${totalPoints > 0 ? ` - ${totalPoints} نقطة مكتسبة` : ''}` : `Payment confirmed${totalPoints > 0 ? ` - ${totalPoints} pts earned` : ''}` });
    fetchOrders();
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Delete this order?')) return;
    await supabase.from('order_items').delete().eq('order_id', orderId);
    await supabase.from('orders').delete().eq('id', orderId);
    if (expandedOrder === orderId) setExpandedOrder(null);
    fetchOrders();
    toast({ title: lang === 'ar' ? 'تم حذف الطلب' : 'Order deleted' });
  };

  const filtered = orders.filter(o => {
    const matchesSearch = o.customer_name.includes(searchTerm) || o.order_number.toString().includes(searchTerm) || o.customer_phone.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground">{lang === 'ar' ? 'إدارة الطلبات' : 'Orders Management'}</h2>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Input placeholder={lang === 'ar' ? 'بحث بالاسم أو الرقم...' : 'Search...'} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-64" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm w-full sm:w-auto">
          <option value="all">{lang === 'ar' ? 'الكل' : 'All'}</option>
          <option value="new">{lang === 'ar' ? 'جديد' : 'New'}</option>
          <option value="preparing">{lang === 'ar' ? 'جاري التجهيز' : 'Preparing'}</option>
          <option value="ready">{lang === 'ar' ? 'جاهز' : 'Ready'}</option>
          <option value="delivered">{lang === 'ar' ? 'تم التسليم' : 'Delivered'}</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">{lang === 'ar' ? 'لا توجد طلبات بعد' : 'No orders yet'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Order header - mobile friendly */}
              <div className="p-3 sm:p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpandedOrder(prev => prev === order.id ? null : order.id)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono text-muted-foreground">#{order.order_number}</span>
                      <span className="font-heading font-bold text-foreground text-sm sm:text-base">{order.customer_name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.customer_phone}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {expandedOrder === order.id ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground text-sm">{order.total} ج.م</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusLabels[order.status]?.style || ''}`}>
                    {lang === 'ar' ? statusLabels[order.status]?.ar : statusLabels[order.status]?.en}
                  </span>
                  {order.payment_confirmed && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-500/20 text-green-600">✓ {lang === 'ar' ? 'تم الدفع' : 'Paid'}</span>}
                  <span className="text-xs text-muted-foreground">{order.payment_method === 'wallet' ? '📱' : '💵'}</span>
                  <select value={order.status} onChange={e => { e.stopPropagation(); changeStatus(order.id, e.target.value); }} onClick={e => e.stopPropagation()} className="rounded-md border border-input bg-background px-2 py-1 text-xs ms-auto">
                    <option value="new">{lang === 'ar' ? 'جديد' : 'New'}</option>
                    <option value="preparing">{lang === 'ar' ? 'جاري التجهيز' : 'Preparing'}</option>
                    <option value="ready">{lang === 'ar' ? 'جاهز' : 'Ready'}</option>
                    <option value="delivered">{lang === 'ar' ? 'تم التسليم' : 'Delivered'}</option>
                  </select>
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="border-t border-border p-3 sm:p-4 space-y-4">
                  {order.payment_proof && (
                    <div>
                      <h4 className="flex items-center gap-2 font-heading font-semibold text-foreground mb-2 text-sm"><Image size={16} />{lang === 'ar' ? 'إثبات الدفع' : 'Payment Proof'}</h4>
                      <SignedImage bucket="payment-proofs" value={order.payment_proof} className="w-full max-w-[200px] h-auto rounded-lg border border-border hover:opacity-80 transition-opacity" />
                    </div>
                  )}

                  {order.items.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-2 font-heading font-semibold text-foreground mb-2 text-sm"><Package size={16} />{lang === 'ar' ? 'تفاصيل المنتجات' : 'Product Details'}</h4>
                      <div className="space-y-1">
                        {order.items.map(item => (
                          <div key={item.id} className="flex justify-between text-xs sm:text-sm bg-muted/30 rounded-lg px-3 py-2">
                            <span className="text-foreground">{item.product_name} × {item.quantity}</span>
                            <span className="font-semibold text-foreground">{item.price * item.quantity} ج.م</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.chat_messages.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-2 font-heading font-semibold text-foreground mb-2 text-sm"><MessageCircle size={16} />{lang === 'ar' ? 'طلب العميل من الشات' : 'Customer Chat'}</h4>
                      <div className="bg-muted/20 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                        {order.chat_messages.filter(m => m.sender_type === 'user').map(msg => (
                          <div key={msg.id} className="text-xs sm:text-sm">
                            <div className="bg-primary/10 rounded-lg px-3 py-2 text-foreground">
                              {msg.image_url && (
                                <SignedImage bucket="prescription-images" value={msg.image_url} className="w-24 sm:w-32 h-auto rounded-lg mb-1 hover:opacity-80 transition-opacity" />
                              )}
                              {msg.message}
                            </div>
                            <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.items.length === 0 && order.chat_messages.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">{lang === 'ar' ? 'لا توجد تفاصيل إضافية' : 'No additional details'}</p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
                    {!order.payment_confirmed && (
                      <Button onClick={() => confirmPayment(order)} className="gap-2 w-full sm:w-auto text-xs sm:text-sm" variant="default" size="sm">
                        <CheckCircle size={16} />
                        {lang === 'ar' ? 'تأكيد الدفع + نقاط الولاء' : 'Confirm Payment + Loyalty'}
                      </Button>
                    )}
                    <Button onClick={() => deleteOrder(order.id)} variant="destructive" className="gap-2 w-full sm:w-auto text-xs sm:text-sm" size="sm">
                      <Trash2 size={16} />
                      {lang === 'ar' ? 'حذف الطلب' : 'Delete'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;