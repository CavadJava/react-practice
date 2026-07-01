import { useParams } from 'react-router-dom';
import ProductList from '../components/sections/ProductList';
import Sidebar, { categoriesData } from '../components/layout/Sidebar';
import { slugify } from '../utils/slugify';
import type { BreadcrumbItem } from '../components/common/Breadcrumb';
import Breadcrumb from '../components/common/Breadcrumb';

// URL slug-larını oxunaqlı adlara çevirən lüğət generatoru
const generateUrlMapping = () => {
  const mapping: { [key: string]: string } = {};
  
  categoriesData.forEach(cat => {
    mapping[slugify(cat.name)] = cat.name;
    cat.subCategories.forEach(sub => {
      mapping[slugify(sub)] = sub;
    });
  });
  
  return mapping;
};

const urlNameMapping = generateUrlMapping();

function CategoryPage() {
  const { categorySlug, subCategorySlug } = useParams<{ categorySlug: string; subCategorySlug?: string }>();

  const categoryName = urlNameMapping[categorySlug || ''] || categorySlug;
  const subCategoryName = subCategorySlug ? (urlNameMapping[subCategorySlug] || subCategorySlug) : undefined;

  // Dinamik Breadcrumb massivinin qurulması
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Əsas Səhifə', url: '/' }
  ];

  if (categorySlug && categoryName) {
    breadcrumbItems.push({ 
      label: categoryName, 
      ...(subCategorySlug ? { url: `/kataloq/${categorySlug}` } : {})
    });
  }

  if (subCategorySlug && subCategoryName) {
    // Vizual olaraq baş hərfləri böyük edirik (Məs: "Oyun noutbukları" -> "Oyun Noutbukları")
    const formattedSubName = subCategoryName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    breadcrumbItems.push({ 
      label: formattedSubName 
    });
  }

  // Nümunə məhsul datası (Gələcəkdə bura API-dan məlumat çəkiləcək)
  const placeholderProducts = [
    { name: "ASUS ROG Strix G16", description: "Oyun həvəskarları üçün ideal performans.", price: "2599 ₼", imageUrl: "https://via.placeholder.com/150" },
    { name: "Lenovo Legion Pro 5", description: "Yüksək kadr sürəti və rəvan oyun təcrübəsi.", price: "2649 ₼", imageUrl: "https://via.placeholder.com/150" }
  ];

  return (
    <div className="main-content">
      <Sidebar />
      <div className="content-area">
        <Breadcrumb items={breadcrumbItems} />
        <ProductList 
          title={subCategoryName ? subCategoryName.charAt(0).toUpperCase() + subCategoryName.slice(1) : categoryName || ''} 
          products={placeholderProducts} 
        />
      </div>
    </div>
  );
}

export default CategoryPage;