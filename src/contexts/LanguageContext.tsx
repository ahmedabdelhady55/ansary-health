import React, { createContext, useContext, useState, useCallback } from 'react';

type Language = 'ar' | 'en';

interface Translations {
  [key: string]: { ar: string; en: string };
}

const translations: Translations = {
  pharmacyName: { ar: 'صيدلية الأنصار', en: 'Al-Ansar Pharmacy' },
  signUp: { ar: 'إنشاء حساب', en: 'Sign Up' },
  logIn: { ar: 'تسجيل دخول', en: 'Log In' },
  logOut: { ar: 'تسجيل خروج', en: 'Log Out' },
  name: { ar: 'الاسم', en: 'Name' },
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  phone: { ar: 'رقم الموبايل', en: 'Phone Number' },
  password: { ar: 'الرقم السري', en: 'Password' },
  confirmPassword: { ar: 'تأكيد الرقم السري', en: 'Confirm Password' },
  address: { ar: 'العنوان التفصيلي', en: 'Detailed Address' },
  createAccount: { ar: 'إنشاء حساب', en: 'Create Account' },
  login: { ar: 'تسجيل الدخول', en: 'Log In' },
  forgotPassword: { ar: 'نسيت الرقم السري؟', en: 'Forgot Password?' },
  resetPassword: { ar: 'استعادة الرقم السري', en: 'Reset Password' },
  sendReset: { ar: 'إرسال', en: 'Send' },
  categories: { ar: 'أقسام الصيدلية', en: 'Pharmacy Categories' },
  findMedicine: { ar: 'علاجك عندنا', en: 'Find Your Medicine' },
  healthTip: { ar: 'نصيحة اليوم', en: 'Health Tip of the Day' },
  contactUs: { ar: 'تواصل معنا', en: 'Contact Us' },
  followUs: { ar: 'تابعنا', en: 'Follow Us' },
  ourAddress: { ar: 'عنواننا', en: 'Our Address' },
  allRights: { ar: 'جميع الحقوق محفوظة', en: 'All Rights Reserved' },
  profile: { ar: 'الصفحة الشخصية', en: 'Profile' },
  welcomeTitle: { ar: 'مرحباً بك في صيدلية الأنصار', en: 'Welcome to Al-Ansar Pharmacy' },
  welcomeSubtitle: { ar: 'صحتك أمانة عندنا', en: 'Your Health is Our Trust' },
  guestMessage: { ar: 'سجّل حساب جديد للوصول لجميع خدماتنا', en: 'Create an account to access all our services' },
  adBanner: { ar: 'عروض خاصة', en: 'Special Offers' },
  typeMessage: { ar: 'اكتب رسالتك...', en: 'Type your message...' },
  uploadPrescription: { ar: 'ارفع صورة الروشتة', en: 'Upload Prescription' },
  send: { ar: 'إرسال', en: 'Send' },
  chatWelcome: { ar: 'مرحباً! اكتب اسم الدواء أو ارفع صورة الروشتة وهنرد عليك', en: 'Hello! Type the medicine name or upload a prescription and we will respond' },
  back: { ar: 'رجوع', en: 'Back' },
  loyaltyPoints: { ar: 'نقاط الولاء', en: 'Loyalty Points' },
  price: { ar: 'السعر', en: 'Price' },
  egp: { ar: 'ج.م', en: 'EGP' },
};

interface LanguageContextType {
  lang: Language;
  toggleLang: () => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ar',
  toggleLang: () => {},
  t: (key: string) => key,
  dir: 'rtl',
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('ar');

  const toggleLang = useCallback(() => {
    setLang(prev => prev === 'ar' ? 'en' : 'ar');
  }, []);

  const t = useCallback((key: string) => {
    return translations[key]?.[lang] || key;
  }, [lang]);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};
