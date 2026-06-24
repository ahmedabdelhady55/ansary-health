import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import pharmacyLogo from '@/assets/pharmacy-logo.jpeg';
import pharmacyBg from '@/assets/pharmacy-bg.jpg';

const ResetPassword = () => {
  const { lang, dir } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery token from the URL hash on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(lang === 'ar' ? 'كلمة السر يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError(lang === 'ar' ? 'كلمتا السر غير متطابقتين' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    // Sign out so the user must log in fresh with the new password
    await supabase.auth.signOut();
    setLoading(false);
    setSuccess(true);

    setTimeout(() => {
      navigate('/?login=1', { replace: true });
    }, 2000);
  };

  return (
    <div dir={dir} className="min-h-screen relative font-body">
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${pharmacyBg})` }} />
      <div className="fixed inset-0 z-0 bg-overlay" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
          <div className="flex flex-col items-center mb-4">
            <img src={pharmacyLogo} alt="Logo" className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
            <h1 className="font-heading font-bold text-xl text-foreground mt-3">
              {lang === 'ar' ? 'إعادة تعيين كلمة السر' : 'Reset Password'}
            </h1>
          </div>

          {success ? (
            <div className="text-center py-4 space-y-2">
              <p className="text-secondary font-semibold text-base">
                ✓ {lang === 'ar' ? 'تم تحديث كلمة السر بنجاح!' : 'Password updated successfully!'}
              </p>
              <p className="text-muted-foreground text-sm">
                {lang === 'ar' ? 'جاري تحويلك لتسجيل الدخول...' : 'Redirecting you to sign in...'}
              </p>
            </div>
          ) : !sessionReady ? (
            <p className="text-muted-foreground text-center text-sm py-4">
              {lang === 'ar' ? 'جاري التحقق من الرابط...' : 'Verifying link...'}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && <p className="text-destructive text-sm font-semibold">{error}</p>}
              <input
                type="password"
                placeholder={lang === 'ar' ? 'كلمة السر الجديدة' : 'New password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
              />
              <input
                type="password"
                placeholder={lang === 'ar' ? 'تأكيد كلمة السر' : 'Confirm password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-heading font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {lang === 'ar' ? 'تحديث كلمة السر' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
