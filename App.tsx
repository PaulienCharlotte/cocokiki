
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Home from './components/Home';
import Game from './components/Game';

type View = 'home' | 'topo-coco';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');

  const handleStartGame = (gameId: string) => {
    if (gameId === 'topo-coco') {
      setCurrentView('topo-coco');
    }
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen bg-[#FFF8FA]">
      <AnimatePresence mode="wait">
        {currentView === 'home' ? (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Home onStartGame={handleStartGame} />
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5, type: "spring", damping: 25, stiffness: 120 }}
            className="h-screen w-full"
          >
            <Game onBackToHome={handleBackToHome} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
