import { useParams, useSearchParams } from 'react-router-dom';

function Category() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const sub = searchParams.get('sub');

  return (
    <div className="main-content" style={{ padding: '40px', textAlign: 'left', width: '100%' }}>
      <h2>Kategoriya: {id ? decodeURIComponent(id) : 'Bütün Məhsullar'}</h2>
      {sub && <h3>Alt Kategoriya: {decodeURIComponent(sub)}</h3>}
      <p style={{ marginTop: '20px' }}>Bu səhifədə seçilmiş kateqoriyaya aid məhsullar listələnəcək.</p>
    </div>
  );
}

export default Category;
