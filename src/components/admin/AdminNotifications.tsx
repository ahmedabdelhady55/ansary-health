import { useState } from 'react';
import { Send, MessageCircle, Mail, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface CustomerResult {
  id: string;
  name: string;
  phone: string;
  email: string;
}

const AdminNotifications = () => {
  const { lang } = useLanguage();
  const [target, setTarget] = useState<'all' | 'specific'>('all');
  const [method, setMethod] = useState<'whatsapp' | 'email' | 'site'>('site');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);

  const searchCustomers = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase.from('profiles').select('id, name, phone, email')
      .or(`phone.ilike.%${term}%,email.ilike.%${term}%,name.ilike.%${term}%`)
      .limit(5);
    if (data) setSearchResults(data as CustomerResult[]);
  };

  const selectCustomer = (customer: CustomerResult) => {
    setSelectedCustomer(customer);
    setSearchTerm('');
    setSearchResults([]);
  };

  const sendNotification = () => {
    if (!message.trim()) {
      toast({ title: lang === 'ar' ? 'اكتب رسالة أولاً' : 'Write a message first', variant: 'destructive' });
      return;
    }
    if (target === 'specific' && !selectedCustomer) {
      toast({ title: lang === 'ar' ? 'اختر عميل أولاً' : 'Select a customer first', variant: 'destructive' });
      return;
    }
    if (method === 'whatsapp') {
      const phone = selectedCustomer?.phone || '';
      const number = phone.startsWith('0') ? `2${phone}` : phone;
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(message.trim())}`, '_blank');
    } else if (method === 'email') {
      const email = selectedCustomer?.email || '';
      window.open(`mailto:${email}?subject=${encodeURIComponent(lang === 'ar' ? 'إشعار من صيدلية الأنصار' : 'Notification')}&body=${encodeURIComponent(message.trim())}`, '_blank');
    }
    toast({ title: lang === 'ar' ? 'تم إرسال الإشعار!' : 'Notification sent!' });
    setMessage('');
    setSelectedCustomer(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
        {lang === 'ar' ? 'إدارة الإشعارات' : 'Notifications'}
      </h2>

      <div className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-4">
        {/* Target */}
        <div>
          <p className="text-xs sm:text-sm font-semibold text-foreground mb-2">{lang === 'ar' ? 'إرسال إلى:' : 'Send to:'}</p>
          <div className="flex gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-xs sm:text-sm">
              <input type="radio" checked={target === 'all'} onChange={() => { setTarget('all'); setSelectedCustomer(null); }} />
              {lang === 'ar' ? 'جميع العملاء' : 'All'}
            </label>
            <label className="flex items-center gap-2 text-xs sm:text-sm">
              <input type="radio" checked={target === 'specific'} onChange={() => setTarget('specific')} />
              {lang === 'ar' ? 'عميل محدد' : 'Specific'}
            </label>
          </div>
        </div>

        {target === 'specific' && (
          <div className="space-y-2">
            {selectedCustomer ? (
              <div className="flex items-center gap-3 bg-primary/10 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-foreground text-sm">{selectedCustomer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedCustomer.phone} • {selectedCustomer.email}</p>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-xs text-destructive hover:underline shrink-0">
                  {lang === 'ar' ? 'تغيير' : 'Change'}
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-2">
                  <Search size={14} className="text-muted-foreground shrink-0" />
                  <Input
                    placeholder={lang === 'ar' ? 'ابحث بالاسم أو الموبايل...' : 'Search...'}
                    value={searchTerm}
                    onChange={e => searchCustomers(e.target.value)}
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                    {searchResults.map(c => (
                      <button key={c.id} onClick={() => selectCustomer(c)} className="w-full text-start p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                        <p className="font-heading font-semibold text-foreground text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.phone} • {c.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Method */}
        <div>
          <p className="text-xs sm:text-sm font-semibold text-foreground mb-2">{lang === 'ar' ? 'طريقة الإرسال:' : 'Method:'}</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setMethod('whatsapp')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${method === 'whatsapp' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
              <MessageCircle size={14} /> WhatsApp
            </button>
            <button onClick={() => setMethod('email')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${method === 'email' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
              <Mail size={14} /> {lang === 'ar' ? 'إيميل' : 'Email'}
            </button>
          </div>
        </div>

        <textarea
          placeholder={lang === 'ar' ? 'اكتب الرسالة هنا...' : 'Write your message...'}
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="w-full min-h-[80px] sm:min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <Button onClick={sendNotification} className="gap-2 w-full sm:w-auto" size="sm">
          <Send size={14} />
          {lang === 'ar' ? 'إرسال' : 'Send'}
        </Button>
      </div>
    </div>
  );
};

export default AdminNotifications;