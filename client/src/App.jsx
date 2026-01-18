import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Calendar, Upload as UploadIcon, Home as HomeIcon, CheckCircle } from 'lucide-react';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Results from './pages/Results';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        {/* Navigation Bar */}
        <nav className="glass sticky top-0 z-50 px-6 py-4 mx-4 mt-4 mb-8">
          <div className="container flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-2 rounded-lg bg-indigo-600/20 group-hover:bg-indigo-600/30 transition-colors">
                <Calendar className="w-6 h-6 text-indigo-400" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                FFCS <span className="text-indigo-400">Agent</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-secondary hover:text-white transition-colors flex items-center gap-2">
                Home
              </Link>
              <Link to="/upload" className="text-secondary hover:text-white transition-colors flex items-center gap-2">
                Generator
              </Link>
            </div>

            <Link to="/upload" className="btn btn-primary px-5 py-2">
              Get Started
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="section-padding border-t border-white/5 mt-20">
          <div className="container text-center">
            <p className="text-text-muted">
              Built for VIT Students with ❤️
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
