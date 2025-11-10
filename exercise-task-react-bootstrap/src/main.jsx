import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import Task1 from "./components/task4/Task.jsx";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Task1/>
    </StrictMode>
)
