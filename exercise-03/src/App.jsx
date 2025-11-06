import ProductCard from "./components/ProductCard/ProductCard.jsx";
import productData from "./data/product.json";
function App() {

    console.log("productData:",productData);

  return (
    <>
        {
            productData.map((product) => {
                return (
                    <ProductCard key={product.id} product={product}></ProductCard>
                );
            })
        }
    </>
  )
}

export default App
