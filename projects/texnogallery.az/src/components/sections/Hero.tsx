import './Hero.css';

function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-main-banner">
        <img src="https://via.placeholder.com/800x400/000000/FFFFFF?text=ROG+Strix+G16" alt="ROG Strix G16 Laptop" className="hero-laptop-image" />
        <div className="hero-overlay-text">
          <h3>ROG Strix</h3>
          <h2>G16</h2>
          <p>G615JPR-S5101</p>
          <p>90NROL91-M00480</p>
        </div>
        <ul className="hero-specs">
          <li>• i9-14900HX</li>
          <li>• 32GB DDR5</li>
          <li>• 1TB SDD</li>
          <li>• 16" 2.5K 240Hz</li>
          <li>• RTX5070 8GB</li>
          <li>• TG2611</li>
        </ul>
      </div>

      <div className="gunun-fursəti-card">
        <div className="label">Günün Fürsəti 🔥</div>
        <div className="prices">
          <span className="current-price">3199₼</span>
          <span className="old-price">3999₼</span>
        </div>
        <img src="https://via.placeholder.com/150x150/CCCCCC/000000?text=Desktop+PC" alt="Desktop PC" className="fursati-image" />
        <p className="fursati-product-name">Lenovo LOQ Tower 17IAX10 91AY0051KZ</p>
      </div>
    </section>
  );
}

export default Hero;
