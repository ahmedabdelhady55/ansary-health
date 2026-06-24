import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Package, Users, Award, UserCog, Bell, 
  Settings, FileText, ShoppingCart, Home, MessageCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

interface Props {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const STORAGE_KEY = 'admin_messages_last_seen';

const AdminSidebar = ({ activeSection, onSectionChange }: Props) => {
  const { t, lang } = useLanguage();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const [unreadCount, setUnreadCount] = useState(0);

  const getLastSeen = () => {
    return localStorage.getItem(STORAGE_KEY) || '1970-01-01T00:00:00Z';
  };

  const computeUnread = async () => {
    const lastSeen = getLastSeen();
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('conversation_id, created_at, sender_type')
      .eq('sender_type', 'user')
      .gt('created_at', lastSeen);
    if (error || !data) return;
    const distinct = new Set(data.map((m: any) => m.conversation_id));
    setUnreadCount(distinct.size);
  };

  useEffect(() => {
    computeUnread();

    const channel = supabase
      .channel('admin-sidebar-unread')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversation_messages' },
        (payload: any) => {
          if (payload.new?.sender_type === 'user') {
            if (activeSection === 'messages') {
              localStorage.setItem(STORAGE_KEY, new Date().toISOString());
              setUnreadCount(0);
            } else {
              computeUnread();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  // Mark as seen when admin opens messages section
  useEffect(() => {
    if (activeSection === 'messages') {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      setUnreadCount(0);
    }
  }, [activeSection]);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: lang === 'ar' ? 'الرئيسية' : 'Dashboard' },
    { id: 'categories', icon: Package, label: lang === 'ar' ? 'الأقسام والمنتجات' : 'Categories & Products' },
    { id: 'orders', icon: ShoppingCart, label: lang === 'ar' ? 'الطلبات' : 'Orders' },
    { id: 'messages', icon: MessageCircle, label: lang === 'ar' ? 'رسائل العملاء' : 'Messages' },
    { id: 'customers', icon: Users, label: lang === 'ar' ? 'العملاء' : 'Customers' },
    { id: 'loyalty', icon: Award, label: lang === 'ar' ? 'نقاط الولاء' : 'Loyalty Points' },
    { id: 'employees', icon: UserCog, label: lang === 'ar' ? 'الموظفين' : 'Employees' },
    { id: 'notifications', icon: Bell, label: lang === 'ar' ? 'الإشعارات' : 'Notifications' },
    { id: 'content', icon: FileText, label: lang === 'ar' ? 'محتوى الصفحة الرئيسية' : 'Homepage Content' },
    { id: 'settings', icon: Settings, label: lang === 'ar' ? 'الإعدادات' : 'Settings' },
  ];

  return (
    <Sidebar collapsible="icon" side={lang === 'ar' ? 'right' : 'left'}>
      <SidebarContent>
        {/* Logo / Home Link */}
        <div className="p-4 border-b border-sidebar-border">
          <button
            onClick={() => window.open('/', '_blank')}
            className="flex items-center gap-2 text-sidebar-primary hover:opacity-80 transition-opacity"
          >
            <Home size={20} />
            {!collapsed && (
              <span className="font-heading font-bold text-sm">
                {t('pharmacyName')}
              </span>
            )}
          </button>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>
            {lang === 'ar' ? 'لوحة التحكم' : 'Admin Panel'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const showBadge = item.id === 'messages' && unreadCount > 0;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onSectionChange(item.id)}
                      isActive={activeSection === item.id}
                      tooltip={item.label}
                    >
                      <div className="relative">
                        <item.icon className="h-4 w-4" />
                        {showBadge && (
                          <span className="absolute -top-2 -end-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                      {!collapsed && (
                        <span className="flex-1 flex items-center justify-between">
                          <span>{item.label}</span>
                          {showBadge && (
                            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;
