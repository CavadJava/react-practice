import './BrandLogos.css';

function BrandLogos() {
  const logos = [
    { name: 'ASUS', src: 'https://via.placeholder.com/60x30/CCCCCC/000000?text=ASUS' },
    { name: 'HP', src: 'https://via.placeholder.com/60x30/CCCCCC/000000?text=HP' },
    { name: 'Acer', src: 'https://via.placeholder.com/60x30/CCCCCC/000000?text=Acer' },
    { name: 'Lenovo', src: 'https://via.placeholder.com/60x30/CCCCCC/000000?text=Lenovo' },
    { name: 'Gigabyte', src: 'https://via.placeholder.com/60x30/CCCCCC/000000?text=Giga' },
    { name: 'MSI', src: 'https://via.placeholder.com/60x30/CCCCCC/000000?text=MSI' },
    { name: 'AMD', src: 'https://via.placeholder.com/60x30/CCCCCC/000000?text=AMD' },
    { name: 'Logitech', src: 'https://via.placeholder.com/60x30/CCCCCC/000000?text=Logi' },
  ];

  return (
    <div className="brand-logos-section">
      {logos.map((logo, index) => (
        <img key={index} src={logo.src} alt={logo.name} className="brand-logo" />
      ))}
      <button className="more-brands-button">...</button>
    </div>
  );
}

export default BrandLogos;
