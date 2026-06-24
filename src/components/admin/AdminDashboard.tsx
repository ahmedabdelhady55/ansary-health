import { useState, useEffect } from 'react';
import { Users, ShoppingCart, DollarSign, Package, TrendingUp, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  onNavigate?: (section: string) => void;
}

const AdminDashboard = ({ onNavigate }: Props) => {
  const { lang } = useLanguage();
  const [customerCount, setCustomerCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);

  useEffect(() => {
    supabase.from('profiles').select('id', { count: 'exact', head: true }).then(({ count }) => {
      if (count !== null) setCustomerCount(count);
    });
    supabase.from('orders').select('id, total').then(({ data }) => {
      if (data) {
        setOrderCount(data.length);
        setTotalSales(data.reduce((sum, o) => sum + Number(o.total), 0));
      }
    });
    supabase.from('categories').select('id', { count: 'exact', head: true }).then(({ count }) => {
      if (count !== null) setCategoryCount(count);
    });
  }, []);

  const stats = [
    { icon: Eye, label: lang === 'ar' ? 'زوار اليوم' : "Today's Visitors", value: '0', color: 'text-primary', bg: 'bg-primary/10', section: 'dashboard' },
    { icon: Users, label: lang === 'ar' ? 'إجمالي العملاء' : 'Total Customers', value: customerCount.toString(), color: 'text-secondary', bg: 'bg-secondary/10', section: 'customers' },
    { icon: ShoppingCart, label: lang === 'ar' ? 'الطلبات' : 'Orders', value: orderCount.toString(), color: 'text-primary', bg: 'bg-primary/10', section: 'orders' },
    { icon: DollarSign, label: lang === 'ar' ? 'إجمالي المبيعات' : 'Total Sales', value: `${totalSales} ج.م`, color: 'text-secondary', bg: 'bg-secondary/10', section: 'orders' },
    { icon: Package, label: lang === 'ar' ? 'الأقسام' : 'Categories', value: categoryCount.toString(), color: 'text-primary', bg: 'bg-primary/10', section: 'categories' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading font-bold text-foreground">{lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <button key={i} onClick={() => onNavigate?.(stat.section)} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow text-start w-full cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${stat.bg}`}><stat.icon size={20} className={stat.color} /></div>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
