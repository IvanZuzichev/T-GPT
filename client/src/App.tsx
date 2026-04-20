import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import MainPage from './pages/MainPage';
import './App.scss';
// Знаю, что одна страница, но по привычке и в качестве хорошего тона пишу все равно React Router так как мало ли этот пет проект послужит основой для чего-то большего
function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<MainPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;