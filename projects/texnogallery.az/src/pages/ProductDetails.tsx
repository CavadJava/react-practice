import { useParams } from 'react-router-dom';

function ProductDetails() {
  const { id } = useParams();
  const productName = id ? decodeURIComponent(id) : 'Məhsul Detalları';

  return (
    <div className="main-content" style={{ padding: '40px', width: '100%', display: 'flex', flexDirection: 'column', gap: '30px', textAlign: 'left' }}>
      <h2>{productName}</h2>
      
      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        {/* Product Image Placeholder */}
        <div style={{ flex: '1 1 400px', backgroundColor: '#f9f9f9', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', border: '1px solid #eee' }}>
          <img 
            src={`https://via.placeholder.com/400/EEEEEE/000000?text=${encodeURIComponent(productName.substring(0, 15))}`} 
            alt={productName} 
            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} 
          />
        </div>

        {/* Product Info */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
            Qiymət: 1500 ₼
          </div>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            Bu məhsul haqqında ətraflı məlumat burada yerləşəcək. Məhsulun xüsusiyyətləri, texniki göstəriciləri və istifadə qaydaları barədə geniş təsvir bu hissədə olacaq.
          </p>
          
          <ul style={{ paddingLeft: '20px', color: '#444', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><strong>Brend:</strong> TexnoBrand</li>
            <li><strong>Zəmanət:</strong> 1 İl</li>
            <li><strong>Vəziyyət:</strong> Yeni</li>
            <li><strong>Çatdırılma:</strong> 24 saat ərzində</li>
          </ul>

          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <button style={{ padding: '12px 24px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}>
              Səbətə At
            </button>
            <button style={{ padding: '12px 24px', backgroundColor: 'transparent', color: 'var(--primary-color)', border: '2px solid var(--primary-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}>
              Seçilmişlərə Əlavə Et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
