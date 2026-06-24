import { useState, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  price: number;
  discount: number;
  discount_type: string;
  image: string;
  available: boolean;
}

interface Category {
  id: string;
  name: string;
  name_en: string;
}

interface Props {
  onBack: () => void;
}

const calcFinalPrice = (price: number, discount: number, discountType: string) => {
  if (discount <= 0) return price;
  if (discountType === 'fixed') return Math.max(0, price - discount);
  return Math.max(0, price - (price * discount / 100));
};

const isImageUrl = (img: string) => img.startsWith('http');

const CategoriesView = ({ onBack }: Props) => {
  const { t, lang } = useLanguage();
  const { addItem } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('categories').select('id, name, name_en').order('sort_order').then(({ data }) => {
      if (data) setCategories(data as Category[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      supabase.from('products').select('*').eq('category_id', selectedCategory.id).eq('available', true).then(({ data }) => {
        if (data) setProducts(data as Product[]);
      });
    }
  }, [selectedCategory]);

  const handleAddToCart = (product: Product) => {
    const finalPrice = calcFinalPrice(product.price, product.discount, product.discount_type || 'percentage');
    addItem({
      id: product.id,
      name: lang === 'ar' ? product.name : product.name_en,
      price: finalPrice,
      image: product.image,
      category: selectedCategory ? (lang === 'ar' ? selectedCategory.name : selectedCategory.name_en) : '',
    });
    toast({ title: lang === 'ar' ? `تم إضافة "${product.name}" للسلة ✅` : `"${product.name_en}" added to cart ✅` });
  };

  if (selectedCategory) {
    return (
      <div className="bg-card/90 backdrop-blur-md rounded-xl border border-border shadow-lg max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <button onClick={() => { setSelectedCategory(null); setProducts([]); }} className="p-1.5 rounded-lg bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h2 className="font-heading font-bold text-foreground">{lang === 'ar' ? selectedCategory.name : selectedCategory.name_en}</h2>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {products.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center col-span-2 py-8">{lang === 'ar' ? 'لا توجد منتجات' : 'No products'}</p>
          ) : products.map(product => {
            const finalPrice = calcFinalPrice(product.price, product.discount, product.discount_type || 'percentage');
            return (
              <div key={product.id} className="bg-background/80 rounded-lg border border-border p-3 hover:shadow-md transition-shadow">
                {isImageUrl(product.image) ? (
                  <img src={product.image} alt={product.name} className="w-full h-32 object-cover rounded-lg mb-2" />
                ) : (
                  <div className="text-3xl mb-2">{product.image}</div>
                )}
                <h3 className="font-heading font-bold text-foreground text-sm">{lang === 'ar' ? product.name : product.name_en}</h3>
                <p className="text-xs text-muted-foreground mt-1">{lang === 'ar' ? product.description : product.description_en}</p>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    {product.discount > 0 ? (
                      <>
                        <p className="text-muted-foreground line-through text-xs">{product.price} {t('egp')}</p>
                        <p className="text-primary font-bold text-sm">{finalPrice.toFixed(2)} {t('egp')}</p>
                      </>
                    ) : (
                      <p className="text-primary font-bold text-sm">{product.price} {t('egp')}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-heading font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Plus size={14} />
                    {lang === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/90 backdrop-blur-md rounded-xl border border-border shadow-lg max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={onBack} className="p-1.5 rounded-lg bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-heading font-bold text-foreground">{t('categories')}</h2>
      </div>
      <div className="p-4 space-y-2">
        {loading ? (
          <p className="text-muted-foreground text-sm text-center py-8">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        ) : categories.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">{lang === 'ar' ? 'لا توجد أقسام بعد' : 'No categories yet'}</p>
        ) : categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat)}
            className="w-full text-start px-4 py-3 rounded-lg bg-background/80 border border-border hover:border-primary hover:shadow-md transition-all font-heading font-semibold text-foreground text-sm"
          >
            {lang === 'ar' ? cat.name : cat.name_en}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoriesView;
