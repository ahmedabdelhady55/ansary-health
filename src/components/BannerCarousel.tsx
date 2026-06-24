import { useState, useEffect } from 'react';
import { Megaphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface Banner {
  id: string;
  text: string;
  link: string;
  image_url: string;
}

const BannerCarousel = () => {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    supabase.from('banners').select('*').eq('active', true).order('sort_order').then(({ data }) => {
      if (data && data.length > 0) setBanners(data as Banner[]);
    });
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const prev = () => setCurrent(c => (c - 1 + banners.length) % banners.length);
  const next = () => setCurrent(c => (c + 1) % banners.length);
  const banner = banners[current];
  const linkUrl = banner.link ? (banner.link.startsWith('http') ? banner.link : `https://${banner.link}`) : undefined;

  const content = banner.image_url ? (
    <img src={banner.image_url} alt={banner.text} className="w-full h-40 object-cover rounded-lg" />
  ) : (
    <div className="bg-gradient-to-l from-primary/10 to-secondary/10 p-6">
      <p className="font-heading font-bold text-primary text-lg">{banner.text}</p>
    </div>
  );

  return (
    <div className="bg-card/90 backdrop-blur-md rounded-xl border border-border p-4 shadow-md animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <Megaphone size={18} className="text-primary" />
        <h3 className="font-heading font-bold text-foreground text-sm">{t('adBanner')}</h3>
        {banners.length > 1 && (
          <span className="text-xs text-muted-foreground ms-auto">{current + 1}/{banners.length}</span>
        )}
      </div>

      <div className="relative overflow-hidden rounded-lg">
        {linkUrl ? (
          <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full rounded-lg border border-primary/20 text-center hover:shadow-lg transition-all">
            {content}
          </a>
        ) : (
          <div className="block w-full rounded-lg border border-primary/20 text-center">
            {content}
          </div>
        )}

        {banners.length > 1 && (
          <>
            <button onClick={prev} className="absolute start-1 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full p-1 shadow">
              <ChevronLeft size={16} />
            </button>
            <button onClick={next} className="absolute end-1 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full p-1 shadow">
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {banners.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-primary w-4' : 'bg-muted-foreground/30'}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;
