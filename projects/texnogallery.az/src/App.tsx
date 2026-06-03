import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import ChatWidget from './components/widgets/ChatWidget';
import Home from './pages/Home';
import Search from './pages/Search';
import Contact from './pages/Contact';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import Category from './pages/Category';
import ProductDetails from './pages/ProductDetails';
import { ShopProvider } from './context/ShopContext';
import './App.css';
import CategoryPage from './pages/CategoryPage';

function App() {
  return (
    <ShopProvider>
      <Router>
        <div className="app-container">
          <Header />
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/category/:id" element={<Category />} />
            <Route path="/product/:id" element={<ProductDetails />} />

            {/* Əsas Kateqoriyalar üçün Dinamik URL (Məs: /kataloq/noutbuklar) */}
            <Route path="/kataloq/:categorySlug" element={<CategoryPage />} />
            
            {/* Alt Kateqoriyalar üçün Dinamik URL (Məs: /kataloq/noutbuklar/oyun-noutbuklari) */}
            <Route path="/kataloq/:categorySlug/:subCategorySlug" element={<CategoryPage />} />
            {/* Add more routes here as we create other pages */}
          </Routes>
          
          <ChatWidget />
        </div>
      </Router>
    </ShopProvider>
  );
}

export default App;
