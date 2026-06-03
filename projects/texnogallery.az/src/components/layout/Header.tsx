import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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
          <Link to="/wishlist" className="icon-wrapper" style={{ textDecoration: 'none' }}>🔖</Link>
          <Link to="/cart" className="icon-wrapper" style={{ textDecoration: 'none' }}>🛒</Link>
          <Link to="/profile" className="icon-wrapper" style={{ textDecoration: 'none' }}>👤</Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
