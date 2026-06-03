function Profile() {
  return (
    <div className="main-content" style={{ padding: '40px', width: '100%', display: 'flex', flexDirection: 'column', gap: '40px', textAlign: 'left' }}>
      <h2>Şəxsi Kabinet</h2>

      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        
        {/* Yan Menyu (Profil naviqasiyası) */}
        <div style={{ flex: '0 0 250px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button style={{ padding: '15px 20px', textAlign: 'left', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
            Profil Məlumatları
          </button>
          <button style={{ padding: '15px 20px', textAlign: 'left', backgroundColor: '#f9f9f9', color: '#555', border: '1px solid #eee', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '1rem' }}>
            Sifarişlərim
          </button>
          <button style={{ padding: '15px 20px', textAlign: 'left', backgroundColor: '#f9f9f9', color: '#555', border: '1px solid #eee', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '1rem' }}>
            Şifrəni Yenilə
          </button>
          <button style={{ padding: '15px 20px', textAlign: 'left', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginTop: '20px' }}>
            Hesabdan Çıx
          </button>
        </div>

        {/* Profil Məlumatları Formu */}
        <div style={{ flex: '1 1 500px', backgroundColor: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #eee' }}>
          <h3 style={{ marginBottom: '20px', color: 'var(--text-dark)' }}>Şəxsi Məlumatlar</h3>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} onSubmit={(e) => { e.preventDefault(); alert("Məlumatlar yeniləndi!"); }}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="firstName" style={{ fontWeight: '500', color: '#444' }}>Ad</label>
                <input type="text" id="firstName" defaultValue="Vüsal" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="lastName" style={{ fontWeight: '500', color: '#444' }}>Soyad</label>
                <input type="text" id="lastName" defaultValue="Əliyev" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="email" style={{ fontWeight: '500', color: '#444' }}>E-poçt ünvanı</label>
                <input type="email" id="email" defaultValue="vusal.aliyev@example.com" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="phone" style={{ fontWeight: '500', color: '#444' }}>Telefon nömrəsi</label>
                <input type="tel" id="phone" defaultValue="+994 50 123 45 67" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="address" style={{ fontWeight: '500', color: '#444' }}>Çatdırılma ünvanı</label>
              <textarea id="address" rows={3} defaultValue="Bakı şəhəri, Nərimanov r-nu" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', resize: 'vertical' }}></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" style={{ padding: '12px 30px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>
                Yadda Saxla
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Profile;
