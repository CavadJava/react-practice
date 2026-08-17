import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Register from './pages/Register'
import Login from './pages/Login'
import Tarif from './pages/Tarif'
import FAQ from './pages/FAQ'
import Blog from './pages/Blog'
import Branches from './pages/Branches'
import Contact from './pages/Contact'
import ExampleShop from './pages/ExampleShop'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="register" element={<Register />} />
          <Route path="login" element={<Login />} />
          <Route path="tarif" element={<Tarif />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="blog" element={<Blog />} />
          <Route path="branches" element={<Branches />} />
          <Route path="contact" element={<Contact />} />
          <Route path="example-shop" element={<ExampleShop />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
