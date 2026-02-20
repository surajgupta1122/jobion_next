"use client";
import React from 'react';
import CandidateHeader from './CandidateHeader.jsx';
import ErrorBoundary from '../../ErrorBoundary';
import { ToastContainer } from '../../toast';

/**
 * Candidate Layout - For user/candidate dashboard pages
 * Includes Header for navigation
 */
const CandidateLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      <CandidateHeader />
      <main className="flex-1">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <ToastContainer />
    </div>
  );
};

export default CandidateLayout;

