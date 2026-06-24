import { useState, useEffect } from 'react';
import { ArrowLeft, User, ShoppingBag, Star, Lock, Edit2, LogOut, Trophy } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface Props {
  onBack: () => void;
}

interface OrderRecord {
  id: string;
  order_number: number;
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
}

const ProfilePage = ({ onBack }: Props) => {
  const { lang } = useLanguage();
  const { user, profile, logout, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'edit' | 'password'>('info');
  const [editData, setEditData] = useState({ phone: '', address: '' });
  const [passwords, setPasswords] = useState({ newPass: '', confirm: '' });
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [minRedeemPoints, setMinRedeemPoints] = useState(50);

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'min_redeem_points').single().then(({ data }) => {
      if (data) setMinRedeemPoints(Number(data.value));
    });
  }, []);

  const loyaltyPoints = profile?.loyalty_points || 0;
  const canRedeem = loyaltyPoints >= minRedeemPoints;

  useEffect(() => {
    if (profile) setEditData({ phone: profile.phone, address: profile.address });
  }, [profile]);

  useEffect(() => {
    if (user) {
      supabase.from('orders').select('id, order_number, total, status, payment_method, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data }) => { if (data) setOrders(data as OrderRecord[]); });
    }
  }, [user]);

  const handleSaveInfo = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ phone: editData.phone, address: editData.address }).eq('id', user.id);
    if (error) { toast({ title: error.message, variant: 'destructive' }); } else {
      toast({ title: lang === 'ar' ? 'تم تحديث البيانات بنجاح' : 'Info updated' });
      await refreshProfile();
      setActiveTab('info');
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPass !== passwords.confirm) { toast({ title: lang === 'ar' ? 'كلمة السر غير متطابقة' : 'Passwords do not match', variant: 'destructive' }); return; }
    if (passwords.newPass.length < 6) { toast({ title: lang === 'ar' ? 'كلمة السر يجب أن تكون 6 أحرف على الأقل' : 'Min 6 characters', variant: 'destructive' }); return; }
    const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
    if (error) { toast({ title: error.message, variant: 'destructive' }); } else {
      toast({ title: lang === 'ar' ? 'تم تغيير كلمة السر بنجاح' : 'Password changed' });
      setPasswords({ newPass: '', confirm: '' });
      setActiveTab('info');
    }
  };

  if (!user || !profile) return null;

  const statusMap: Record<string, string> = {
    new: lang === 'ar' ? 'جديد' : 'New',
    preparing: lang === 'ar' ? 'قيد التحضير' : 'Preparing',
    ready: lang === 'ar' ? 'جاهز' : 'Ready',
    delivered: lang === 'ar' ? 'تم التوصيل' : 'Delivered',
  };

  return (
    <div className="bg-card/90 backdrop-blur-md rounded-xl border border-border shadow-lg max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={onBack} className="p-1.5 rounded-lg bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"><ArrowLeft size={18} /></button>
        <h2 className="font-heading font-bold text-foreground">{lang === 'ar' ? 'الصفحة الشخصية' : 'My Profile'}</h2>
      </div>

      <div className="p-4 space-y-4">
        <div className="text-center py-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2"><User size={32} className="text-primary" /></div>
          <h3 className="font-heading font-bold text-foreground text-lg">{profile.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/80 rounded-lg border border-border p-3 text-center">
            <ShoppingBag size={20} className="text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'إجمالي المشتريات' : 'Total Purchases'}</p>
            <p className="font-heading font-bold text-foreground">{profile.total_purchases} {lang === 'ar' ? 'ج.م' : 'EGP'}</p>
          </div>
          <div className="bg-background/80 rounded-lg border border-border p-3 text-center">
            <Star size={20} className="text-secondary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'نقاط الولاء' : 'Loyalty Points'}</p>
            <p className="font-heading font-bold text-foreground">{loyaltyPoints}</p>
          </div>
        </div>

        <div className={`rounded-lg border p-3 ${canRedeem ? 'border-green-500/50 bg-green-500/5' : 'border-border bg-background/80'}`}>
          <div className="flex items-center gap-2">
            <Trophy size={18} className={canRedeem ? 'text-green-500' : 'text-muted-foreground'} />
            <div className="flex-1">
              <p className="text-sm font-heading font-semibold text-foreground">
                {canRedeem
                  ? (lang === 'ar' ? '🎉 يمكنك استخدام نقاطك في السلة!' : '🎉 You can redeem points in cart!')
                  : (lang === 'ar' ? `اجمع ${minRedeemPoints} نقطة لاستخدام رصيدك` : `Collect ${minRedeemPoints} points to redeem`)}
              </p>
              {!canRedeem && (
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${Math.min((loyaltyPoints / minRedeemPoints) * 100, 100)}%` }} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setActiveTab('info')} className={`flex-1 py-2 rounded-lg text-sm font-heading font-semibold transition-colors ${activeTab === 'info' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>{lang === 'ar' ? 'معلوماتي' : 'My Info'}</button>
          <button onClick={() => setActiveTab('edit')} className={`flex-1 py-2 rounded-lg text-sm font-heading font-semibold transition-colors ${activeTab === 'edit' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}><Edit2 size={14} className="inline me-1" />{lang === 'ar' ? 'تعديل' : 'Edit'}</button>
          <button onClick={() => setActiveTab('password')} className={`flex-1 py-2 rounded-lg text-sm font-heading font-semibold transition-colors ${activeTab === 'password' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}><Lock size={14} className="inline me-1" />{lang === 'ar' ? 'كلمة السر' : 'Password'}</button>
        </div>

        {activeTab === 'info' && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-background/80 rounded-lg border border-border p-3 space-y-2 text-sm">
              <p><span className="font-semibold text-foreground">{lang === 'ar' ? 'الاسم' : 'Name'}:</span> <span className="text-muted-foreground">{profile.name}</span></p>
              <p><span className="font-semibold text-foreground">{lang === 'ar' ? 'البريد' : 'Email'}:</span> <span className="text-muted-foreground">{user.email}</span></p>
              <p><span className="font-semibold text-foreground">{lang === 'ar' ? 'الموبايل' : 'Phone'}:</span> <span className="text-muted-foreground">{profile.phone}</span></p>
              <p><span className="font-semibold text-foreground">{lang === 'ar' ? 'العنوان' : 'Address'}:</span> <span className="text-muted-foreground">{profile.address}</span></p>
            </div>

            <h4 className="font-heading font-bold text-foreground text-sm">{lang === 'ar' ? 'سجل الطلبات' : 'Order History'}</h4>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{lang === 'ar' ? 'لا توجد طلبات بعد' : 'No orders yet'}</p>
            ) : (
              <div className="space-y-2">
                {orders.map(order => (
                  <div key={order.id} className="bg-background/80 rounded-lg border border-border p-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-foreground">#{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">{order.payment_method === 'wallet' ? '📱 محفظة' : '💵 كاش'}</p>
                    </div>
                    <div className="text-end">
                      <p className="font-bold text-primary">{order.total} {lang === 'ar' ? 'ج.م' : 'EGP'}</p>
                      <p className="text-xs text-muted-foreground">{statusMap[order.status] || order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'edit' && (
          <div className="space-y-3 animate-fade-in">
            <div><label className="text-sm font-heading text-foreground">{lang === 'ar' ? 'رقم الموبايل' : 'Phone'}</label><Input value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} /></div>
            <div><label className="text-sm font-heading text-foreground">{lang === 'ar' ? 'العنوان' : 'Address'}</label><Input value={editData.address} onChange={e => setEditData({ ...editData, address: e.target.value })} /></div>
            <Button onClick={handleSaveInfo} className="w-full">{lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</Button>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="space-y-3 animate-fade-in">
            <div><label className="text-sm font-heading text-foreground">{lang === 'ar' ? 'كلمة السر الجديدة' : 'New Password'}</label><Input type="password" value={passwords.newPass} onChange={e => setPasswords({ ...passwords, newPass: e.target.value })} /></div>
            <div><label className="text-sm font-heading text-foreground">{lang === 'ar' ? 'تأكيد كلمة السر' : 'Confirm Password'}</label><Input type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} /></div>
            <Button onClick={handleChangePassword} className="w-full">{lang === 'ar' ? 'تغيير كلمة السر' : 'Change Password'}</Button>
          </div>
        )}

        <Button variant="destructive" onClick={logout} className="w-full gap-2"><LogOut size={16} />{lang === 'ar' ? 'تسجيل خروج' : 'Log Out'}</Button>
      </div>
    </div>
  );
};

export default ProfilePage;
