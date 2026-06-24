import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  onClose: () => void;
}

const SignUpModal = ({ onClose }: Props) => {
  const { t } = useLanguage();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError(t('password') + ' mismatch');
      return;
    }
    if (!form.name || !form.email || !form.phone || !form.password || !form.address) {
      setError('All fields required');
      return;
    }
    setLoading(true);
    const result = await signup({
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      password: form.password,
    });
    setLoading(false);
    if (result.success) onClose();
    else setError(result.error || 'Registration failed');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-heading font-bold text-lg text-foreground">{t('signUp')}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && <p className="text-destructive text-sm font-semibold">{error}</p>}
          <input type="text" placeholder={t('name')} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none" />
          <input type="email" placeholder={t('email')} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none" />
          <input type="tel" placeholder={t('phone')} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none" />
          <input type="password" placeholder={t('password')} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none" />
          <input type="password" placeholder={t('confirmPassword')} value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none" />
          <textarea placeholder={t('address')} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} rows={2}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none resize-none" />
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-heading font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {t('createAccount')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUpModal;
