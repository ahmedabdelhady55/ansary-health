import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { playNotificationSound } from '@/lib/notifications';
import { toast } from '@/hooks/use-toast';

const NotificationListener = () => {
  const { user, isEmployee } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    if (isEmployee) {
      const ch = supabase
        .channel('admin-live-notifs')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
          playNotificationSound();
          toast({ title: '📦 طلب جديد!' });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_messages' }, (payload) => {
          if ((payload.new as any).sender_type === 'user') {
            playNotificationSound();
            toast({ title: '💬 رسالة جديدة من عميل!' });
          }
        })
        .subscribe();
      channels.push(ch);
    } else {
      const ch = supabase
        .channel('customer-live-notifs')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, (payload) => {
          const order = payload.new as any;
          const labels: Record<string, string> = {
            preparing: '🔧 طلبك قيد التحضير',
            ready: '✅ طلبك جاهز للتسليم',
            delivered: '🎉 تم توصيل طلبك',
          };
          if (labels[order.status]) {
            playNotificationSound();
            toast({ title: labels[order.status] });
          }
          if (order.payment_confirmed) {
            playNotificationSound();
            toast({ title: '💰 تم تأكيد الدفع وإضافة نقاط الولاء!' });
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_messages' }, (payload) => {
          if ((payload.new as any).sender_type === 'pharmacist') {
            playNotificationSound();
            toast({ title: '💊 رد جديد من الصيدلي' });
          }
        })
        .subscribe();
      channels.push(ch);
    }

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [user, isEmployee]);

  return null;
};

export default NotificationListener;
