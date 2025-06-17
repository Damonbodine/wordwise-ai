"use client";

import * as React from "react";

function HomePage() {
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>WordWise AI - Debug Mode</h1>
      <p style={{ color: '#666', marginBottom: '15px' }}>
        If you can see this page, the basic Next.js routing is working!
      </p>
      <p style={{ color: '#666', marginBottom: '15px' }}>
        Current time: {new Date().toISOString()}
      </p>
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3>Deployment Status: ✅ Working</h3>
        <p>Next.js app is successfully deployed and rendering on Vercel.</p>
      </div>
    </div>
  );
}

export default function Home() {
  return <HomePage />;
} 