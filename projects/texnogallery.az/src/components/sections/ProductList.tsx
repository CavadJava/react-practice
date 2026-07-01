import ProductCard from '../common/ProductCard';
import './ProductList.css';

interface Product {
  name: string;
  price: string;
  imageUrl: string;
  oldPrice?: string;
  badge?: string;
  description?: string;
}

interface ProductListProps {
  title: string;
  products: Product[];
}

function ProductList({ title, products }: ProductListProps) {
  return (
    <section className="product-list">
      <h2>{title}</h2>
      <div className="products-container">
        {products.map((product, index) => (
          <ProductCard key={index} {...product} />
        ))}
      </div>
    </section>
  );
}

export default ProductList;
