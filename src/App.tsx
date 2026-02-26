/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import InterviewSession from './components/InterviewSession';
import { motion } from 'motion/react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">O</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Orient IA</h1>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-indigo-600 transition-colors">Accueil</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Simulateur</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">À propos</a>
          </nav>
        </div>
      </header>

      <main className="py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Simulateur d'Entretien Intelligent</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Entraînez-vous avec notre recruteur IA avancé. Recevez des feedbacks en temps réel et améliorez vos performances d'entretien.
          </p>
        </motion.div>

        <InterviewSession />
      </main>
      
      <footer className="bg-white border-t border-slate-200 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; 2026 Orient IA. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

