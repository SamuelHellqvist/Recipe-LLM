import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Old from './pages/old'
import Home from './pages/Home'


function App() {
  
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/old" element={<><Old /></>} />
        </Routes>
      </BrowserRouter>
    </>
  )

}

export default App