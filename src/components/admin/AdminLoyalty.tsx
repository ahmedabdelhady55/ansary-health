import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LoyaltyRule {
  id: string;
  category: string;
  category_en: string;
  spend_amount: number;
  points_earned: number;
}

const AdminLoyalty = () => {
  const { lang } = useLanguage();
  const [minRedeemPoints, setMinRedeemPoints] = useState(50);
  const [rules, setRules] = useState<LoyaltyRule[]>([]);

  const fetchRules = async () => {
    const { data } = await supabase.from('loyalty_rules').select('*');
    if (data) setRules(data as LoyaltyRule[]);
  };

  useEffect(() => {
    fetchRules();
    supabase.from('site_settings').select('value').eq('key', 'min_redeem_points').single().then(({ data }) => {
      if (data) setMinRedeemPoints(Number(data.value));
    });
  }, []);

  const syncCategories = async () => {
    const { data: cats } = await supabase.from('categories').select('name, name_en');
    if (!cats) return;
    for (const cat of cats) {
      const exists = rules.some(r => r.category_en === cat.name_en);
      if (!exists) {
        await supabase.from('loyalty_rules').insert({ category: cat.name, category_en: cat.name_en, spend_amount: 100, points_earned: 10 });
      }
    }
    const hasMedicine = rules.some(r => r.category_en === 'Medicine');
    if (!hasMedicine) {
      await supabase.from('loyalty_rules').insert({ category: 'علاج', category_en: 'Medicine', spend_amount: 100, points_earned: 10 });
    }
    await fetchRules();
    toast({ title: lang === 'ar' ? 'تم مزامنة الأقسام' : 'Categories synced' });
  };

  const updateRule = (id: string, field: 'spend_amount' | 'points_earned', value: number) => {
    setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSave = async () => {
    for (const rule of rules) {
      await supabase.from('loyalty_rules').update({ spend_amount: rule.spend_amount, points_earned: rule.points_earned }).eq('id', rule.id);
    }
    await supabase.from('site_settings').upsert({ key: 'min_redeem_points', value: minRedeemPoints.toString() });
    toast({ title: lang === 'ar' ? 'تم حفظ الإعدادات' : 'Settings saved' });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
          {lang === 'ar' ? 'إعدادات نقاط الولاء' : 'Loyalty Points Settings'}
        </h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm" size="sm" onClick={syncCategories}>
            <RefreshCw size={14} />
            {lang === 'ar' ? 'مزامنة' : 'Sync'}
          </Button>
          <Button className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm" size="sm" onClick={handleSave}>
            <Save size={14} />
            {lang === 'ar' ? 'حفظ' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-3">
        <h3 className="font-heading font-bold text-foreground text-sm">
          {lang === 'ar' ? 'الحد الأدنى لاستخدام النقاط' : 'Minimum Points to Redeem'}
        </h3>
        <p className="text-xs text-muted-foreground">
          {lang === 'ar' ? 'حدد أقل عدد نقاط يجب أن يجمعها العميل' : 'Set the minimum points required'}
        </p>
        <div className="flex items-center gap-3">
          <Input type="number" value={minRedeemPoints} onChange={e => setMinRedeemPoints(Number(e.target.value))} className="w-24 sm:w-32" />
          <span className="text-sm text-muted-foreground">{lang === 'ar' ? 'نقطة' : 'points'}</span>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-4">
        <p className="text-xs sm:text-sm text-muted-foreground">
          {lang === 'ar'
            ? 'حدد عدد النقاط لكل مبلغ في كل قسم'
            : 'Set points per spend in each category'}
        </p>

        {rules.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">{lang === 'ar' ? 'لا توجد قواعد بعد' : 'No rules yet'}</p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="block sm:hidden space-y-2">
              {rules.map(rule => (
                <div key={rule.id} className="bg-background/80 rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">{lang === 'ar' ? rule.category : rule.category_en}</span>
                    {rule.category_en === 'Medicine' && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">💊</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'كل مبلغ (ج.م)' : 'Per (EGP)'}</label>
                      <Input type="number" value={rule.spend_amount} onChange={e => updateRule(rule.id, 'spend_amount', Number(e.target.value))} className="h-8 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'النقاط' : 'Points'}</label>
                      <Input type="number" value={rule.points_earned} onChange={e => updateRule(rule.id, 'points_earned', Number(e.target.value))} className="h-8 text-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'القسم' : 'Category'}</th>
                    <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'كل مبلغ (ج.م)' : 'Per Amount (EGP)'}</th>
                    <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'النقاط المكتسبة' : 'Points Earned'}</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map(rule => (
                    <tr key={rule.id} className="border-b border-border/50">
                      <td className="p-3 text-foreground font-semibold">
                        {lang === 'ar' ? rule.category : rule.category_en}
                        {rule.category_en === 'Medicine' && <span className="ms-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">💊</span>}
                      </td>
                      <td className="p-3">
                        <Input type="number" value={rule.spend_amount} onChange={e => updateRule(rule.id, 'spend_amount', Number(e.target.value))} className="w-24" />
                      </td>
                      <td className="p-3">
                        <Input type="number" value={rule.points_earned} onChange={e => updateRule(rule.id, 'points_earned', Number(e.target.value))} className="w-24" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminLoyalty;