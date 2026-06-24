import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import pharmacyLogo from "@/assets/pharmacy-logo.jpeg";
import pharmacyBg from "@/assets/pharmacy-bg.jpg";

const NotFound = () => {
  const location = useLocation();
  const { lang, dir } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div dir={dir} className="min-h-screen relative font-body">
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${pharmacyBg})` }} />
      <div className="fixed inset-0 z-0 bg-overlay" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 text-center animate-fade-in">
          <img src={pharmacyLogo} alt="Logo" className="w-16 h-16 rounded-full object-cover border-2 border-primary mx-auto" />
          <h1 className="text-5xl font-heading font-extrabold text-primary mt-4">404</h1>
          <p className="text-muted-foreground mt-2 mb-6">
            {lang === 'ar' ? 'عذراً، الصفحة المطلوبة غير موجودة' : 'Sorry, the page you are looking for does not exist.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-heading font-bold text-sm hover:opacity-90 transition-opacity"
          >
            <Home size={16} />
            {lang === 'ar' ? 'العودة للرئيسية' : 'Return Home'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
