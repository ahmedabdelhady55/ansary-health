import { useState } from 'react';
import { Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const AdminSettings = () => {
  const { lang } = useLanguage();
  const [vodafoneCash, setVodafoneCash] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const savePaymentSettings = async () => {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'vodafone_cash', value: vodafoneCash.trim() }, { onConflict: 'key' });

    if (error) {
      toast({
        title: lang === 'ar' ? 'فشل الحفظ' : 'Failed to save',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({ title: lang === 'ar' ? 'تم الحفظ' : 'Saved' });
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: lang === 'ar' ? 'كلمة السر غير متطابقة' : 'Passwords do not match', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast({ title: error.message, variant: 'destructive' });
    else {
      toast({ title: lang === 'ar' ? 'تم تغيير كلمة المرور' : 'Password changed' });
      setNewPassword(''); setConfirmPassword('');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading font-bold text-foreground">{lang === 'ar' ? 'الإعدادات' : 'Settings'}</h2>

      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h3 className="font-heading font-bold text-foreground">{lang === 'ar' ? 'إعدادات الدفع' : 'Payment Settings'}</h3>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">{lang === 'ar' ? 'رقم فودافون كاش' : 'Vodafone Cash Number'}</label>
          <Input value={vodafoneCash} onChange={e => setVodafoneCash(e.target.value)} placeholder="01XXXXXXXXX" />
        </div>
        <Button className="gap-2" onClick={savePaymentSettings}><Save size={16} />{lang === 'ar' ? 'حفظ' : 'Save'}</Button>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h3 className="font-heading font-bold text-foreground">{lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</h3>
        <Input type="password" placeholder={lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <Input type="password" placeholder={lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        <Button className="gap-2" onClick={changePassword}><Save size={16} />{lang === 'ar' ? 'تغيير' : 'Change'}</Button>
      </div>
    </div>
  );
};

export default AdminSettings;
