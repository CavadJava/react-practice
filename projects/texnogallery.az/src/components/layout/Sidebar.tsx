import { Link } from 'react-router-dom';
import { slugify } from '../../utils/slugify';
import './Sidebar.css';

export const categoriesData = [
  { icon: '💻', name: 'Noutbuklar', subCategories: ['Oyun noutbukları', 'Ofis noutbukları', 'Ultraportativ noutbuklar', 'Transformer noutbuklar', 'Apple MacBook', 'Aksesuarlar'] },
  { icon: '🖥️', name: 'Masaüstü Kompüter', subCategories: ['Oyun kompüterləri', 'Monobloklar', 'Nettopplar', 'Barebone sistemlər', 'Serverlər'] },
  { icon: '🔌', name: 'Kompüter Hissələri', subCategories: ['CPU', 'GPU', 'RAM', 'Ana platalar', 'SSD və HDD', 'Qida blokları', 'Keyslər', 'Soyutma sistemləri'] },
  { icon: '📱', name: 'Smartfonlar', subCategories: ['Apple', 'Samsung', 'Xiaomi', 'OnePlus', 'Google Pixel', 'Aksesuarlar'] },
  { icon: '🎧', name: 'Kompüter Aksesuarları', subCategories: ['Klaviaturalar', 'Siçanlar', 'Qulaqlıqlar', 'Web kameralar', 'Mikrofonlar', 'Səs kartları'] },
  { icon: '📺', name: 'TV və Monitor', subCategories: ['Televizorlar', 'Monitorlar', 'Proyektorlar', 'TV aksesuarları'] },
  { icon: '🖨️', name: 'Ofis avadanlığı', subCategories: ['Printerlər', 'Skanerlər', 'MFP-lər', 'Kartriclər', 'Kağız'] },
  { icon: '🌐', name: 'Şəbəkə Avadanlıqları', subCategories: ['Routerlər', 'Switchlər', 'Wi-Fi adapterlər', 'Patch panellər'] },
  { icon: '📹', name: 'Video Müşahidə Cihazları', subCategories: ['IP kameralar', 'Videoqeydiyyatçılar', 'Domofonlar', 'Aksesuarlar'] },
  { icon: '🎒', name: 'Notbuk Aksesuarları', subCategories: ['Çantalar', 'Adapterlər', 'Docking stansiyalar', 'Soyuducular'] },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <ul className="category-list">
        {categoriesData.map((category, index) => {
          const mainSlug = slugify(category.name);

          return (
            <li key={index} className="category-item">
              <Link to={`/kataloq/${mainSlug}`} className="category-link" style={{ textDecoration: 'none' }}>
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
              </Link>
              
              <div className="subcategory-popup">
                {category.subCategories.map((subCategory, subIndex) => {
                  const subSlug = slugify(subCategory);
                  
                  return (
                    <Link to={`/kataloq/${mainSlug}/${subSlug}`} key={subIndex} className="subcategory-item">
                      {subCategory}
                    </Link>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export default Sidebar;