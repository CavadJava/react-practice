import ProductCard from "./components/ProductCard/ProductCard.jsx";
import productData from "./data/product.json";
import Product from "./components/Product.jsx";

function App() {

    // console.log("productData:", productData);
    const date = Date.now();

    const name = "Javad";
    const myPerson = {
        name:"Rahim",
        age:25,
        job:"Developer"
    }

    function alertUser(param) {
        alert(`Hello ${name}! Current time is ${date}`);
        console.log("Parameter:", param);
    }

    return (
        <>
            <Product
                name={name}
                age={20}
                isWorking={true}
                list={[1, 2, 3, 4, 5]}
                myPerson={myPerson}
                sayUserAlert={alertUser}>
            </Product>

            {
                productData.map((product) => {
                    return (
                        console.log("product:", product),
                            <ProductCard key={product.id} {...product}></ProductCard>
                    );
                })
            }
        </>
    )
}

export default App
