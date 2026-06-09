import { useParams } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { categoriesData } from '../components/layout/Sidebar';
import { slugify } from '../utils/slugify';
import type { BreadcrumbItem } from '../components/common/Breadcrumb';
import Breadcrumb from '../components/common/Breadcrumb';

// Məhsul adının sonundakı kodları silən və şəkildəki kimi yalnız yığcam modeli saxlayan funksiya
const cleanProductName = (name: string): string => {
  let shortName = name.split(',')[0]; // Vergül varsa, sonrasını silir

  // Brend və seriya adlarını (Lenovo, Legion, Asus, ROG və s.) təmizləyirik ki, geriyə yalnız model qalsın
  shortName = shortName.replace(/\b(lenovo|legion|asus|rog|strix|tuf|gaming|hp|probook|acer|nitro|msi|titan|raider|scar)\b/gi, '');

  // Spesifik istehsal kodlarını və seriya nömrələrini (Məs: 16IRX9, G614JV, 83DF009KRK) silirik
  shortName = shortName.replace(/\b[A-Z0-9]{4,12}-[A-Z0-9]{4,12}\b/g, ''); 
  shortName = shortName.replace(/\b[A-Z0-9]{5,15}\b/gi, ''); 

  // Artıq qalan boşluqları təmizləyirik
  let finalName = shortName.replace(/\s+/g, ' ').trim();

  // Əgər təmizləmədən sonra hər şey silinibsə, fallback olaraq adın ilk 3 sözünü saxlayırıq
  if (!finalName) {
    finalName = name.split(' ').slice(0, 3).join(' ');
  }

  return finalName;
};

// Məhsul adına əsasən aid olduğu ana və alt kateqoriyaları tapan funksiya
const findCategoryByProductName = (productName: string) => {
  const lowerName = productName.toLowerCase();
  
  for (const cat of categoriesData) {
    for (const sub of cat.subCategories) {
      const cleanSub = sub.toLowerCase().replace('ları', '').replace('ləri', '');
      const cleanCat = cat.name.toLowerCase().replace('lar', '').replace('lər', '');
      
      if (lowerName.includes(cleanSub) || lowerName.includes(cleanCat)) {
        return {
          categoryName: cat.name,
          categorySlug: slugify(cat.name),
          subCategoryName: sub,
          subCategorySlug: slugify(sub)
        };
      }
    }
  }

  if (lowerName.includes('iphone') || lowerName.includes('samsung') || lowerName.includes('xiaomi') || lowerName.includes('pixel')) {
    return { 
      categoryName: 'Smartfonlar', 
      categorySlug: 'smartfonlar', 
      subCategoryName: lowerName.includes('iphone') ? 'Apple' : 'Smartfonlar', 
      subCategorySlug: lowerName.includes('iphone') ? 'apple' : 'smartfonlar' 
    };
  }

  return { categoryName: '', categorySlug: '', subCategoryName: '', subCategorySlug: '' };
};

function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const productName = id ? decodeURIComponent(id) : 'Məhsul Detalları';
  const { addToCart, toggleWishlist, isInWishlist } = useShop();

  // Kateqoriya məlumatlarını analiz edirik
  const detectedPath = findCategoryByProductName(productName);

  // Naviqasiya zəncirinin başladılması
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Əsas Səhifə', url: '/' }
  ];

  // 1. İSTƏDİYİNİZ DÜZƏLİŞ: Model adından əvvəl Main və Sub kateqoriyanı "Super İtem" olaraq daxil edirik
  if (detectedPath.categoryName && detectedPath.subCategoryName) {
    const formattedSubName = detectedPath.subCategoryName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    breadcrumbItems.push({
      label: `${detectedPath.categoryName} / ${formattedSubName}`,
      url: `/kataloq/${detectedPath.categorySlug}/${detectedPath.subCategorySlug}` // Kateqoriyaya geri qayıtmaq üçün link
    });
  } 
  else if (detectedPath.categoryName) {
    breadcrumbItems.push({
      label: detectedPath.categoryName,
      url: `/kataloq/${detectedPath.categorySlug}`
    });
  }

  // 2. ŞƏKİLDƏKİ YIĞCAM MODEL ADI: Ən sona linksiz element olaraq modelin qısaldılmış adını daxil edirik
  const modelShortName = cleanProductName(productName);
  breadcrumbItems.push({
    label: modelShortName // Məsələn: "Pro 5"
  });

  // Mock qiymət və şəkil məlumatları
  const productPrice = "1500 ₼";
  const productImageUrl = `https://via.placeholder.com/400/EEEEEE/000000?text=${encodeURIComponent(modelShortName)}`;

  const handleAddToCart = () => {
    addToCart({ name: productName, price: productPrice, imageUrl: productImageUrl });
    alert('Məhsul səbətə əlavə edildi!');
  };

  const handleToggleWishlist = () => {
    toggleWishlist({ name: productName, price: productPrice, imageUrl: productImageUrl });
  };

  const isLiked = isInWishlist(productName);

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Tam inteqrasiya olunmuş yeni naviqasiya zənciri */}
      <Breadcrumb items={breadcrumbItems} />

      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', textAlign: 'left' }}>
        {/* Səhifə daxilində tam texniki ad görünür */}
        <h2>{productName}</h2>
        
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          {/* Product Image */}
          <div style={{ flex: '1 1 400px', backgroundColor: '#f9f9f9', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', border: '1px solid #eee' }}>
            <img 
              src={productImageUrl} 
              alt={productName} 
              style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} 
            />
          </div>

          {/* Product Info */}
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              Qiymət: {productPrice}
            </div>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              Bu məhsul haqqında ətraflı məlumat burada yerləşəcək. Məhsulun xüsusiyyətləri, texniki göstəriciləri və istifadə qaydaları barədə geniş təsvir bu hissədə olacaq.
            </p>
            
            <ul style={{ paddingLeft: '20px', color: '#444', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><strong>Brend:</strong> TexnoBrand</li>
              <li><strong>Zəmanət:</strong> 1 İl</li>
              <li><strong>Vəziyyət:</strong> Yeni</li>
              <li><strong>Çatdırılma:</strong> 24 saat ərzində</li>
            </ul>

            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button onClick={handleAddToCart} style={{ padding: '12px 24px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}>
                Səbətə At
              </button>
              <button onClick={handleToggleWishlist} style={{ padding: '12px 24px', backgroundColor: isLiked ? '#fce7f3' : 'transparent', color: isLiked ? '#db2777' : 'var(--primary-color)', border: `2px solid ${isLiked ? '#db2777' : 'var(--primary-color)'}`, borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <span>{isLiked ? '❤️' : '🤍'}</span> {isLiked ? 'Seçilmişlərdən Çıxar' : 'Seçilmişlərə Əlavə Et'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;