import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-gray-900 text-base"
        >
          <span>⚽</span>
          <span>Football Analytics</span>
        </Link>
        <div className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
          <Link to="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <Link to="/players/compare" className="hover:text-blue-600 transition-colors">
            Compare
          </Link>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="text-sm text-gray-500 hover:text-red-600 transition-colors"
      >
        Sign out
      </button>
    </nav>
  )
}
