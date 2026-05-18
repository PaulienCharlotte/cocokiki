
import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Game from './components/Game';
import AdminDashboard from './components/AdminDashboard';

const App: React.FC = () => {
  const [view, setView] = useState<'game' | 'admin'>(() =>
    window.location.hash === '#admin' ? 'admin' : 'game'
  );

  return (
    <AuthProvider>
      {view === 'admin'
        ? <AdminDashboard onExit={() => { window.location.hash = ''; setView('game'); }} />
        : <Game />
      }
    </AuthProvider>
  );
};

export default App;
