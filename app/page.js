// pages/index.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Clients from "./components/clients";
import Hero from "./components/hero";
import Navbar from "./components/navbar";
import Transactions from "./components/transactions";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  // **CHANGED:** Renamed from `username` to `displayName` or similar for clarity
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem('user_username');
      // **CRITICAL CHANGE:** Retrieve 'user_name' from localStorage
      const storedName = localStorage.getItem('user_name');

      // Check if both username (for auth internal check) and name (for display) exist
      if (storedUsername && storedName) {
        setIsAuthenticated(true);
        setDisplayName(storedName); // Set the user's *name* for display
      } else {
        router.push('/login');
      }
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_username');
      localStorage.removeItem('user_name'); // Clear the user's name from localStorage
      localStorage.removeItem('user_type');
      setIsAuthenticated(false);
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
        <p>Loading application...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      {/* **CRITICAL CHANGE:** Pass `displayName` (which is the user's `name`) to the Navbar */}
      <Navbar userNameForDisplay={displayName} onLogout={handleLogout} />
      <Hero/>
      <div className="flex flex-col md:flex-row gap-4 px-4 mt-6">
        <Clients />
        <Transactions />
      </div>
    </div>
  );
}