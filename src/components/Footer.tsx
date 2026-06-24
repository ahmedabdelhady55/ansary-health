import { useState, useEffect } from 'react';
import { Facebook, Instagram, Phone, MapPin, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import pharmacyLogo from '@/assets/pharmacy-logo.jpeg';

const Footer = () => {
  const { t } = useLanguage();
  const [address, setAddress] = useState('');
  const [phones, setPhones] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);

  useEffect(() => {
    supabase.from('site_settings').select('*').then(({ data }) => {
      if (data) {
        const settings = Object.fromEntries(data.map((s: any) => [s.key, s.value]));
        setAddress(settings['address'] || '');
        setPhones(settings['phones'] ? JSON.parse(settings['phones']) : []);
        setSocialLinks(settings['social_links'] ? JSON.parse(settings['social_links']) : []);
      }
    });
  }, []);

  const getSocialIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('facebook') || p.includes('فيسبوك')) return <Facebook size={18} />;
    if (p.includes('instagram') || p.includes('انستجرام')) return <Instagram size={18} />;
    if (p.includes('whatsapp') || p.includes('واتساب')) return <MessageCircle size={18} />;
    return <MessageCircle size={18} />;
  };

  const formatUrl = (url: string) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  return (
    <footer className="bg-card/90 backdrop-blur-md border-t border-border mt-8">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-heading font-bold text-foreground mb-3">{t('contactUs')}</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              {phones.length > 0 ? phones.map((phone, i) => (
                <p key={i} className="flex items-center gap-2"><Phone size={14} /> {phone}</p>
              )) : (
                <p className="flex items-center gap-2"><Phone size={14} /> —</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-heading font-bold text-foreground mb-3">{t('followUs')}</h3>
            <div className="flex gap-3">
              {socialLinks.length > 0 ? socialLinks.map((link, i) => (
                <a key={i} href={formatUrl(link.url)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  {getSocialIcon(link.platform)}
                </a>
              )) : (
                <>
                  <span className="p-2 rounded-lg bg-muted text-muted-foreground"><Facebook size={18} /></span>
                  <span className="p-2 rounded-lg bg-muted text-muted-foreground"><Instagram size={18} /></span>
                </>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-heading font-bold text-foreground mb-3">{t('ourAddress')}</h3>
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin size={14} className="mt-1 shrink-0" />
              <span>{address || '—'}</span>
            </p>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <img src={pharmacyLogo} alt="Logo" className="w-6 h-6 rounded-full object-cover" />
          © 2026 {t('pharmacyName')} - {t('allRights')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
