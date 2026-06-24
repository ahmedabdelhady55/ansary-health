import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  loyalty_points: number;
  total_purchases: number;
  created_at: string;
}

const AdminCustomers = () => {
  const { lang } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setCustomers(data as Customer[]);
    });
  }, []);

  const filtered = customers.filter(c =>
    c.name.includes(searchTerm) || c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
        {lang === 'ar' ? 'إدارة العملاء' : 'Customer Management'}
      </h2>

      <Input
        placeholder={lang === 'ar' ? 'بحث بالاسم أو الموبايل...' : 'Search by name or phone...'}
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full sm:max-w-sm"
      />

      {customers.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">{lang === 'ar' ? 'لا يوجد عملاء مسجلين بعد' : 'No registered customers yet'}</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="block sm:hidden space-y-2">
            {filtered.map(customer => (
              <div key={customer.id} className="bg-card rounded-xl border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-foreground text-sm">{customer.name}</span>
                  <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-semibold">{customer.loyalty_points} {lang === 'ar' ? 'نقطة' : 'pts'}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>📱 {customer.phone}</p>
                  {customer.address && <p>📍 {customer.address}</p>}
                  <p className="text-foreground font-semibold">{lang === 'ar' ? 'المشتريات:' : 'Purchases:'} {customer.total_purchases} ج.م</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-card rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'الموبايل' : 'Phone'}</th>
                  <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'العنوان' : 'Address'}</th>
                  <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'المشتريات' : 'Purchases'}</th>
                  <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'نقاط الولاء' : 'Points'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(customer => (
                  <tr key={customer.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 text-foreground font-semibold">{customer.name}</td>
                    <td className="p-3 text-foreground">{customer.phone}</td>
                    <td className="p-3 text-muted-foreground">{customer.address}</td>
                    <td className="p-3 text-foreground font-semibold">{customer.total_purchases} ج.م</td>
                    <td className="p-3">
                      <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full font-semibold">{customer.loyalty_points}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminCustomers;