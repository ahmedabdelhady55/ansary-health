import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Package, Upload } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  name_en: string;
}

const AdminCategories = () => {
  const { lang } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [productForm, setProductForm] = useState({
    name: '', name_en: '', description: '', description_en: '',
    price: 0, discount: 0, discount_type: 'percentage', image: '📦', available: true,
  });

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { if (selectedCat) fetchProducts(selectedCat); }, [selectedCat]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name, name_en').order('sort_order');
    if (data) setCategories(data as Category[]);
  };

  const fetchProducts = async (catId: string) => {
    const { data } = await supabase.from('products').select('*').eq('category_id', catId);
    if (data) setProducts(data as Product[]);
  };

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    const { error } = await supabase.from('categories').insert({ name: newCatName, name_en: newCatNameEn || newCatName });
    if (error) { toast({ title: error.message, variant: 'destructive' }); return; }
    setNewCatName(''); setNewCatNameEn(''); setShowAddCat(false);
    fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    if (selectedCat === id) { setSelectedCat(null); setProducts([]); }
    fetchCategories();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `product-${Date.now()}.${fileExt}`;
    // Use the public banner-images bucket (admin-only upload) for product images.
    const { error: uploadError } = await supabase.storage.from('banner-images').upload(fileName, file);
    if (uploadError) {
      toast({ title: uploadError.message, variant: 'destructive' });
      setUploadingImage(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('banner-images').getPublicUrl(fileName);
    setProductForm({ ...productForm, image: urlData.publicUrl });
    setUploadingImage(false);
  };

  const addProduct = async () => {
    if (!selectedCat || !productForm.name.trim()) return;
    const { error } = await supabase.from('products').insert({ ...productForm, category_id: selectedCat } as any);
    if (error) { toast({ title: error.message, variant: 'destructive' }); return; }
    resetProductForm();
    fetchProducts(selectedCat);
  };

  const updateProduct = async () => {
    if (!editingProduct) return;
    const { error } = await supabase.from('products').update(productForm as any).eq('id', editingProduct.id);
    if (error) { toast({ title: error.message, variant: 'destructive' }); return; }
    setEditingProduct(null); resetProductForm();
    if (selectedCat) fetchProducts(selectedCat);
  };

  const deleteProduct = async (productId: string) => {
    await supabase.from('products').delete().eq('id', productId);
    if (selectedCat) fetchProducts(selectedCat);
  };

  const toggleAvailability = async (productId: string, current: boolean) => {
    await supabase.from('products').update({ available: !current }).eq('id', productId);
    if (selectedCat) fetchProducts(selectedCat);
  };

  const resetProductForm = () => {
    setProductForm({ name: '', name_en: '', description: '', description_en: '', price: 0, discount: 0, discount_type: 'percentage', image: '📦', available: true });
    setShowAddProduct(false);
    setEditingProduct(null);
  };

  const calcFinalPrice = (price: number, discount: number, discountType: string) => {
    if (discount <= 0) return price;
    if (discountType === 'fixed') return Math.max(0, price - discount);
    return Math.max(0, price - (price * discount / 100));
  };

  const selectedCategory = categories.find(c => c.id === selectedCat);
  const filteredProducts = products.filter(p =>
    p.name.includes(searchTerm) || p.name_en.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isImageUrl = (img: string) => img.startsWith('http');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
          {lang === 'ar' ? 'إدارة الأقسام والمنتجات' : 'Categories & Products'}
        </h2>
        <Button onClick={() => setShowAddCat(true)} className="gap-2" size="sm">
          <Plus size={16} />
          {lang === 'ar' ? 'قسم جديد' : 'New Category'}
        </Button>
      </div>

      {showAddCat && (
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4 space-y-3">
          <h3 className="font-heading font-bold text-foreground text-sm">{lang === 'ar' ? 'إضافة قسم جديد' : 'Add New Category'}</h3>
          <Input placeholder={lang === 'ar' ? 'اسم القسم بالعربي' : 'Category name (Arabic)'} value={newCatName} onChange={e => setNewCatName(e.target.value)} />
          <Input placeholder={lang === 'ar' ? 'اسم القسم بالإنجليزي' : 'Category name (English)'} value={newCatNameEn} onChange={e => setNewCatNameEn(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={addCategory} size="sm">{lang === 'ar' ? 'إضافة' : 'Add'}</Button>
            <Button onClick={() => setShowAddCat(false)} variant="outline" size="sm">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {categories.map(cat => (
          <div key={cat.id} className={`relative group bg-card rounded-xl border p-3 sm:p-4 cursor-pointer transition-all hover:shadow-md ${selectedCat === cat.id ? 'border-primary shadow-md' : 'border-border'}`} onClick={() => setSelectedCat(cat.id)}>
            <Package size={20} className="text-primary mb-1 sm:mb-2 sm:w-6 sm:h-6" />
            <p className="font-heading font-bold text-foreground text-xs sm:text-sm">{lang === 'ar' ? cat.name : cat.name_en}</p>
            <button onClick={e => { e.stopPropagation(); deleteCategory(cat.id); }} className="absolute top-2 end-2 p-1 rounded bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      {selectedCategory && (
        <div className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-heading font-bold text-foreground text-base sm:text-lg">{lang === 'ar' ? selectedCategory.name : selectedCategory.name_en}</h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <Input placeholder={lang === 'ar' ? 'بحث...' : 'Search...'} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 sm:w-40" />
              <Button onClick={() => { setEditingProduct(null); setProductForm({ name: '', name_en: '', description: '', description_en: '', price: 0, discount: 0, discount_type: 'percentage', image: '📦', available: true }); setShowAddProduct(true); }} size="sm" className="gap-1 shrink-0">
                <Plus size={14} /><span className="hidden sm:inline">{lang === 'ar' ? 'منتج جديد' : 'New Product'}</span><span className="sm:hidden">{lang === 'ar' ? 'جديد' : 'New'}</span>
              </Button>
            </div>
          </div>

          {(showAddProduct || editingProduct) && (
            <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-3 border border-border">
              <h4 className="font-heading font-semibold text-foreground text-sm">
                {editingProduct ? (lang === 'ar' ? 'تعديل المنتج' : 'Edit Product') : (lang === 'ar' ? 'إضافة منتج' : 'Add Product')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <Input placeholder={lang === 'ar' ? 'اسم المنتج بالعربي' : 'Product name (AR)'} value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                <Input placeholder={lang === 'ar' ? 'اسم المنتج بالإنجليزي' : 'Product name (EN)'} value={productForm.name_en} onChange={e => setProductForm({...productForm, name_en: e.target.value})} />
                <Input placeholder={lang === 'ar' ? 'وصف بالعربي' : 'Description (AR)'} value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                <Input placeholder={lang === 'ar' ? 'وصف بالإنجليزي' : 'Description (EN)'} value={productForm.description_en} onChange={e => setProductForm({...productForm, description_en: e.target.value})} />
                <Input type="number" placeholder={lang === 'ar' ? 'السعر' : 'Price'} value={productForm.price || ''} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} />
                <div className="flex gap-2">
                  <Input type="number" placeholder={lang === 'ar' ? 'الخصم' : 'Discount'} value={productForm.discount || ''} onChange={e => setProductForm({...productForm, discount: Number(e.target.value)})} className="flex-1" />
                  <select value={productForm.discount_type} onChange={e => setProductForm({...productForm, discount_type: e.target.value})} className="rounded-md border border-input bg-background px-2 py-1 text-sm w-20">
                    <option value="percentage">%</option>
                    <option value="fixed">{lang === 'ar' ? 'ج.م' : 'EGP'}</option>
                  </select>
                </div>
              </div>

              {productForm.price > 0 && productForm.discount > 0 && (
                <div className="bg-primary/10 rounded-lg px-3 py-2 text-xs sm:text-sm">
                  <span className="text-muted-foreground">{lang === 'ar' ? 'السعر بعد الخصم: ' : 'After discount: '}</span>
                  <span className="font-bold text-primary">{calcFinalPrice(productForm.price, productForm.discount, productForm.discount_type).toFixed(2)} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-semibold text-foreground">{lang === 'ar' ? 'صورة المنتج' : 'Product Image'}</label>
                <div className="flex items-center gap-3">
                  {isImageUrl(productForm.image) ? (
                    <img src={productForm.image} alt="product" className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover border border-border" />
                  ) : (
                    <span className="text-2xl sm:text-3xl">{productForm.image}</span>
                  )}
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-foreground text-xs sm:text-sm cursor-pointer hover:bg-muted/80 transition-colors border border-border">
                    <Upload size={14} />
                    {uploadingImage ? (lang === 'ar' ? 'جاري...' : 'Uploading...') : (lang === 'ar' ? 'رفع صورة' : 'Upload')}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={editingProduct ? updateProduct : addProduct}>
                  {editingProduct ? (lang === 'ar' ? 'تحديث' : 'Update') : (lang === 'ar' ? 'إضافة' : 'Add')}
                </Button>
                <Button size="sm" variant="outline" onClick={resetProductForm}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
              </div>
            </div>
          )}

          {/* Mobile product cards */}
          <div className="block sm:hidden space-y-2">
            {filteredProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">{lang === 'ar' ? 'لا توجد منتجات' : 'No products found'}</p>
            ) : filteredProducts.map(product => {
              const finalPrice = calcFinalPrice(product.price, product.discount, product.discount_type || 'percentage');
              return (
                <div key={product.id} className="bg-background/80 rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {isImageUrl(product.image) ? (
                      <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <span className="text-xl">{product.image}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{lang === 'ar' ? product.name : product.name_en}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{lang === 'ar' ? product.description : product.description_en}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-foreground font-semibold">{product.price} ج.م</span>
                      {product.discount > 0 && (
                        <>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-primary font-bold">{finalPrice.toFixed(2)} ج.م</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleAvailability(product.id, product.available)} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${product.available ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                        {product.available ? (lang === 'ar' ? 'متوفر' : 'Available') : (lang === 'ar' ? 'غير متوفر' : 'Out')}
                      </button>
                      <button onClick={() => {
                        setEditingProduct(product);
                        setProductForm({
                          name: product.name, name_en: product.name_en,
                          description: product.description, description_en: product.description_en,
                          price: product.price, discount: product.discount,
                          discount_type: product.discount_type || 'percentage',
                          image: product.image, available: product.available,
                        });
                        setShowAddProduct(false);
                      }} className="p-1 rounded bg-primary/10 text-primary">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => deleteProduct(product.id)} className="p-1 rounded bg-destructive/10 text-destructive">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'المنتج' : 'Product'}</th>
                  <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'السعر' : 'Price'}</th>
                  <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'خصم' : 'Discount'}</th>
                  <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'بعد الخصم' : 'Final'}</th>
                  <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="text-start p-3 font-heading text-muted-foreground">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const finalPrice = calcFinalPrice(product.price, product.discount, product.discount_type || 'percentage');
                  return (
                    <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {isImageUrl(product.image) ? (
                            <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <span className="text-xl">{product.image}</span>
                          )}
                          <div>
                            <p className="font-semibold text-foreground">{lang === 'ar' ? product.name : product.name_en}</p>
                            <p className="text-xs text-muted-foreground">{lang === 'ar' ? product.description : product.description_en}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-foreground font-semibold">{product.price} ج.م</td>
                      <td className="p-3 text-foreground">
                        {product.discount > 0
                          ? (product.discount_type === 'fixed' ? `${product.discount} ج.م` : `${product.discount}%`)
                          : '-'}
                      </td>
                      <td className="p-3 text-primary font-bold">{finalPrice.toFixed(2)} ج.م</td>
                      <td className="p-3">
                        <button onClick={() => toggleAvailability(product.id, product.available)} className={`text-xs px-2 py-1 rounded-full font-semibold cursor-pointer ${product.available ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                          {product.available ? (lang === 'ar' ? 'متوفر' : 'Available') : (lang === 'ar' ? 'غير متوفر' : 'Out of Stock')}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button onClick={() => {
                            setEditingProduct(product);
                            setProductForm({
                              name: product.name, name_en: product.name_en,
                              description: product.description, description_en: product.description_en,
                              price: product.price, discount: product.discount,
                              discount_type: product.discount_type || 'percentage',
                              image: product.image, available: product.available,
                            });
                            setShowAddProduct(false);
                          }} className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deleteProduct(product.id)} className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">{lang === 'ar' ? 'لا توجد منتجات' : 'No products found'}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;