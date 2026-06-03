function Contact() {
  return (
    <div className="main-content" style={{ padding: '40px', width: '100%', display: 'flex', flexDirection: 'column', gap: '40px', textAlign: 'left' }}>
      <h2>Bizimlə Əlaqə</h2>

      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        
        {/* Əlaqə məlumatları */}
        <div style={{ flex: '1 1 300px', backgroundColor: '#f9f9f9', padding: '30px', borderRadius: '12px', border: '1px solid #eee' }}>
          <h3 style={{ marginBottom: '20px', color: 'var(--text-dark)' }}>Bizə Yazin və ya Zəng Edin</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: '#555', lineHeight: '1.6' }}>
            <div>
              <strong>📍 Ünvan:</strong><br />
              Bakı şəhəri, Nərimanov rayonu, Əhməd Rəcəbli küçəsi 25.
            </div>
            <div>
              <strong>📞 Telefon:</strong><br />
              +994 12 345 67 89<br />
              +994 50 123 45 67
            </div>
            <div>
              <strong>✉️ E-poçt:</strong><br />
              info@texnogallery.az
            </div>
            <div>
              <strong>🕒 İş saatları:</strong><br />
              Hər gün: 10:00 - 20:00
            </div>
          </div>
        </div>

        {/* Əlaqə Formu */}
        <div style={{ flex: '1 1 400px', backgroundColor: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #eee' }}>
          <h3 style={{ marginBottom: '20px', color: 'var(--text-dark)' }}>Mesaj Göndərin</h3>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={(e) => { e.preventDefault(); alert("Mesajınız göndərildi. Təşəkkür edirik!"); }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="name" style={{ fontWeight: '500', color: '#444' }}>Ad və Soyad</label>
              <input type="text" id="name" required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }} placeholder="Adınızı daxil edin" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="email" style={{ fontWeight: '500', color: '#444' }}>E-poçt ünvanı</label>
              <input type="email" id="email" required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }} placeholder="nümunə@mail.com" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="message" style={{ fontWeight: '500', color: '#444' }}>Mesajınız</label>
              <textarea id="message" rows={5} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', resize: 'vertical' }} placeholder="Mesajınızı bura yazın..."></textarea>
            </div>

            <button type="submit" style={{ padding: '14px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginTop: '10px' }}>
              Göndər
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Contact;
