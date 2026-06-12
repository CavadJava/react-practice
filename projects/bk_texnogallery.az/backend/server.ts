import express from 'express';
import cors from 'cors';
import customerRoutes from './routes/customerRoutes';

const app = express();
const PORT = 8080;

// CORS İcazələrinin tənzimlənməsi
app.use(cors({
    origin: 'http://localhost:3000', // Next.js-in işləyəcəyi port
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Marşrutu
app.use('/backoffice', customerRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Backend server ${PORT} portunda aktivdir!`);
});