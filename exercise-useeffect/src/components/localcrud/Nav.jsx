import React, { useEffect, useState, useLayoutEffect } from "react";
import axios from "axios";

function Nav({age}) {

    const [cards, setCards] = useState([]);



    // ADDED
    useEffect(() => {
      
      const cleanup = () => {
        console.log("Nav component unmounted or before age changes");

      };
      return cleanup;

    }, []);

    // UPDATED
    useLayoutEffect(() => {
        console.log("Data updated");

    }, []);

    // UPDATED
    useEffect(() => {
        console.log("Age changed:", age);

        if(age>18){
            console.log("Adult");
        }

    }, [age]);

    useEffect(() => {
      console.log("--->Fetching all posts...");
      axios({
        url: 'http://localhost:9090/card-service/api/v1/card',
        method: 'get',
        headers: {
          'Access-Control-Allow-Origin': '*'  
        }
      })
      .then((response) => {
        console.log("Fetched posts:", response.data);
        setCards(response.data);
      }).catch((error) => {
        console.error("Error fetching posts:", error);
      });

    },[]);

    useEffect(() => {
      // console.log("--->Fetching post by ID...");
      // axios({
      // url: 'http://localhost:9090/card-service/api/v1/card/card-id/1',
      // method: 'get',
      // headers: {
      //   'Access-Control-Allow-Origin': '*'  
      // }
      // })
      // .then((response) => {
      // console.log("Fetched post by ID:", response.data); 
      // }).catch((error) => {
      // console.error("Error fetching post by ID:", error);
      // })
    }, []);

  return (
    <div>
      <h2>UseEffects Component</h2>
      <p>This is a placeholder for the UseEffects component.</p>
      <div className="cards" style={{display:'flex',flexWrap: 'wrap', justifyContent:"left"}}>
        {
          cards.map((card) => (
            <div className="card" key={card.cardId} style={{border: '1px solid black', margin: '10px', padding: '10px',alignItems:'center'}}>
              <p>{card.cardId}</p>
              <p>{card.cardNumber}</p>
            </div>
          ))
        }
      </div>
    </div>
  );
}

export default Nav;