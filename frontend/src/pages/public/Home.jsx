import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const Home = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: "🌦️",
      title: "Agro Climate Intelligence",
      desc: "Leverage AI to analyze weather, soil moisture, and crop health, delivering 95% accurate predictions to optimize planting and irrigation decisions.",
      gradient: "from-green-600 to-emerald-500",
      bgImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
    },
    {
      icon: "🛒",
      title: "E-Commerce Marketplace",
      desc: "Securely trade farm produce with integrated logistics, real-time pricing, and direct payments, connecting farmers to local and global buyers.",
      gradient: "from-emerald-600 to-green-500",
      bgImage: "https://images.unsplash.com/photo-1556740714-a8395b3c6e6d?auto=format&fit=crop&w=800&q=80",
    },
    {
      icon: "🎓",
      title: "Skills Development",
      desc: "Access expert-led online courses and certifications on sustainable farming techniques, boosting productivity and eco-friendly practices.",
      gradient: "from-green-500 to-teal-500",
      bgImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
    },
    {
      icon: "💰",
      title: "Financial Access",
      desc: "Unlock tailored loans, crop insurance, and investment options with low rates, designed to support farm expansion and resilience.",
      gradient: "from-teal-600 to-green-500",
      bgImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80",
    },
    {
      icon: "🏪",
      title: "Market Access",
      desc: "Connect directly with verified global buyers and suppliers, streamlining trade with transparent pricing and efficient supply chains.",
      gradient: "from-green-600 to-lime-500",
      bgImage: "https://images.unsplash.com/photo-1556740738-6b4a5d6b5b5b?auto=format&fit=crop&w=800&q=80",
    },
    {
      icon: "💬",
      title: "Community Hub",
      desc: "Join a global farmer network to share knowledge, collaborate on projects, and access real-time agricultural insights and trends.",
      gradient: "from-emerald-600 to-teal-500",
      bgImage: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80",
    },
  ];

  const services = [
    { icon: "🛒", title: "Marketplace", desc: "Sell directly to buyers, bypassing middlemen." },
    { icon: "🏪", title: "Storage", desc: "Secure storage to minimize post-harvest losses." },
    { icon: "💰", title: "Loans & Sacco", desc: "Affordable financing for farm growth." },
    { icon: "📚", title: "Skills", desc: "Learn cutting-edge farming techniques." },
    { icon: "📢", title: "Broadcasts", desc: "Stay updated with critical farming news." },
  ];

  // Simplified floating background elements
  const FloatingElements = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-10 w-4 h-4 bg-green-400 rounded-full opacity-30"
      />
      <motion.div
        animate={{ y: [10, -10, 10] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-1/3 right-20 w-6 h-6 bg-emerald-400 rounded-full opacity-30"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-emerald-950 to-teal-950 text-white font-sans overflow-hidden relative">
      <style>
        {`
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.9; }
            50% { opacity: 1; }
          }
          .animate-pulse-slow {
            animation: pulse-slow 6s ease-in-out infinite;
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.3); }
          }
          .animate-twinkle {
            animation: twinkle 4s infinite;
          }
        `}
      </style>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-green-950/80 backdrop-blur-xl border-b border-emerald-900/40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <motion.div
              animate={{ rotate: [0, 8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="text-4xl bg-gradient-to-r from-green-500 to-emerald-600 rounded-full p-2 shadow-md"
            >
              🌱
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent tracking-tight">
              Farmers Home
            </h1>
          </motion.div>
          <div className="hidden md:flex gap-8 font-medium text-lg items-center">
            {["Features", "Services", "How It Works"].map((item) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                whileHover={{ scale: 1.05 }}
                className="relative text-gray-200 hover:text-green-400 transition-colors duration-300 group"
              >
                {item}
                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-green-400 group-hover:w-full transition-all duration-300"></span>
              </motion.a>
            ))}
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                to="/register"
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-black font-semibold shadow-lg hover:shadow-green-500/50 transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                to="/user-login"
                className="px-6 py-2.5 rounded-full border-2 border-green-400/50 text-green-300 hover:bg-green-400/20 hover:border-green-400 transition-all duration-300 font-semibold relative overflow-hidden group"
              >
                <span className="relative z-10">Sign In</span>
                <div className="absolute inset-0 bg-green-400/5 group-hover:bg-green-400/15 transition-colors duration-300" />
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 text-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=80')",
            filter: "brightness(0.5) saturate(1.2)",
            transform: `translateY(${scrollY * 0.2}px)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/60 via-emerald-950/70 to-teal-900/80" />
        <FloatingElements />
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-4 mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="text-5xl bg-gradient-to-r from-green-500 to-emerald-600 rounded-full p-3 shadow-xl"
            >
              🌾
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              Empowering Agriculture
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-extrabold leading-tight mb-6 tracking-tight relative"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 via-emerald-400 to-teal-300 relative">
              Revolutionizing
              <motion.span
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -inset-1 bg-gradient-to-r from-green-300 via-emerald-400 to-teal-300 blur-md opacity-20"
              />
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-emerald-400 to-green-300">
              Agriculture
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-6 text-lg sm:text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed"
          >
            Empowering farmers with <span className="text-green-300 font-semibold">AI insights</span>, 
            global market access, and sustainable solutions for the future of farming.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-center gap-6 mt-12"
          >
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                to="/register"
                className="px-10 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold text-lg shadow-xl hover:shadow-green-500/50 transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                to="/user-login"
                className="px-10 py-4 rounded-xl border-2 border-green-400/50 text-green-300 hover:bg-green-400/15 hover:border-green-400 transition-all duration-300 font-semibold relative overflow-hidden group"
              >
                <span className="relative z-10">Sign In</span>
                <div className="absolute inset-0 bg-green-400/5 group-hover:bg-green-400/15 transition-colors duration-300" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="relative py-32 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/50 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative"
        >
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-8 relative">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-emerald-500">
              About Farmers Home
            </span>
            <motion.span
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -inset-1 bg-gradient-to-r from-green-300 to-emerald-500 blur-md opacity-20"
            />
          </h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-24 h-1 bg-gradient-to-r from-green-400 to-emerald-500 mx-auto mb-8"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-green-900/40 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-emerald-800/60 shadow-xl"
        >
          <p className="text-lg sm:text-xl text-gray-200 leading-relaxed">
            <span className="text-green-300 font-semibold">Farmers Home</span> is a transformative platform 
            connecting farmers directly with buyers, storage facilities, and financial services. 
            Our mission is to empower farmers with cutting-edge tools and a global network to grow sustainably 
            and thrive in the modern agricultural landscape.
          </p>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/20 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 relative">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-emerald-500">
              Comprehensive Solutions
            </span>
            <motion.span
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -inset-1 bg-gradient-to-r from-green-300 to-emerald-500 blur-md opacity-20"
            />
          </h2>
          <p className="mt-6 text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto">
            From precision farming to global markets, we provide the tools to elevate your success.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="relative group"
            >
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${f.gradient} rounded-3xl opacity-20 group-hover:opacity-30 transition duration-300`} />
              <div
                className="absolute inset-0 bg-cover bg-center opacity-10 rounded-3xl"
                style={{ backgroundImage: `url('${f.bgImage}')` }}
              />
              <div className="relative bg-green-900/50 backdrop-blur-xl border border-emerald-800/50 rounded-3xl p-8 shadow-xl hover:shadow-green-500/30 transition-all duration-300">
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  className={`text-5xl mb-6 w-16 h-16 rounded-2xl bg-gradient-to-r ${f.gradient} flex items-center justify-center shadow-lg`}
                >
                  {f.icon}
                </motion.div>
                <h3 className="text-2xl font-bold text-green-300 mb-4">{f.title}</h3>
                <p className="text-gray-200 leading-relaxed">{f.desc}</p>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="mt-6 text-green-400 font-semibold flex items-center gap-2"
                >
                  Explore More <span>→</span>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="relative py-32 bg-gradient-to-br from-green-900/50 to-emerald-950/30">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-emerald-500">
                Our Services
              </span>
              <motion.span
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -inset-1 bg-gradient-to-r from-green-300 to-emerald-500 blur-md opacity-20"
              />
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="bg-green-900/60 p-8 rounded-3xl border border-emerald-800/50 backdrop-blur-xl shadow-lg hover:shadow-green-400/30 transition-all duration-300 group"
              >
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  className="text-5xl mb-6 text-green-400"
                >
                  {s.icon}
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                <p className="text-gray-200 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-32 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 relative">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-emerald-500">
              How It Works
            </span>
            <motion.span
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -inset-1 bg-gradient-to-r from-green-300 to-emerald-500 blur-md opacity-20"
            />
          </h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-green-100/20 to-emerald-100/20 rounded-3xl p-8 md:p-12 shadow-xl border border-green-200/30"
        >
          <div className="grid md:grid-cols-2 gap-8 text-gray-800">
            {[
              { step: "1️⃣", title: "Post Your Crops", desc: "Farmers list their produce on our marketplace with photos and details." },
              { step: "2️⃣", title: "Connect with Buyers", desc: "Customers browse and purchase directly from farmers." },
              { step: "3️⃣", title: "Manage Operations", desc: "Get notifications and prepare deliveries efficiently." },
              { step: "4️⃣", title: "Secure Transactions", desc: "Payments and storage managed safely through our platform." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-sm"
              >
                <div className="text-2xl flex-shrink-0">{item.step}</div>
                <div>
                  <h3 className="font-bold text-green-700 text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-700">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative py-32 text-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=2000&q=80')",
            filter: "brightness(0.4)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/60 to-emerald-950/80" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-5xl sm:text-6xl font-extrabold mb-8 relative"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-emerald-500">
              Ready to Transform?
            </span>
            <motion.span
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -inset-1 bg-gradient-to-r from-green-300 to-emerald-500 blur-md opacity-20"
            />
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-lg sm:text-xl text-gray-200 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Join thousands of farmers revolutionizing agriculture with our platform.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row justify-center gap-6"
          >
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                to="/register"
                className="px-12 py-5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold text-lg shadow-xl hover:shadow-green-500/50 transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                to="/user-login"
                className="px-12 py-5 rounded-xl border-2 border-green-400/50 text-green-300 hover:bg-green-400/20 hover:border-green-400 transition-all duration-300 font-semibold relative overflow-hidden group"
              >
                <span className="relative z-10">Sign In</span>
                <div className="absolute inset-0 bg-green-400/5 group-hover:bg-green-400/15 transition-colors duration-300" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-950/90 backdrop-blur-xl border-t border-emerald-900/40 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex items-center gap-3"
            >
              <motion.div
                animate={{ rotate: [0, 8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="text-4xl bg-gradient-to-r from-green-500 to-emerald-600 rounded-full p-2"
              >
                🌱
              </motion.div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                Farmers Home
              </h3>
              <p className="text-gray-200 leading-relaxed mt-4">
                Empowering farmers with innovative tools and global opportunities for a sustainable future.
              </p>
            </motion.div>
            {[
              { title: "Platform", links: ["Marketplace", "AI Insights", "Finance", "Community"] },
              { title: "Company", links: ["About Us", "Careers", "Blog", "Press"] },
              { title: "Support", links: ["Help Center", "Contact", "FAQs", "API Docs"] },
            ].map((col, i) => (
              <motion.div
                key={col.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h4 className="text-lg font-semibold text-green-400 mb-6">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-gray-200 hover:text-green-400 transition-colors py-1 block">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="border-t border-emerald-800/50 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm"
          >
            <p>© {new Date().getFullYear()} Farmers Home. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              {["𝕏", "📘", "📷", "💼"].map((icon) => (
                <motion.a
                  key={icon}
                  href="#"
                  whileHover={{ y: -4 }}
                  className="text-xl text-gray-200 hover:text-green-400 transition-colors"
                >
                  {icon}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default Home;