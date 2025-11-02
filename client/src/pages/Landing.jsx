import React, { useState, useContext } from "react";
import {
  Package,
  Calendar,
  Smartphone,
  CheckCircle,
  Menu,
  X,
  Snowflake,
  XCircle,
} from "lucide-react";
import Navbar from "../components/Navbar";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import dashboard from "../assets/dashboard.png";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/auth/login", { email, password });
      // data should contain token and user info
      login(data);
    } catch (error) {
      setErr(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-cyan-50 to-blue-100 relative">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-linear-to-br from-cyan-200 to-blue-500 rounded-lg flex items-center justify-center">
                <Snowflake className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-800">CoolTrack</span>
            </a>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#hero"
                className="text-gray-600 hover:text-cyan-600 transition-colors"
              >
                Home
              </a>
              <a
                href="#features"
                className="text-gray-600 hover:text-cyan-600 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-600 hover:text-cyan-600 transition-colors"
              >
                How it Works?
              </a>
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-linear-to-r from-cyan-500 to-blue-500 text-white px-6 py-2 rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Login
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-3">
              <a
                href="#hero"
                className="block text-gray-700 hover:text-cyan-600"
              >
                Home
              </a>
              <a
                href="#features"
                className="block text-gray-600 hover:text-cyan-600"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block text-gray-600 hover:text-cyan-600"
              >
                How it Works?
              </a>
              <button
                onClick={() => {
                  setShowLoginModal(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-linear-to-r from-cyan-500 to-blue-500 text-white px-6 py-2 rounded-full"
              >
                Login
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="hero"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24"
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
              Your Path to
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">
                Smarter AC Services
              </span>
              <br />& Stock Control
            </h1>
            <p className="text-lg text-gray-600 max-w-md">
              Effortless Job & Inventory
              <br />
              for Modern Technicians
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-linear-to-r from-cyan-500 to-blue-500 text-white px-8 py-3 rounded-full hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium">
                Learn More
              </button>
              <button className="border-2 border-cyan-500 text-cyan-600 px-8 py-3 rounded-full hover:bg-cyan-50 transition-all duration-200 font-medium">
                Try for Free
              </button>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 gap-6 pt-8">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-white rounded-lg shadow-md flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-cyan-500" />
                </div>
                <h3 className="font-semibold text-gray-800">Job Management</h3>
                <p className="text-sm text-gray-600">
                  Planning for tasks of Management's for extra business
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-white rounded-lg shadow-md flex items-center justify-center">
                  <Package className="w-6 h-6 text-cyan-500" />
                </div>
                <h3 className="font-semibold text-gray-800">
                  Inventory Tracking
                </h3>
                <p className="text-sm text-gray-600">
                  Management, Sustainable lods to Trade in Technicians
                </p>
              </div>
            </div>
          </div>

          {/* Hero Image/Illustration */}
          <div className="relative">
            <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
              <div className="bg-white rounded-2xl shadow-2xl p-4 backdrop-blur-sm">
                <img
                  src={dashboard}
                  alt="Dashboard Preview"
                  className="rounded-xl w-full object-cover"
                />
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-cyan-200 rounded-full opacity-50 animate-pulse"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-200 rounded-full opacity-50 animate-pulse delay-100"></div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section
        id="features"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-12">
          Key Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Admin Panel */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Admin Panel
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-cyan-500 shrink-0" />
                <span>Dashboard</span>
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-cyan-500 shrink-0" />
                <span>Job Orders</span>
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-cyan-500 shrink-0" />
                <span>Technicians</span>
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-cyan-500 shrink-0" />
                <span>Inventory</span>
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-cyan-500 shrink-0" />
                <span>Reports</span>
              </li>
            </ul>
          </div>

          {/* Technician Panel */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Technician Panel
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-cyan-500 shrink-0" />
                <span>Job Orders</span>
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-cyan-500 shrink-0" />
                <span>Technicians</span>
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-cyan-500 shrink-0" />
                <span>Job Requests</span>
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-cyan-500 shrink-0" />
                <span>Inventory View</span>
              </li>
            </ul>
          </div>

          {/* Testimonial */}
          <div className="bg-linear-to-br from-cyan-50 to-blue-50 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 md:col-span-2 lg:col-span-1">
            <div className="text-4xl text-cyan-500 mb-3">"</div>
            <p className="text-gray-700 mb-4 italic">
              CoolTrack transformed our workflow! Managing jobs{" "}
              <span className="font-semibold">Slow</span> a now a now a breeze.
            </p>
            <p className="text-cyan-600 font-medium">
              – Juan D., AC Business Owner
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-white rounded-full shadow-lg mx-auto flex items-center justify-center">
              <Calendar className="w-10 h-10 text-cyan-500" />
            </div>
            <h3 className="font-bold text-gray-800">Create & Assign Job</h3>
          </div>
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-white rounded-full shadow-lg mx-auto flex items-center justify-center">
              <Smartphone className="w-10 h-10 text-cyan-500" />
            </div>
            <h3 className="font-bold text-gray-800">
              Technician Updates Stock & Reports
            </h3>
          </div>
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-white rounded-full shadow-lg mx-auto flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-cyan-500" />
            </div>
            <h3 className="font-bold text-gray-800">Automated Stock</h3>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Company</h3>
              <p className="text-gray-400 text-sm">To follow up</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Features</h3>
              <p className="text-gray-400 text-sm">Dashboard</p>
              <p className="text-gray-400 text-sm">Job Order Management</p>
              <p className="text-gray-400 text-sm">Technicians Management</p>
              <p className="text-gray-400 text-sm">Inventory Management</p>
              <p className="text-gray-400 text-sm">Reports</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Contact</h3>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            © 2025 CoolTrack. All rights reserved.
          </div>
        </div>
      </footer>

      {/* === LOGIN MODAL === */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-1000 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
            >
              <XCircle className="w-6 h-6" />
            </button>

            {/* Content */}
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-linear-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Snowflake className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Welcome Back
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Log in to your CoolTrack account
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={submit} className="space-y-5">
                {err && <div className="text-red-600 text-sm mb-2">{err}</div>}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-linear-to-r from-cyan-500 to-blue-500 text-white py-2 rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  Log In
                </button>

                <p className="text-center text-gray-500 text-sm mt-4">
                  Don’t have an account?{" "}
                  <a
                    href="#"
                    className="text-cyan-600 hover:underline font-medium"
                  >
                    Sign up
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
