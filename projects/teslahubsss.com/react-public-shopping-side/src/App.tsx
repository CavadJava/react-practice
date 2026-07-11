import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AnnouncementBar from './components/AnnouncementBar';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import SalePage from './pages/SalePage';
import CollectionPage from './pages/CollectionPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />

        {/* Sale / event */}
        <Route path="/sale" element={<Layout><SalePage /></Layout>} />

        {/* Model collections */}
        <Route path="/model-y" element={<Layout><CollectionPage /></Layout>} />
        <Route path="/model-3" element={<Layout><CollectionPage /></Layout>} />
        <Route path="/model-s" element={<Layout><CollectionPage /></Layout>} />
        <Route path="/model-x" element={<Layout><CollectionPage /></Layout>} />
        <Route path="/cybertruck" element={<Layout><CollectionPage /></Layout>} />

        {/* Shop All */}
        <Route path="/shop" element={<Layout><CollectionPage /></Layout>} />
        <Route path="/all-models" element={<Layout><CollectionPage /></Layout>} />

        {/* Other pages */}
        <Route path="/about" element={<Layout><AboutPage /></Layout>} />
        <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
        <Route path="/order-status" element={<Layout><ContactPage /></Layout>} />
        <Route path="/support" element={<Layout><ContactPage /></Layout>} />
        <Route path="/digest" element={<Layout><AboutPage /></Layout>} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}
