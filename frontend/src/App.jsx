import { Outlet } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ChatWidget from './components/ChatWidget'
import { useEffect, useState } from 'react'
import Loading from './components/Loading'

function App() {

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); 

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loading />; 
  }


  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className='flex-1 max-w-screen-2xl mx-auto px-4 py-6 font-primary w-full'>
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}

export default App