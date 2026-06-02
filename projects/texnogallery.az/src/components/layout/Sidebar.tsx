import './Sidebar.css';

function Sidebar() {
  const categories = [
    { icon: '💻', name: 'Noutbuklar' },
    { icon: '🖥️', name: 'Masaüstü Kompüter' },
    { icon: '🔌', name: 'Kompüter Hissələri' },
    { icon: '📱', name: 'Smartfonlar' },
    { icon: '🎧', name: 'Kompüter Aksesuarları' },
    { icon: '📺', name: 'TV və Monitor' },
    { icon: '🖨️', name: 'Ofis avadanlığı' },
    { icon: '🌐', name: 'Şəbəkə Avadanlıqları' },
    { icon: '📹', name: 'Video Müşahidə Cihazları' },
    { icon: '🎒', name: 'Notbuk Aksesuarları' },
  ];

  return (
    <aside className="sidebar">
      <ul className="category-list">
        {categories.map((category, index) => (
          <li key={index} className="category-item">
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default Sidebar;
