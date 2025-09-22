import { useState } from 'react'
import { Link } from 'react-router-dom'

const Navbar = ({ onMenuClick }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  return (
    <div className="bg-white shadow-md h-16 fixed top-0 right-0 left-0 md:left-64 z-10 transition-all">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-100"
          onClick={onMenuClick}
        >
          <span className="text-2xl">☰</span>
        </button>

        {/* Search */}
        <div className="flex-1 px-4 md:px-0">
          <input
            type="text"
            placeholder="Search..."
            className="w-full max-w-md border rounded-md px-3 py-2 focus:outline-none focus:ring focus:border-primary-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <span className="text-xl">🔔</span>
          </button>

          <div className="relative">
            <button
              className="flex items-center space-x-2"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white">
                U
              </div>
              <span className="hidden md:inline">User</span>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                <Link
                  to="/user/profile"
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  Profile
                </Link>
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar
