import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import './Header.css';

function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { cartCount, wishlistCount } = useShop();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
          TEXNO GALLERY
        </Link>
        <form className="search-bar" onSubmit={handleSearch}>
          <input 
            type="text" 
            placeholder="axtardığınız məhsulun seriya, model və ya adını yazın..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-button">🔍</button>
        </form>
      </div>
      <div className="header-right">
        <Link to="/contact">
          <button className="contact-button">Əlaqə</button>
        </Link>
        <div className="user-actions">
          <Link to="/wishlist" className="icon-wrapper" style={{ textDecoration: 'none', position: 'relative' }}>
            🔖
            {wishlistCount > 0 && <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: 'var(--primary-color)', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px' }}>{wishlistCount}</span>}
          </Link>
          <Link to="/cart" className="icon-wrapper" style={{ textDecoration: 'none', position: 'relative' }}>
            🛒
            {cartCount > 0 && <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: 'var(--primary-color)', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px' }}>{cartCount}</span>}
          </Link>
          <Link to="/profile" className="icon-wrapper" style={{ textDecoration: 'none' }}>👤</Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
