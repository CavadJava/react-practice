import './Navbar.css';

function Navbar() {
  const categories = [
    {
      icon: '💻',
      name: 'Noutbuklar',
      subCategories: ['Oyun noutbukları', 'Ofis noutbukları', 'Ultraportativ noutbuklar'],
    },
    {
      icon: '🖥️',
      name: 'Masaüstü Kompüter',
      subCategories: ['Oyun kompüterləri', 'Monobloklar', 'Nettopplar'],
    },
    { icon: '🔌', name: 'Kompüter Hissələri', subCategories: ['CPU', 'GPU', 'RAM'] },
    { icon: '📱', name: 'Smartfonlar', subCategories: ['Apple', 'Samsung', 'Xiaomi'] },
    {
      icon: '🎧',
      name: 'Kompüter Aksesuarları',
      subCategories: ['Klaviaturalar', 'Siçanlar', 'Qulaqlıqlar'],
    },
    { icon: '📺', name: 'TV və Monitor', subCategories: ['Televizorlar', 'Monitorlar'] },
    { icon: '🖨️', name: 'Ofis avadanlığı', subCategories: ['Printerlər', 'Skanerlər'] },
    { icon: '🌐', name: 'Şəbəkə Avadanlıqları', subCategories: ['Routerlər', 'Switchlər'] },
    {
      icon: '📹',
      name: 'Video Müşahidə Cihazları',
      subCategories: ['IP kameralar', 'Videoqeydiyyatçılar'],
    },
    { icon: '🎒', name: 'Notbuk Aksesuarları', subCategories: ['Çantalar', 'Adapterlər'] },
  ];

  return (
    <nav className="navbar">
      <ul className="nav-list">
        {categories.map((category, index) => (
          <li key={index} className="nav-item">
            <div className="nav-link">
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </div>
            <div className="dropdown-menu">
              {category.subCategories.map((subCategory, subIndex) => (
                <a href="#" key={subIndex} className="dropdown-item">
                  {subCategory}
                </a>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navbar;