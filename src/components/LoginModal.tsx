import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { resolveLoginEmail } from '@/lib/auth';

interface Props {
  onClose: () => void;
}

const LoginModal = ({ onClose }: Props) => {
  const { t, lang } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier || !password) {
      setError(lang === 'ar' ? 'رقم الهاتف وكلمة المرور مطلوبان' : 'Phone and password are required');
      return;
    }

    setLoading(true);
    const result = await login(identifier, password);
    setLoading(false);

    if (result.success) {
      onClose();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
        if (roles && roles.some((role) => role.role === 'admin')) {
          navigate('/admin');
        }
      }
    } else {
      setError(
        result.error === 'Account not found'
          ? (lang === 'ar' ? 'رقم الهاتف أو البريد الإلكتروني غير مسجل' : 'Phone number or email is not registered')
          : result.error || (lang === 'ar' ? 'بيانات غير صحيحة' : 'Invalid credentials'),
      );
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!forgotIdentifier) {
      setError(lang === 'ar' ? 'أدخل رقم الهاتف أو البريد الإلكتروني' : 'Enter phone number or email');
      return;
    }

    try {
      const email = await resolveLoginEmail(forgotIdentifier);

      if (!email) {
        setError(lang === 'ar' ? 'لم يتم العثور على حساب بهذا الرقم' : 'No account found for this phone number');
        return;
      }

      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setForgotSent(true);
    } catch (forgotError) {
      setError(forgotError instanceof Error ? forgotError.message : (lang === 'ar' ? 'تعذر إرسال رابط الاستعادة' : 'Could not send reset link'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-heading font-bold text-lg text-foreground">
            {showForgot ? t('resetPassword') : t('logIn')}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>

        {showForgot ? (
          <form onSubmit={handleForgot} className="p-4 space-y-3">
            {error && <p className="text-destructive text-sm font-semibold">{error}</p>}
            {forgotSent ? (
              <p className="text-secondary text-sm font-semibold text-center py-4">
                ✓ {lang === 'ar' ? 'تم إرسال رابط استعادة كلمة السر' : 'Reset link sent!'}
              </p>
            ) : (
              <>
                <p className="text-muted-foreground text-sm">{lang === 'ar' ? 'أدخل رقم الموبايل أو البريد الإلكتروني' : 'Enter your phone number or email'}</p>
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'رقم الموبايل أو البريد الإلكتروني' : 'Phone number or email'}
                  value={forgotIdentifier}
                  onChange={e => setForgotIdentifier(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
                />
                <button type="submit" className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-heading font-bold text-sm hover:opacity-90 transition-opacity">
                  {t('sendReset')}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                setShowForgot(false);
                setForgotSent(false);
                setForgotIdentifier('');
                setError('');
              }}
              className="w-full text-sm text-primary hover:underline"
            >
              {t('login')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            {error && <p className="text-destructive text-sm font-semibold">{error}</p>}
            <input
              type="text"
              placeholder={lang === 'ar' ? 'رقم الموبايل أو البريد الإلكتروني' : 'Phone number or email'}
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
            />
            <input
              type="password"
              placeholder={t('password')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
            />
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-heading font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {t('login')}
            </button>
            <button type="button" onClick={() => { setShowForgot(true); setForgotSent(false); setError(''); }}
              className="w-full text-sm text-primary hover:underline">
              {t('forgotPassword')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
