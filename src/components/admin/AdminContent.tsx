import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Upload, GripVertical } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface Banner {
  id: string;
  text: string;
  link: string;
  image_url: string;
}

const AdminContent = () => {
  const { lang } = useLanguage();
  const [address, setAddress] = useState('');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [healthTip, setHealthTip] = useState('');
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);
  const [phones, setPhones] = useState<string[]>([]);
  const [walletNumber, setWalletNumber] = useState('');

  useEffect(() => {
    supabase.from('banners').select('*').order('sort_order').then(({ data }) => {
      if (data) setBanners(data as Banner[]);
    });
    supabase.from('site_settings').select('*').then(({ data }) => {
      if (data) {
        const settings = Object.fromEntries(data.map((s: any) => [s.key, s.value]));
        setAddress(settings['address'] || '');
        setHealthTip(settings['health_tip'] || '');
        setSocialLinks(settings['social_links'] ? JSON.parse(settings['social_links']) : []);
        setPhones(settings['phones'] ? JSON.parse(settings['phones']) : []);
        setWalletNumber(settings['wallet_number'] || '');
      }
    });
  }, []);

  const handleSaveAll = async () => {
    const settings = [
      { key: 'address', value: address.trim() },
      { key: 'health_tip', value: healthTip.trim() },
      { key: 'social_links', value: JSON.stringify(socialLinks.filter(link => link.platform.trim() || link.url.trim())) },
      { key: 'phones', value: JSON.stringify(phones.map(phone => phone.trim()).filter(Boolean)) },
      { key: 'wallet_number', value: walletNumber.trim() },
    ];
    const { error } = await supabase.from('site_settings').upsert(settings, { onConflict: 'key' });
    if (error) {
      toast({ title: lang === 'ar' ? 'فشل حفظ الإعدادات' : 'Failed to save', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: lang === 'ar' ? 'تم حفظ الإعدادات' : 'Settings saved' });
  };

  const addBanner = async () => {
    const { data, error } = await supabase.from('banners').insert({ text: '', link: '', image_url: '', sort_order: banners.length }).select().single();
    if (error) { toast({ title: lang === 'ar' ? 'تعذر إضافة الإعلان' : 'Failed to add banner', variant: 'destructive' }); return; }
    if (data) setBanners(current => [...current, data as Banner]);
  };

  const updateBanner = (id: string, field: keyof Banner, value: string) => {
    setBanners(banners.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const saveBanner = async (banner: Banner) => {
    const { error } = await supabase.from('banners').update({ text: banner.text, link: banner.link, image_url: banner.image_url }).eq('id', banner.id);
    if (error) { toast({ title: lang === 'ar' ? 'فشل حفظ الإعلان' : 'Failed to save', variant: 'destructive' }); return; }
    toast({ title: lang === 'ar' ? 'تم حفظ الإعلان' : 'Banner saved' });
  };

  const deleteBanner = async (id: string) => {
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) { toast({ title: lang === 'ar' ? 'فشل حذف الإعلان' : 'Failed to delete', variant: 'destructive' }); return; }
    setBanners(current => current.filter(banner => banner.id !== id));
  };

  const handleImageUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const path = `banners/${id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('banner-images').upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: lang === 'ar' ? 'فشل رفع الصورة' : 'Upload failed', description: uploadError.message, variant: 'destructive' });
      return;
    }
    const { data: urlData } = supabase.storage.from('banner-images').getPublicUrl(path);
    updateBanner(id, 'image_url', urlData.publicUrl);
    toast({ title: lang === 'ar' ? 'تم رفع الصورة - اضغط حفظ' : 'Image uploaded - click save' });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground">{lang === 'ar' ? 'محتوى الصفحة الرئيسية' : 'Homepage Content'}</h2>
        <Button className="gap-2 shrink-0" size="sm" onClick={handleSaveAll}><Save size={14} />{lang === 'ar' ? 'حفظ الكل' : 'Save All'}</Button>
      </div>

      {/* Address */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-3">
        <h3 className="font-heading font-bold text-foreground text-sm">{lang === 'ar' ? 'عنوان الصيدلية' : 'Pharmacy Address'}</h3>
        <Input placeholder={lang === 'ar' ? 'العنوان' : 'Address'} value={address} onChange={e => setAddress(e.target.value)} />
      </div>

      {/* Wallet */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-3">
        <h3 className="font-heading font-bold text-foreground text-sm">{lang === 'ar' ? 'رقم المحفظة' : 'Wallet Number'}</h3>
        <p className="text-[10px] sm:text-xs text-muted-foreground">{lang === 'ar' ? 'الرقم اللي هيظهر للعميل' : 'Shown to customers for payment'}</p>
        <Input placeholder="01xxxxxxxxx" value={walletNumber} onChange={e => setWalletNumber(e.target.value)} />
      </div>

      {/* Banners */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-foreground text-sm">{lang === 'ar' ? 'البانرات الإعلانية' : 'Ad Banners'}</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{lang === 'ar' ? `${banners.length} إعلان` : `${banners.length} banners`}</p>
          </div>
          <Button size="sm" variant="outline" onClick={addBanner} className="gap-1 text-xs"><Plus size={12} />{lang === 'ar' ? 'جديد' : 'New'}</Button>
        </div>
        {banners.map((banner, index) => (
          <div key={banner.id} className="border border-border rounded-lg p-3 space-y-2 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                <GripVertical size={12} className="text-muted-foreground" />
                {lang === 'ar' ? `إعلان ${index + 1}` : `Banner ${index + 1}`}
              </span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => saveBanner(banner)} className="h-7 w-7 p-0"><Save size={12} /></Button>
                <button onClick={() => deleteBanner(banner.id)} className="h-7 w-7 flex items-center justify-center rounded bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 size={12} /></button>
              </div>
            </div>
            <Input placeholder={lang === 'ar' ? 'نص الإعلان' : 'Banner text'} value={banner.text} onChange={e => updateBanner(banner.id, 'text', e.target.value)} />
            <Input placeholder={lang === 'ar' ? 'رابط (اختياري)' : 'Link (optional)'} value={banner.link} onChange={e => updateBanner(banner.id, 'link', e.target.value)} />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors text-xs text-primary">
                <Upload size={12} />{lang === 'ar' ? 'صورة' : 'Upload'}
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(banner.id, e)} />
              </label>
              {banner.image_url && (
                <div className="relative">
                  <img src={banner.image_url} alt="" className="h-12 w-20 object-cover rounded-lg border border-border" />
                  <button onClick={() => updateBanner(banner.id, 'image_url', '')} className="absolute -top-1 -end-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px]">×</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Health Tip */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-3">
        <h3 className="font-heading font-bold text-foreground text-sm">{lang === 'ar' ? 'نصيحة اليوم' : 'Health Tip'}</h3>
        <textarea value={healthTip} onChange={e => setHealthTip(e.target.value)}
          className="w-full min-h-[60px] sm:min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      {/* Social Links */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-foreground text-sm">{lang === 'ar' ? 'السوشيال ميديا' : 'Social Media'}</h3>
          <Button size="sm" variant="outline" onClick={() => setSocialLinks([...socialLinks, { platform: '', url: '' }])} className="gap-1 text-xs"><Plus size={12} />{lang === 'ar' ? 'إضافة' : 'Add'}</Button>
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground">{lang === 'ar' ? 'أدخل الرابط الكامل (https://...)' : 'Enter full URL'}</p>
        {socialLinks.map((link, i) => (
          <div key={i} className="flex flex-col sm:flex-row gap-2">
            <Input placeholder={lang === 'ar' ? 'المنصة' : 'Platform'} value={link.platform} onChange={e => { const n = [...socialLinks]; n[i].platform = e.target.value; setSocialLinks(n); }} className="w-full sm:w-32" />
            <Input placeholder="https://..." value={link.url} onChange={e => { const n = [...socialLinks]; n[i].url = e.target.value; setSocialLinks(n); }} className="flex-1" />
            <button onClick={() => setSocialLinks(socialLinks.filter((_, idx) => idx !== i))} className="p-2 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 self-start"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      {/* Phones */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-3">
        <h3 className="font-heading font-bold text-foreground text-sm">{lang === 'ar' ? 'أرقام التواصل' : 'Contact Numbers'}</h3>
        {phones.map((phone, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input value={phone} onChange={e => { const n = [...phones]; n[i] = e.target.value; setPhones(n); }} />
            <button onClick={() => setPhones(phones.filter((_, idx) => idx !== i))} className="p-2 rounded bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => setPhones([...phones, ''])} className="gap-1 text-xs"><Plus size={12} />{lang === 'ar' ? 'رقم جديد' : 'Add'}</Button>
      </div>
    </div>
  );
};

export default AdminContent;