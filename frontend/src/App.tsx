import { BrowserRouter } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import AppRouter from './router/index'

function Layout() {
  const { token } = useAuth()
  const location = useLocation()
  const showNavbar = token !== null && location.pathname !== '/login'

  return (
    <div className="min-h-screen flex flex-col">
      {showNavbar && <Navbar />}
      <div className="flex-1">
        <AppRouter />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  )
}
