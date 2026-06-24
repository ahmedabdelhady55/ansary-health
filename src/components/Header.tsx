import { useState, useEffect } from 'react';
import { Sun, Moon, Globe, User, LogOut, ShoppingCart, Bell } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import SignUpModal from './SignUpModal';
import LoginModal from './LoginModal';
import pharmacyLogo from '@/assets/pharmacy-logo.jpeg';

interface HeaderProps {
  onNavigate?: (view: string) => void;
}

const Header = ({ onNavigate }: HeaderProps) => {
  const { t, toggleLang, lang } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { isLoggedIn, logout, profile, isEmployee } = useAuth();
  const { totalItems } = useCart();
  const [showSignUp, setShowSignUp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-open login modal after password reset
  useEffect(() => {
    if (searchParams.get('login') === '1' && !isLoggedIn) {
      setShowLogin(true);
      toast({
        title: lang === 'ar' ? 'تم تحديث كلمة السر ✓' : 'Password updated ✓',
        description: lang === 'ar'
          ? 'سجّل الدخول الآن باستخدام كلمة السر الجديدة'
          : 'Sign in now with your new password',
      });
      // Clean the URL param
      const next = new URLSearchParams(searchParams);
      next.delete('login');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Admin bell - count new orders
  useEffect(() => {
    if (!isEmployee) return;
    const fetchCount = async () => {
      const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'new');
      setNewOrdersCount(count || 0);
    };
    fetchCount();
    const ch = supabase.channel('header-order-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchCount())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isEmployee]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto flex items-center justify-between py-2 px-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate?.('home')}>
            <img src={pharmacyLogo} alt="صيدلية الأنصار" className="w-10 h-10 rounded-full object-cover border-2 border-primary shadow-sm" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-heading font-bold text-primary leading-tight">{t('pharmacyName')}</h1>
              <p className="text-[10px] text-muted-foreground font-heading">Care For Life</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors" aria-label="Toggle theme">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button onClick={toggleLang} className="p-2 rounded-lg bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1 text-sm font-heading font-semibold" aria-label="Toggle language">
              <Globe size={16} />
              <span className="hidden sm:inline">{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                {/* Admin bell */}
                {isEmployee && (
                  <button className="p-2 rounded-lg bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors relative" aria-label="Notifications">
                    <Bell size={18} />
                    {newOrdersCount > 0 && (
                      <span className="absolute -top-1 -end-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">{newOrdersCount}</span>
                    )}
                  </button>
                )}

                <button onClick={() => onNavigate?.('cart')} className="p-2 rounded-lg bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors relative" aria-label="Cart">
                  <ShoppingCart size={18} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -end-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{totalItems}</span>
                  )}
                </button>
                <button onClick={() => onNavigate?.('profile')} className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity" aria-label="Profile">
                  <User size={18} />
                </button>
                <button onClick={logout} className="p-2 rounded-lg bg-muted text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors" aria-label="Logout">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowSignUp(true)} className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:opacity-90 transition-opacity">
                  {t('signUp')}
                </button>
                <button onClick={() => setShowLogin(true)} className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-primary text-primary font-heading font-semibold text-sm hover:bg-primary hover:text-primary-foreground transition-colors">
                  {t('logIn')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showSignUp && <SignUpModal onClose={() => setShowSignUp(false)} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
};

export default Header;
