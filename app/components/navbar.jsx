// components/navbar.js
'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';

export default function Navbar({ userNameForDisplay, onLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className="shadow-sm px-6 py-5 md:px-10 bg-gray-800">
      <div className="flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-4">
            {/* Logo Image */}
            <Image
              src="/client_manager.png"
              width={56} // Base width, overridden by responsive classes
              height={56} // Base height, overridden by responsive classes
              alt="Client Manager Icon"
              // Responsive sizing: w-8 h-8 (32px) on small screens, md:w-14 md:h-14 (56px) on medium and larger
              className="w-8 h-8 md:w-14 md:h-14"
            />
            <h1 className="text-3xl font-bold text-[#E0F7F7]">Client Manager</h1>
          </Link>
        </div>

        {/* User Info and Logout */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-2 text-[#E0F7F7] hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            aria-haspopup="true"
            aria-expanded={showDropdown ? "true" : "false"}
          >
            {/* Display user's name */}
            <span className="text-lg font-medium">{userNameForDisplay}</span>
            <svg className={`w-4 h-4 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20">
              <button
                onClick={() => {
                  onLogout();
                  setShowDropdown(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}