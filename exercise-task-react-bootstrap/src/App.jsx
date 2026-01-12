import Navbar from "./components/Navbar/Navbar.jsx";
import Card from "./components/Card/Card.jsx";
import {WelcomeMessage} from "./components/Message/WelcomeMessage.jsx";
import Product from "./components/Product/Product.jsx";
import SecondWelcomeMessage from "./components/Message/SecondWelcomeMessage.jsx";
import Task from "./components/axious/Task.jsx";

function App() {

    const cardList = [
        {
            id: "1",
            title: "Card 1",
            text: "Some quick example text to build on the card title and make up the bulk of the card's content.",
        },
        {
            id: "2",
            title: "Card 2",
            text: "Some quick example text to build on the card title and make up the bulk of the card's content.",
        },
        {
            id: "3",
            title: "Card 3",
            text: "Some quick example text to build on the card title and make up the bulk of the card's content.",
        }
    ];
    const productList = [
        {
            id: "1",
            name: "Tesla Model S",
            description: "Tesla Model S is an electric car produced by Tesla, an American electric vehicle and clean energy company based in Palo Alto, California.",
            year: 2025,
            image: "https://d2q97jj8nilsnk.cloudfront.net/images/tesla-model-s-plaid-0-60-fastest-tesla.jpg"
        },
        {
            id: "2",
            name: "Tesla model 3",
            description: "Tesla Model 3 is an electric car produced by Tesla, an American electric vehicle and clean energy company based in Palo Alto, California.",
            year: 2025,
            image: "https://static-assets.tesla.com/configurator/compositor?context=design_studio_2?&bkba_opt=1&view=STUD_3QTR&size=600&model=m3&options=$APBS,$IPB2,$PR01,$SC04,$MDL3,$W38A,$MT351,$CPF0&crop=1150,647,390,180&"
        },
        {
            id: "3",
            name: "Tesla model X",
            description: "Tesla Model X is a mid-size luxury electric crossover SUV produced by Tesla, an American electric vehicle and clean energy company based in Palo Alto, California.",
            year: 2025,
            image: "https://ev-database.org/img/auto/Tesla_Model_X/Tesla_Model_X-02.jpg"
        }
    ];

  return (
    <>
        {/* <Navbar/> */}
        {/* <div className="container">
            <div className="row justify-content-center ms-lg-5">
                <WelcomeMessage name="Card List Start" showType="hide">
                {cardList.map((card) => {
                    return (
                        <Card key={card.id} {...card}></Card>
                    );
                })}
                <WelcomeMessage name="Card List End" showType="hide"></WelcomeMessage>
                </WelcomeMessage>
                <WelcomeMessage name="-------"></WelcomeMessage>
                <SecondWelcomeMessage>Car List</SecondWelcomeMessage>
                {productList.map((product) => {
                    return (
                        <Product key={product.id} {...product}></Product>
                    );
                })}
                <SecondWelcomeMessage></SecondWelcomeMessage>
            </div> */}

        {/* </div> */}
        <Task/>
    </>
  )
}

export default App
