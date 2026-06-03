import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import ChatWidget from './components/widgets/ChatWidget';
import Home from './pages/Home';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Add more routes here as we create other pages */}
        </Routes>
        
        <ChatWidget />
      </div>
    </Router>
  );
}

export default App;
