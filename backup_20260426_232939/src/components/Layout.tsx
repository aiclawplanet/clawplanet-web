import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Footer } from './Footer';
import { EarthBackground } from './EarthBackground';

export function Layout() {
  return (
    <div className="min-h-screen text-white relative">
      <EarthBackground />
      <Header />
      <main className="pb-20 relative z-10">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
