import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Send, ArrowLeft, ShoppingCart, MessageCircle, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { resolveSignedUrl } from '@/lib/storageUrl';

const PrescriptionThumb = ({ value, className }: { value: string; className?: string }) => {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let active = true;
    resolveSignedUrl('prescription-images', value).then(u => { if (active) setUrl(u); });
    return () => { active = false; };
  }, [value]);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img src={url} alt="prescription" className={className} />
    </a>
  );
};

interface Conversation {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_type: string;
  message: string;
  image_url?: string | null;
  created_at: string;
}

const AdminMessages = () => {
  const { lang } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showCostForm, setShowCostForm] = useState(false);
  const [orderCost, setOrderCost] = useState<number>(0);
  const [convertLoading, setConvertLoading] = useState(false);

  useEffect(() => {
    fetchConversations();
    const channel = supabase
      .channel('admin-conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => fetchConversations())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_messages' }, () => fetchConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchConversations = async () => {
    const { data } = await supabase.from('conversations').select('*').order('updated_at', { ascending: false });
    if (data) {
      const enriched = await Promise.all(
        (data as Conversation[]).map(async (conv) => {
          const { data: lastMsg } = await supabase.from('conversation_messages').select('message').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1);
          return { ...conv, last_message: lastMsg?.[0]?.message || '' };
        })
      );
      setConversations(enriched);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedConv) return;
    const loadMessages = async () => {
      const { data } = await supabase.from('conversation_messages').select('*').eq('conversation_id', selectedConv.id).order('created_at', { ascending: true });
      if (data) setMessages(data as Message[]);
    };
    loadMessages();
    const channel = supabase
      .channel(`admin-conv-${selectedConv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_messages', filter: `conversation_id=eq.${selectedConv.id}` }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedConv]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleReply = async () => {
    if (!reply.trim() || !selectedConv) return;
    const text = reply.trim();
    setReply('');
    await supabase.from('conversation_messages').insert({ conversation_id: selectedConv.id, sender_type: 'pharmacist', message: text });
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', selectedConv.id);
  };

  const handleConvertToOrder = async () => {
    if (!selectedConv || orderCost <= 0) return;
    setConvertLoading(true);

    const { data: customerProfile } = await supabase.from('profiles').select('name, phone, total_purchases').eq('id', selectedConv.user_id).single();

    const { data: order, error } = await supabase.from('orders').insert({
      user_id: selectedConv.user_id,
      customer_name: customerProfile?.name || selectedConv.user_name,
      customer_phone: customerProfile?.phone || selectedConv.user_phone,
      total: orderCost,
      status: 'new',
      payment_method: 'cash',
    } as any).select().single();

    if (error || !order) {
      toast({ title: lang === 'ar' ? 'خطأ' : 'Error', description: error?.message, variant: 'destructive' });
      setConvertLoading(false);
      return;
    }

    await supabase.from('order_items').insert({
      order_id: order.id,
      product_name: 'علاج (من الشات)',
      quantity: 1,
      price: orderCost,
    });

    if (customerProfile) {
      await supabase.from('profiles').update({
        total_purchases: Number(customerProfile.total_purchases || 0) + orderCost,
      }).eq('id', selectedConv.user_id);
    }

    await supabase.from('conversations').update({ status: 'converted' }).eq('id', selectedConv.id);

    await supabase.from('conversation_messages').insert({
      conversation_id: selectedConv.id,
      sender_type: 'pharmacist',
      message: `💊 تم تحديد تكلفة العلاج: ${orderCost} ج.م - تم إنشاء طلب #${(order as any).order_number}`,
    });

    toast({ title: lang === 'ar' ? `تم إنشاء الطلب بنجاح - ${orderCost} ج.م` : `Order created - ${orderCost} EGP` });
    setShowCostForm(false);
    setOrderCost(0);
    setConvertLoading(false);
    fetchConversations();
    setSelectedConv({ ...selectedConv, status: 'converted' });
  };

  const deleteConversation = async (convId: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه المحادثة؟' : 'Delete this conversation?')) return;
    await supabase.from('conversation_messages').delete().eq('conversation_id', convId);
    await supabase.from('conversations').delete().eq('id', convId);
    if (selectedConv?.id === convId) setSelectedConv(null);
    fetchConversations();
    toast({ title: lang === 'ar' ? 'تم حذف المحادثة' : 'Conversation deleted' });
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, { label: string; cls: string }> = {
      open: { label: lang === 'ar' ? 'مفتوح' : 'Open', cls: 'bg-primary/20 text-primary' },
      closed: { label: lang === 'ar' ? 'مغلق' : 'Closed', cls: 'bg-muted text-muted-foreground' },
      converted: { label: lang === 'ar' ? 'تم التحويل لطلب' : 'Converted', cls: 'bg-secondary/20 text-secondary' },
    };
    const s = styles[status] || styles.open;
    return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.cls}`}>{s.label}</span>;
  };

  if (!selectedConv) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <MessageCircle size={20} className="sm:hidden" />
          <MessageCircle size={24} className="hidden sm:block" />
          {lang === 'ar' ? 'رسائل العملاء' : 'Customer Messages'}
        </h2>
        {loading ? (
          <p className="text-muted-foreground text-sm">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        ) : conversations.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <MessageCircle size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{lang === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(conv => (
              <div key={conv.id} className="w-full bg-card rounded-xl border border-border p-3 sm:p-4 hover:shadow-md transition-shadow flex items-center gap-3">
                <button onClick={() => setSelectedConv(conv)} className="flex-1 text-start flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageCircle size={16} className="text-primary sm:hidden" />
                    <MessageCircle size={18} className="text-primary hidden sm:block" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-heading font-bold text-foreground text-sm">{conv.user_name || conv.user_phone || 'عميل'}</span>
                      {statusBadge(conv.status)}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{conv.last_message || '...'}</p>
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">{new Date(conv.created_at).toLocaleDateString('ar-EG')}</span>
                </button>
                <button onClick={() => deleteConversation(conv.id)} className="p-1.5 sm:p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <button onClick={() => { setSelectedConv(null); setShowCostForm(false); }} className="p-1.5 sm:p-2 rounded-lg bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading font-bold text-foreground text-sm sm:text-base truncate">{selectedConv.user_name || selectedConv.user_phone || 'عميل'}</h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground">{selectedConv.user_phone}</p>
        </div>
        {statusBadge(selectedConv.status)}
        {selectedConv.status === 'open' && !showCostForm && (
          <button onClick={() => setShowCostForm(true)} className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity">
            <ShoppingCart size={14} />
            <span className="hidden sm:inline">{lang === 'ar' ? 'حوّل لطلب' : 'Convert to Order'}</span>
            <span className="sm:hidden">{lang === 'ar' ? 'حوّل' : 'Convert'}</span>
          </button>
        )}
        <button onClick={() => deleteConversation(selectedConv.id)} className="p-1.5 sm:p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>

      {showCostForm && selectedConv.status === 'open' && (
        <div className="bg-card rounded-xl border-2 border-primary p-3 sm:p-5 space-y-3 animate-fade-in">
          <h3 className="font-heading font-bold text-foreground text-sm sm:text-base">
            {lang === 'ar' ? '💊 تحديد تكلفة العلاج' : '💊 Set Medicine Cost'}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {lang === 'ar' ? 'ادخل تكلفة العلاج - سيتم إنشاء طلب مباشرة' : 'Enter cost - an order will be created'}
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            <Input type="number" placeholder={lang === 'ar' ? 'التكلفة' : 'Cost'} value={orderCost || ''} onChange={e => setOrderCost(Number(e.target.value))} className="w-32 sm:w-48 text-base sm:text-lg font-bold" min={0} />
            <span className="text-foreground font-semibold text-sm">{lang === 'ar' ? 'ج.م' : 'EGP'}</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleConvertToOrder} disabled={convertLoading || orderCost <= 0} className="gap-2 text-xs sm:text-sm" size="sm">
              <ShoppingCart size={14} />
              {convertLoading ? (lang === 'ar' ? 'جاري...' : 'Creating...') : (lang === 'ar' ? 'إنشاء الطلب' : 'Create Order')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setShowCostForm(false); setOrderCost(0); }} className="text-xs sm:text-sm">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="h-[50vh] sm:h-96 overflow-y-auto p-3 sm:p-4 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] sm:max-w-[75%] px-3 py-2 rounded-xl text-xs sm:text-sm ${msg.sender_type === 'user' ? 'bg-primary/10 text-foreground rounded-br-sm' : 'bg-secondary/10 text-foreground rounded-bl-sm'}`}>
                {msg.sender_type !== 'user' && <p className="text-[10px] sm:text-xs font-bold text-secondary mb-1">{lang === 'ar' ? '💊 الصيدلي' : '💊 Pharmacist'}</p>}
                {msg.image_url && (
                  <PrescriptionThumb value={msg.image_url} className="w-32 sm:w-48 h-auto rounded-lg mb-2 hover:opacity-80 transition-opacity" />
                )}
                {msg.message}
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="p-2 sm:p-3 border-t border-border flex gap-2">
          <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReply()}
            placeholder={lang === 'ar' ? 'اكتب رد...' : 'Type reply...'}
            className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none" />
          <button onClick={handleReply} className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;