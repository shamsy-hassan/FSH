import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
import Home from "./pages/public/Home";
import AdminLogin from "./pages/public/AdminLogin";
import UserLogin from "./pages/public/UserLogin";
import Register from "./pages/public/Register";


// User pages
import Dashboard from "./pages/user/Dashboard";
import AgroClimate from "./pages/user/AgroClimate";
import ECommerce from "./pages/user/ECommerce";
import MyMarket from "./pages/user/MyMarket";
import MyOrders from "./pages/user/MyOrders";
import Sacco from "./pages/user/Sacco";
import Skills from "./pages/user/Skills";
import MyStore from "./pages/user/MyStore";
import Communicate from "./pages/user/Communicate";
import Profile from "./pages/user/Profile";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageAgroClimate from "./pages/admin/ManageAgroClimate";
import ManageECommerce from "./pages/admin/ManageECommerce";
import ManageMarket from "./pages/admin/ManageMarket";
import ManageOrders from "./pages/admin/ManageOrders";
import ManageSacco from "./pages/admin/ManageSacco";
import ManageSkills from "./pages/admin/ManageSkills";
import ManageStore from "./pages/admin/ManageStore";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/user-login" element={<UserLogin />} />
          <Route path="/register" element={<Register />} />
          

          {/* User Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/user/dashboard" element={<Dashboard />} />
              <Route path="/user/agro-climate" element={<AgroClimate />} />
              <Route path="/user/ecommerce" element={<ECommerce />} />
              <Route path="/user/my-market" element={<MyMarket />} />
              <Route path="/user/my-orders" element={<MyOrders />} />
              <Route path="/user/sacco" element={<Sacco />} />
              <Route path="/user/skills" element={<Skills />} />
              <Route path="/user/my-store" element={<MyStore />} />
              <Route path="/user/communicate" element={<Communicate />} />
              <Route path="/user/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute adminOnly={true} />}>
            <Route element={<Layout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/manage-users" element={<ManageUsers />} />
              <Route path="/admin/manage-agro-climate" element={<ManageAgroClimate />} />
              <Route path="/admin/manage-ecommerce" element={<ManageECommerce />} />
              <Route path="/admin/manage-market" element={<ManageMarket />} />
              <Route path="/admin/manage-orders" element={<ManageOrders />} />
              <Route path="/admin/manage-sacco" element={<ManageSacco />} />
              <Route path="/admin/manage-skills" element={<ManageSkills />} />
              <Route path="/admin/manage-store" element={<ManageStore />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;