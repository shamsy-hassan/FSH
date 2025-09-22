const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-6 mt-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-lg font-bold mb-4">Farmers Home</h3>
          <p className="text-gray-300">
            Empowering farmers with technology and resources for sustainable agriculture.
          </p>
        </div>
        
        <div>
          <h3 className="text-lg font-bold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-gray-300">
            <li><a href="#" className="hover:text-white">About Us</a></li>
            <li><a href="#" className="hover:text-white">Contact</a></li>
            <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white">Terms of Service</a></li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-bold mb-4">Contact Us</h3>
          <p className="text-gray-300">Email: info@farmershome.com</p>
          <p className="text-gray-300">Phone: +254 700 123 456</p>
        </div>
      </div>
      
      <div className="border-t border-gray-700 mt-8 pt-4 text-center text-gray-300">
        <p>&copy; 2023 Farmers Home. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer