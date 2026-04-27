import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from './Logo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0F0F1A] border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Logo size="sm" />
            <span className="text-white/60 text-sm">发现独立开发者的宝藏工具</span>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6 text-sm text-white/40">
            <Link to="/" className="hover:text-white transition-colors">
              首页
            </Link>
            <Link to="/category/all" className="hover:text-white transition-colors">
              分类
            </Link>
            <Link to="/join" className="hover:text-white transition-colors">
              入驻
            </Link>
            <Link to="/profile" className="hover:text-white transition-colors">
              我的
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-6"></div>

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 text-sm">
          {/* Copyright */}
          <p className="text-white/40">
            © {currentYear} 虾蛋星球 · 南京市玄武区虾蛋星空网络工作室
          </p>

          {/* ICP and Police Beian */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-white/40">
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              苏ICP备2026024228号-1
            </a>
            <span className="hidden md:inline text-white/20">|</span>
            <span className="flex items-center space-x-1">
              <span className="w-4 h-4 inline-flex items-center justify-center bg-white/10 rounded text-xs">网</span>
              <span>公安备案待完善</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
