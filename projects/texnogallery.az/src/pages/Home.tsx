import Hero from '../components/sections/Hero';
import BrandLogos from '../components/sections/BrandLogos';
import ProductList from '../components/sections/ProductList';
import Sidebar from '../components/layout/Sidebar';

function Home() {
  const newProducts = [
    { name: "iPhone 17 Pro Max, 256 GB, Cosmic Orange", description: "Ən son model, güclü prosessor və mükəmməl kamera.", price: "3499 ₼", imageUrl: "https://via.placeholder.com/150/FF0000/FFFFFF?text=iPhone", badge: 'new' },
    { name: "ASUS ROG Strix G16 G614JV-N4525 90NROC61-M016L0", description: "Oyun həvəskarları üçün ideal performans.", price: "2599 ₼", oldPrice: "3099 ₼", imageUrl: "https://via.placeholder.com/150/0000FF/FFFFFF?text=ASUS", badge: '-500 ₼' },
    { name: "Lenovo Legion Pro 5 16IRX9 83DF009KRK", description: "Yüksək kadr sürəti və rəvan oyun təcrübəsi.", price: "2649 ₼", oldPrice: "2799 ₼", imageUrl: "https://via.placeholder.com/150/FFFF00/000000?text=Lenovo", badge: '-150 ₼' },
    { name: "Asus TUF Gaming F17 FX707ZM-RS74 90NR09G1-", description: "Dözümlü gövdə və güclü soyutma sistemi.", price: "1799 ₼", imageUrl: "https://via.placeholder.com/150/00FF00/FFFFFF?text=TUF", badge: 'new' },
    { name: "ASUS ROG Zephyrus G16 OLED GU605CR-QR224...", description: "Ultra-nazik dizayn və heyrətamiz OLED ekran.", price: "5795 ₼", imageUrl: "https://via.placeholder.com/150/800080/FFFFFF?text=Zephyrus", badge: 'new' },
    { name: "HP Probook 460 G11 A38BGET", description: "Ofis işləri üçün sərfəli və etibarlı noutbuk.", price: "1749 ₼", oldPrice: "2199 ₼", imageUrl: "https://via.placeholder.com/150/FFA500/FFFFFF?text=HP", badge: '-450 ₼' },
  ];

  const popularOffers = [
    { name: "Gaming PC", description: "Bütün müasir oyunları yüksək qrafikada oynayın.", price: "2649 ₼", oldPrice: "3049 ₼", imageUrl: "https://via.placeholder.com/150/800080/FFFFFF?text=PC", badge: '-300 ₼' },
    { name: "Acer Nitro 5", description: "Büdcə dostu, güclü qrafik kartı ilə.", price: "1200 ₼", oldPrice: "1950 ₼", imageUrl: "https://via.placeholder.com/150/FFC0CB/000000?text=Laptop", badge: '-750 ₼' },
    { name: "Smartwatch Pro", description: "Sağlamlığınızı izləyin, gününüzü idarə edin.", price: "300 ₼", oldPrice: "460 ₼", imageUrl: "https://via.placeholder.com/150/00FFFF/000000?text=Watch", badge: '-160 ₼' },
  ];

  return (
    <div className="main-content">
      <Sidebar />
      <div className="content-area">
        <Hero />
        <BrandLogos />
        <ProductList title="Yeni Məhsullar" products={newProducts} />
        <ProductList title="Populyar Təkliflər" products={popularOffers} />
      </div>
    </div>
  );
}

export default Home;
