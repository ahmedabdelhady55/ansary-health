import { useState } from 'react';
import NotificationListener from '@/components/NotificationListener';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import pharmacyLogo from '@/assets/pharmacy-logo.jpeg';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminCategories from '@/components/admin/AdminCategories';
import AdminOrders from '@/components/admin/AdminOrders';
import AdminMessages from '@/components/admin/AdminMessages';
import AdminCustomers from '@/components/admin/AdminCustomers';
import AdminLoyalty from '@/components/admin/AdminLoyalty';
import AdminEmployees from '@/components/admin/AdminEmployees';
import AdminNotifications from '@/components/admin/AdminNotifications';
import AdminContent from '@/components/admin/AdminContent';
import AdminSettings from '@/components/admin/AdminSettings';

const Admin = () => {
  const { dir, lang } = useLanguage();
  const { loading, isLoggedIn, isEmployee } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <AdminDashboard onNavigate={setActiveSection} />;
      case 'categories': return <AdminCategories />;
      case 'orders': return <AdminOrders />;
      case 'messages': return <AdminMessages />;
      case 'customers': return <AdminCustomers />;
      case 'loyalty': return <AdminLoyalty />;
      case 'employees': return <AdminEmployees />;
      case 'notifications': return <AdminNotifications />;
      case 'content': return <AdminContent />;
      case 'settings': return <AdminSettings />;
      default: return <AdminDashboard onNavigate={setActiveSection} />;
    }
  };

  if (loading) {
    return (
      <div dir={dir} className="min-h-screen bg-background font-body flex items-center justify-center px-4">
        <div className="rounded-2xl border border-border bg-card px-6 py-5 text-center text-sm text-muted-foreground">
          {lang === 'ar' ? 'جاري التحقق من صلاحيات لوحة التحكم...' : 'Checking admin access...'}
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isEmployee) {
    return (
      <div dir={dir} className="min-h-screen bg-background font-body flex items-center justify-center px-4">
        <div className="max-w-lg rounded-3xl border border-border bg-card p-6 text-center shadow-sm space-y-3">
          <img src={pharmacyLogo} alt="Pharmacy logo" className="mx-auto h-16 w-16 rounded-full object-cover border border-primary" />
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {lang === 'ar' ? 'الدخول للوحة التحكم مقيد' : 'Admin access required'}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {lang === 'ar'
              ? 'سجّل الدخول أولاً بحسابك. أول مستخدم يسجّل دخوله سيتم تفعيله كأدمن تلقائياً.'
              : 'Sign in first. The first authenticated user is automatically promoted to admin.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-screen bg-background font-body">
      <NotificationListener />
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-12 sm:h-14 flex items-center border-b border-border bg-card px-3 sm:px-4 gap-2 sm:gap-3">
              <SidebarTrigger />
              <img src={pharmacyLogo} alt="Logo" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-primary" />
              <h1 className="font-heading font-bold text-foreground text-sm sm:text-base truncate">
                {lang === 'ar' ? 'لوحة تحكم صيدلية الأنصار' : 'Al-Ansar Pharmacy Admin'}
              </h1>
            </header>

            <main className="flex-1 p-2 sm:p-3 md:p-6 overflow-auto">
              {renderSection()}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Admin;