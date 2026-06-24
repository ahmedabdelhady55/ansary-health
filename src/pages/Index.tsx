import { useState, useEffect } from 'react';
import { ShoppingBag, MessageCircle, Lightbulb, ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategoriesView from '@/components/CategoriesView';
import MedicineChat from '@/components/MedicineChat';
import BannerCarousel from '@/components/BannerCarousel';
import ProfilePage from '@/components/ProfilePage';
import CartPage from '@/components/CartPage';
import NotificationListener from '@/components/NotificationListener';
import pharmacyBg from '@/assets/pharmacy-bg.jpg';

type View = 'home' | 'categories' | 'chat' | 'profile' | 'cart';

const Index = () => {
  const { t, dir } = useLanguage();
  const { isLoggedIn } = useAuth();
  const { totalItems } = useCart();
  const [view, setView] = useState<View>('home');
  const [healthTip, setHealthTip] = useState('');

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'health_tip').single().then(({ data }) => {
      if (data) setHealthTip(data.value);
    });
  }, []);

  return (
    <div dir={dir} className="min-h-screen relative font-body">
      <NotificationListener />
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${pharmacyBg})` }} />
      <div className="fixed inset-0 z-0 bg-overlay" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <Header onNavigate={(v: string) => setView(v as View)} />

        <main className="flex-1 container mx-auto px-4 py-6">
          {view === 'profile' && isLoggedIn ? (
            <ProfilePage onBack={() => setView('home')} />
          ) : view === 'cart' && isLoggedIn ? (
            <CartPage onBack={() => setView('home')} />
          ) : view === 'categories' && isLoggedIn ? (
            <CategoriesView onBack={() => setView('home')} />
          ) : view === 'chat' && isLoggedIn ? (
            <MedicineChat onBack={() => setView('home')} />
          ) : (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="text-center py-8 animate-fade-in">
                <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-foreground mb-2">{t('welcomeTitle')}</h2>
                <p className="text-muted-foreground font-heading text-lg">{t('welcomeSubtitle')}</p>
              </div>

              <BannerCarousel />

              {healthTip && (
                <div className="bg-card/90 backdrop-blur-md rounded-xl border border-border p-4 shadow-md animate-fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={18} className="text-secondary" />
                    <h3 className="font-heading font-bold text-foreground text-sm">{t('healthTip')}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{healthTip}</p>
                </div>
              )}

              {isLoggedIn ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                  <button onClick={() => setView('categories')} className="flex items-center justify-center gap-3 p-6 rounded-xl bg-primary text-primary-foreground font-heading font-bold text-lg shadow-lg hover:opacity-90 hover:shadow-xl transition-all">
                    <ShoppingBag size={24} />
                    {t('categories')}
                  </button>
                  <button onClick={() => setView('chat')} className="flex items-center justify-center gap-3 p-6 rounded-xl bg-secondary text-secondary-foreground font-heading font-bold text-lg shadow-lg hover:opacity-90 hover:shadow-xl transition-all">
                    <MessageCircle size={24} />
                    {t('findMedicine')}
                  </button>
                  <button onClick={() => setView('cart')} className="flex items-center justify-center gap-3 p-6 rounded-xl bg-accent text-accent-foreground font-heading font-bold text-lg shadow-lg hover:opacity-90 hover:shadow-xl transition-all relative sm:col-span-2">
                    <ShoppingCart size={24} />
                    {dir === 'rtl' ? 'سلة المشتريات' : 'Shopping Cart'}
                    {totalItems > 0 && (
                      <span className="absolute top-2 end-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">{totalItems}</span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 bg-card/90 backdrop-blur-md rounded-xl border border-border p-6 animate-fade-in">
                  <p className="text-muted-foreground font-heading">{t('guestMessage')}</p>
                </div>
              )}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Index;
