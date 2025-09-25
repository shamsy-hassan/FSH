import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const Home = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const stats = [
    { number: "10,000+", label: "Active Farmers", icon: "👨‍🌾" },
    { number: "95%", label: "Satisfaction Rate", icon: "⭐" },
    { number: "50+", label: "Regions Served", icon: "🌍" },
    { number: "24/7", label: "Support Available", icon: "🛡️" },
  ];

  const features = [
    {
      icon: "🌦️",
      title: "Agro Climate Intelligence",
      desc: "AI-powered insights for weather, soil, and crops with 95% accuracy predictions.",
      gradient: "from-blue-500/20 to-cyan-500/20",
    },
    {
      icon: "🛒",
      title: "E-Commerce Marketplace",
      desc: "Trade farm products securely with integrated logistics and payment solutions.",
      gradient: "from-green-500/20 to-emerald-500/20",
    },
    {
      icon: "🎓",
      title: "Skills Development",
      desc: "Learn modern farming techniques with expert-led programs and certifications.",
      gradient: "from-purple-500/20 to-pink-500/20",
    },
    {
      icon: "💰",
      title: "Financial Access",
      desc: "Quick loans, insurance, and investment opportunities tailored for farmers.",
      gradient: "from-yellow-500/20 to-orange-500/20",
    },
    {
      icon: "🏪",
      title: "Market Access",
      desc: "Connect directly with verified buyers and sellers across global markets.",
      gradient: "from-red-500/20 to-rose-500/20",
    },
    {
      icon: "💬",
      title: "Community Hub",
      desc: "Collaborate, share knowledge, and solve problems with a network of farmers.",
      gradient: "from-indigo-500/20 to-purple-500/20",
    },
  ];

  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "Organic Farmer",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
      text: "This platform transformed my farming business. I've doubled my income by connecting directly with buyers.",
      rating: 5,
    },
    {
      name: "Priya Sharma",
      role: "Dairy Farmer",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
      text: "The weather predictions and market insights have been incredibly accurate and helpful for planning.",
      rating: 5,
    },
    {
      name: "Vikram Singh",
      role: "Crop Farmer",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
      text: "Access to loans through this platform helped me expand my operations during difficult times.",
      rating: 4,
    },
  ];

  const StarRating = ({ rating }) => (
    <div className="flex space-x-1">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={i < rating ? "text-yellow-400" : "text-gray-600"}
        >
          ★
        </span>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center scale-110"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1800&q=80')`,
              filter: "blur(1px) brightness(0.4)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-purple-900/30 to-blue-900/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-gray-950/80 to-gray-950" />
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-green-400/30 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-6 max-w-6xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
            className="inline-block mb-6"
          >
            <div className="text-6xl mb-4">🌱</div>
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 via-emerald-400 to-cyan-300 drop-shadow-2xl">
              Farmers Home
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xl md:text-2xl lg:text-3xl text-gray-200 mb-8 max-w-4xl mx-auto leading-relaxed"
          >
            A futuristic hub connecting farmers, markets, and innovation through
            <span className="text-green-300 font-semibold">
              {" "}
              AI-powered intelligence
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-12 flex flex-col sm:flex-row justify-center gap-6"
          >
            <Link
              to="/register"
              className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-600 text-gray-900 font-bold text-lg shadow-2xl hover:shadow-green-500/50 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10">Get Started Free</span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            </Link>

            <Link
              to="/user-login"
              className="px-8 py-4 rounded-2xl border-2 border-green-400/50 text-green-200 hover:bg-green-400/10 hover:border-green-400 backdrop-blur-sm transition-all duration-300 font-semibold group"
            >
              <span className="flex items-center justify-center gap-2">
                Sign In
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </span>
            </Link>
          </motion.div>

          {/* Stats Preview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.7 + index * 0.1 }}
                className="text-center p-4"
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl md:text-3xl font-bold text-green-300">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center text-green-300"
          >
            <span className="text-sm mb-2">Scroll to explore</span>
            <div className="w-6 h-10 border-2 border-green-300 rounded-full flex justify-center">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1 h-3 bg-green-300 rounded-full mt-2"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-cyan-300">
                Smart Farming Solutions
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Revolutionary tools and services designed to empower farmers with
              cutting-edge technology and global market access
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-50`}
                />
                <div className="relative bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-8 h-full group-hover:border-green-400/30 transition-all duration-300">
                  <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-green-300 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.desc}
                  </p>
                  <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-green-400 font-semibold flex items-center gap-2">
                      Learn more
                      <span className="group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-green-900/20 to-gray-950" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds.png')] opacity-5" />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-amber-300">
                Trusted by Farmers
              </span>
            </h2>
            <p className="text-xl text-gray-400">
              Join thousands of successful farmers who transformed their
              businesses
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -5 }}
                className="bg-gray-900/50 backdrop-blur-lg border border-gray-800/50 rounded-3xl p-8 hover:border-green-400/30 transition-all duration-300"
              >
                <StarRating rating={testimonial.rating} />
                <p className="text-gray-300 italic my-6 leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-green-400/50"
                  />
                  <div className="ml-4">
                    <h4 className="font-bold text-green-300">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=2000&q=80')`,
              filter: "brightness(0.3)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/40 via-purple-900/20 to-blue-900/40" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-4xl mx-auto text-center px-6"
        >
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-cyan-300">
              Start Your Journey
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join the agricultural revolution today. Access smart tools, global
            markets, and a supportive community.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12">
            <Link
              to="/register"
              className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-600 text-gray-900 font-bold text-lg shadow-2xl hover:shadow-green-500/50 transition-all duration-300"
            >
              <span className="relative z-10">Create Free Account</span>
            </Link>
            <Link
              to="/about"
              className="px-8 py-4 rounded-2xl border-2 border-white/20 text-white hover:border-green-400 hover:bg-green-400/10 backdrop-blur-sm transition-all duration-300 font-semibold"
            >
              Explore Platform
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { icon: "🚀", label: "Quick Setup" },
              { icon: "💳", label: "No Credit Card" },
              { icon: "⭐", label: "Free Forever" },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-sm text-gray-400">{item.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900/50 backdrop-blur-xl border-t border-gray-800/50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
                🌱 Farmers Home
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Empowering farmers with cutting-edge technology and global
                market access for a sustainable future.
              </p>
            </div>

            {[
              {
                title: "Platform",
                links: [
                  "Marketplace",
                  "Weather Intelligence",
                  "Financial Services",
                  "Learning Hub",
                ],
              },
              {
                title: "Company",
                links: ["About Us", "Careers", "Press", "Contact"],
              },
              {
                title: "Support",
                links: ["Help Center", "Community", "API Docs", "Status"],
              },
            ].map((column, index) => (
              <div key={column.title}>
                <h4 className="text-lg font-semibold text-white mb-4">
                  {column.title}
                </h4>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-green-400 transition-colors duration-200"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800/50 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Farmers Home. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              {["Twitter", "Facebook", "Instagram", "LinkedIn"].map(
                (social) => (
                  <a
                    key={social}
                    href="#"
                    className="text-gray-400 hover:text-green-400 transition-colors duration-200"
                  >
                    {social}
                  </a>
                ),
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;