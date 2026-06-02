import Header from './components/layout/Header';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Hero from './components/sections/Hero';
import BrandLogos from './components/sections/BrandLogos';
import ProductList from './components/sections/ProductList';
import ChatWidget from './components/widgets/ChatWidget';
import './App.css';

function App() {
  // Placeholder data for product lists
  const newProducts = [
    { name: "iPhone 17 Pro Max", price: "3499 ₼", imageUrl: "https://via.placeholder.com/150/FF0000/FFFFFF?text=iPhone" },
    { name: "ASUS ROG Strix G16", price: "2599 ₼", imageUrl: "https://via.placeholder.com/150/0000FF/FFFFFF?text=ASUS" },
    { name: "Lenovo Legion Pro 5", price: "2649 ₼", imageUrl: "https://via.placeholder.com/150/FFFF00/000000?text=Lenovo" },
    { name: "Asus TUF Gaming F17", price: "1799 ₼", imageUrl: "https://via.placeholder.com/150/00FF00/FFFFFF?text=TUF" },
    { name: "HP Probook 460 G11", price: "1749 ₼", imageUrl: "https://via.placeholder.com/150/FFA500/FFFFFF?text=HP" },
  ];

  const popularOffers = [
    { name: "Gaming PC", price: "2649 ₼", imageUrl: "https://via.placeholder.com/150/800080/FFFFFF?text=PC" },
    { name: "Another Laptop", price: "1200 ₼", imageUrl: "https://via.placeholder.com/150/FFC0CB/000000?text=Laptop" },
    { name: "Smartwatch", price: "300 ₼", imageUrl: "https://via.placeholder.com/150/00FFFF/000000?text=Watch" },
  ];

  return (
    <div className="app-container">
      <Header />
      <Navbar />
      <div className="main-content">
        <Sidebar />
        <div className="content-area">
          <Hero />
          <BrandLogos />
          <ProductList title="Yeni Məhsullar" products={newProducts} />
          <ProductList title="Populyar Təkliflər" products={popularOffers} />
        </div>
      </div>
      <ChatWidget />
    </div>
  );
}

export default App;
