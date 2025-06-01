import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

export default function Navbar() {
  return (
    <nav className="shadow-sm px-6 py-5 md:px-10">
      <div className="flex items-center justify-between">
        {/* Logo + Title + Tab */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-4">
            <Image src="/client_manager.png" width={56} height={56} alt="ico" />
            <h1 className="text-3xl font-bold text-[#E0F7F7]">Client Manager</h1>
          </Link>

         
        </div>

        {/* Mobile Menu Placeholder */}
        <div className="md:hidden">{/* Mobile menu icon */}</div>
      </div>
    </nav>
  );
}
