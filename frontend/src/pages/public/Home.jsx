import { Link } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const carouselRef = useRef(null)

  const heroSlides = [
    {
      image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1800&q=80",
      title: "Farmers Home",
      subtitle: "A futuristic hub for farmers, markets, and innovation."
    },
    {
      image: "https://images.unsplash.com/photo-1625246333193-4e1f1e5fcb6c?auto=format&fit=crop&w=1800&q=80",
      title: "Empowering Communities",
      subtitle: "Direct access to buyers, sellers, and agricultural intelligence."
    },
    {
      image: "https://images.unsplash.com/photo-1604079628040-943b7f9f6b4a?auto=format&fit=crop&w=1800&q=80",
      title: "Smart Agriculture",
      subtitle: "Cutting-edge tools, training, and financial support for growth."
    },
    {
      image: "https://images.unsplash.com/photo-1598965402089-67c1f6e8db6f?auto=format&fit=crop&w=1800&q=80",
      title: "Sustainable Farming",
      subtitle: "Driving eco-friendly practices for a greener tomorrow."
    },
    {
      image: "https://images.unsplash.com/photo-1542831371-d531d36971e6?auto=format&fit=crop&w=1800&q=80",
      title: "Digital Innovation",
      subtitle: "Leveraging AI and data to transform agriculture."
    },
    {
      image: "https://images.unsplash.com/photo-1625246332262-016f00f6c3a9?auto=format&fit=crop&w=1800&q=80",
      title: "Global Connections",
      subtitle: "Linking farmers to international markets and opportunities."
    }
  ]

  // Auto-play
  useEffect(() => {
    if (isPaused) return
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [heroSlides.length, isPaused])

  // Progress indicator
  useEffect(() => {
    const progressBar = document.getElementById('progress-bar')
    if (progressBar) {
      progressBar.style.animation = 'none'
      // Trigger reflow
      void progressBar.offsetWidth
      progressBar.style.animation = `progress 6s linear`
    }
  }, [currentSlide])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans overflow-hidden">
      <style>
        {`
          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
          
          .slide-progress {
            height: 3px;
            background: linear-gradient(to right, #4ade80, #10b981);
            animation: progress 6s linear;
          }
        `}
      </style>
      
      {/* Hero Section */}
      <section 
        className="relative h-screen flex items-center justify-center"
        ref={carouselRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait">
          {heroSlides.map((slide, i) => (
            currentSlide === i && (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0"
              >
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-green-900/60 backdrop-blur-sm" />
              </motion.div>
            )
          ))}
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button 
          onClick={prevSlide}
          className="absolute left-4 z-20 p-3 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all"
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          onClick={nextSlide}
          className="absolute right-4 z-20 p-3 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all"
          aria-label="Next slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-3 h-3 rounded-full ${currentSlide === i ? 'bg-green-400' : 'bg-white/30'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 z-30 h-1">
          {!isPaused && <div id="progress-bar" className="slide-progress"></div>}
        </div>

        {/* Hero Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 text-center px-6 max-w-4xl"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-emerald-500 drop-shadow-2xl mb-6">
              {heroSlides[currentSlide].title}
            </h1>
            <p className="mt-4 text-xl md:text-2xl text-gray-200 opacity-90 max-w-3xl mx-auto">
              {heroSlides[currentSlide].subtitle}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-5">
              <Link
                to="/register"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-400 to-emerald-600 text-gray-900 font-bold text-lg shadow-2xl hover:shadow-green-500/40 hover:scale-105 transition-all duration-300"
              >
                Get Started
              </Link>
              <Link
                to="/about"
                className="px-8 py-4 rounded-xl border-2 border-green-400/70 text-green-200 hover:bg-green-400/10 hover:border-green-400 transition-all duration-300 font-semibold"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
          <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds.png')] opacity-5"></div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-green-300"
            >
              Transforming Agriculture
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-gray-400 mt-4 text-xl max-w-3xl mx-auto"
            >
              Join thousands of farmers who are already benefiting from our platform
            </motion.p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "10,000+", label: "Active Farmers" },
              { number: "95%", label: "Satisfaction Rate" },
              { number: "50+", label: "Regions Served" },
              { number: "24/7", label: "Support Available" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-green-400/20 shadow-xl hover:shadow-green-400/10"
              >
                <h3 className="text-3xl md:text-4xl font-extrabold text-green-400">
                  {stat.number}
                </h3>
                <p className="text-gray-300 mt-2 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-950 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-gray-800 to-transparent"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-green-300"
            >
              Futuristic Solutions
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-gray-400 mt-4 text-xl"
            >
              A digital ecosystem for every farmer, powered by intelligence and collaboration.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🌦️",
                title: "Agro Climate Intelligence",
                desc: "AI-powered insights for weather, soil, and crops with 95% accuracy predictions."
              },
              {
                icon: "🛒",
                title: "E-Commerce Marketplace",
                desc: "Trade farm products securely with integrated logistics and payment solutions."
              },
              {
                icon: "🎓",
                title: "Skills Development",
                desc: "Learn modern farming techniques with expert-led programs and certifications."
              },
              {
                icon: "💰",
                title: "Financial Access",
                desc: "Quick loans, insurance, and investment opportunities tailored for farmers."
              },
              {
                icon: "🏪",
                title: "Market Access",
                desc: "Connect directly with verified buyers and sellers across global markets."
              },
              {
                icon: "💬",
                title: "Community Hub",
                desc: "Collaborate, share knowledge, and solve problems with a network of farmers."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                className="p-8 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-800/40 border border-green-400/10 hover:border-green-400/40 backdrop-blur-xl shadow-xl transition-all group"
              >
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-green-300 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds.png')] opacity-5"></div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-green-300"
            >
              What Farmers Say
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-gray-400 mt-4 text-xl"
            >
              Hear from our community of successful farmers
            </motion.p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Rajesh Kumar",
                role: "Organic Farmer",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80",
                text: "This platform transformed my farming business. I've doubled my income by connecting directly with buyers."
              },
              {
                name: "Priya Sharma",
                role: "Dairy Farmer",
                image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80",
                text: "The weather predictions and market insights have been incredibly accurate and helpful for planning."
              },
              {
                name: "Vikram Singh",
                role: "Crop Farmer",
                image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80",
                text: "Access to loans through this platform helped me expand my operations during difficult times."
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl border border-green-400/20"
              >
                <div className="flex items-center mb-4">
                  <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                  <div className="ml-4">
                    <h4 className="font-bold text-green-300">{testimonial.name}</h4>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 italic">"{testimonial.text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 to-emerald-900/20"></div>
        <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-green-300 mb-6"
          >
            Ready to Transform Your Farming Business?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto"
          >
            Join thousands of farmers who are already benefiting from our innovative platform
          </motion.p>
          <div className="flex flex-col sm:flex-row justify-center gap-5">
            <Link
              to="/register"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-400 to-emerald-600 text-gray-900 font-bold text-lg shadow-2xl hover:shadow-green-500/40 hover:scale-105 transition-all duration-300"
            >
              Create Account
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 rounded-xl border-2 border-green-400/70 text-green-200 hover:bg-green-400/10 hover:border-green-400 transition-all duration-300 font-semibold"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-green-400 mb-4">Farmers Home</h3>
              <p className="text-gray-400">Empowering farmers with technology, markets, and community support.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-green-400 transition-colors">About Us</Link></li>
                <li><Link to="/services" className="text-gray-400 hover:text-green-400 transition-colors">Services</Link></li>
                <li><Link to="/marketplace" className="text-gray-400 hover:text-green-400 transition-colors">Marketplace</Link></li>
                <li><Link to="/blog" className="text-gray-400 hover:text-green-400 transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link to="/help" className="text-gray-400 hover:text-green-400 transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-green-400 transition-colors">Contact Us</Link></li>
                <li><Link to="/faq" className="text-gray-400 hover:text-green-400 transition-colors">FAQs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Connect With Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} Farmers Home. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home