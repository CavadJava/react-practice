import React from 'react'
import { createRoot } from 'react-dom/client'
import Car from "./Car.jsx";

createRoot(document.getElementById('root')).render(
    <Car year={1969} />
);