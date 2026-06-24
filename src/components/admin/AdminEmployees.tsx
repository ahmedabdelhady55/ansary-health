import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  permissions: string[];
}

const allPermissions = [
  { id: 'orders', ar: 'إدارة الطلبات', en: 'Manage Orders' },
  { id: 'categories', ar: 'إدارة الأقسام', en: 'Manage Categories' },
  { id: 'customers', ar: 'إدارة العملاء', en: 'Manage Customers' },
  { id: 'chat', ar: 'الرد على الشات', en: 'Chat Response' },
  { id: 'notifications', ar: 'الإشعارات', en: 'Notifications' },
  { id: 'content', ar: 'المحتوى', en: 'Content' },
  { id: 'loyalty', ar: 'نقاط الولاء', en: 'Loyalty Points' },
  { id: 'employees', ar: 'إدارة الموظفين', en: 'Manage Employees' },
  { id: 'settings', ar: 'الإعدادات', en: 'Settings' },
];

const AdminEmployees = () => {
  const { lang } = useLanguage();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: '', password: '', permissions: [] as string[] });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees_public').select('*');
    if (data) setEmployees(data as Employee[]);
  };

  const addEmployee = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.password.trim()) return;
    const { error } = await supabase.from('employees').insert({
      name: form.name,
      phone: form.phone,
      email: form.email,
      role: form.role,
      password_hash: form.password, // In production, hash this
      permissions: form.permissions,
    });
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
    } else {
      toast({ title: lang === 'ar' ? 'تم إضافة الموظف' : 'Employee added' });
      setForm({ name: '', phone: '', email: '', role: '', password: '', permissions: [] });
      setShowAdd(false);
      fetchEmployees();
    }
  };

  const deleteEmployee = async (id: string) => {
    await supabase.from('employees').delete().eq('id', id);
    fetchEmployees();
  };

  const togglePermission = (perm: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const filtered = employees.filter(e =>
    e.name.includes(searchTerm) || e.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
          {lang === 'ar' ? 'إدارة الموظفين' : 'Employee Management'}
        </h2>
        <Button onClick={() => setShowAdd(true)} size="sm" className="gap-2">
          <Plus size={16} />
          {lang === 'ar' ? 'موظف جديد' : 'New Employee'}
        </Button>
      </div>

      <Input
        placeholder={lang === 'ar' ? 'بحث...' : 'Search...'}
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full sm:max-w-sm"
      />

      {showAdd && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h3 className="font-heading font-bold text-foreground">{lang === 'ar' ? 'إضافة موظف' : 'Add Employee'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder={lang === 'ar' ? 'الاسم' : 'Name'} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <Input placeholder={lang === 'ar' ? 'الموبايل' : 'Phone'} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            <Input placeholder={lang === 'ar' ? 'الإيميل' : 'Email'} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            <Input placeholder={lang === 'ar' ? 'الوظيفة' : 'Role'} value={form.role} onChange={e => setForm({...form, role: e.target.value})} />
            <Input type="password" placeholder={lang === 'ar' ? 'كلمة السر' : 'Password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">{lang === 'ar' ? 'الصلاحيات:' : 'Permissions:'}</p>
            <div className="flex flex-wrap gap-2">
              {allPermissions.map(p => (
                <label key={p.id} className="flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded-lg cursor-pointer">
                  <input type="checkbox" checked={form.permissions.includes(p.id)} onChange={() => togglePermission(p.id)} />
                  {lang === 'ar' ? p.ar : p.en}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addEmployee}>{lang === 'ar' ? 'إضافة' : 'Add'}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
          </div>
        </div>
      )}

      {/* Mobile cards */}
      <div className="block md:hidden space-y-3">
        {filtered.map(emp => (
          <div key={emp.id} className="bg-card rounded-xl border border-border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{emp.name}</span>
              <button onClick={() => deleteEmployee(emp.id)} className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20">
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">{emp.role} · {emp.phone}</p>
            <div className="flex flex-wrap gap-1">
              {emp.permissions?.map(p => (
                <span key={p} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {allPermissions.find(ap => ap.id === p)?.[lang === 'ar' ? 'ar' : 'en']}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'الاسم' : 'Name'}</th>
              <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'الوظيفة' : 'Role'}</th>
              <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'الموبايل' : 'Phone'}</th>
              <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'الصلاحيات' : 'Permissions'}</th>
              <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => (
              <tr key={emp.id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="p-3 text-foreground font-semibold">{emp.name}</td>
                <td className="p-3 text-muted-foreground">{emp.role}</td>
                <td className="p-3 text-foreground">{emp.phone}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {emp.permissions?.map(p => (
                      <span key={p} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {allPermissions.find(ap => ap.id === p)?.[lang === 'ar' ? 'ar' : 'en']}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <button onClick={() => deleteEmployee(emp.id)} className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminEmployees;
