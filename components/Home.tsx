
import React from 'react';
import { motion } from 'framer-motion';
import { Map, Gamepad2, GraduationCap, Trophy, LayoutGrid, ChevronRight } from 'lucide-react';

interface HomeProps {
  onStartGame: (gameId: string) => void;
}

const Home: React.FC<HomeProps> = ({ onStartGame }) => {
  const games = [
    {
      id: 'topo-coco',
      title: 'Topo met Coco',
      description: 'Leer alle provincies en steden van Nederland op een leuke manier!',
      icon: Map,
      color: 'from-[#FFB7B2] to-[#FF9AA2]',
      shadow: 'shadow-[#FFB7B2]/30',
      badge: 'Populair',
      isAvailable: true
    },
    {
      id: 'reken-coco',
      title: 'Rekenen met Coco',
      description: 'Oefen je sommen en word een echte rekenmeester.',
      icon: GraduationCap,
      color: 'from-[#B9FBC0] to-[#98EECC]',
      shadow: 'shadow-[#B9FBC0]/30',
      badge: 'Binnenkort',
      isAvailable: false
    },
    {
      id: 'spelling-coco',
      title: 'Spellen met Coco',
      description: 'Maak geen foutje meer en leer de moeilijkste woorden.',
      icon: LayoutGrid,
      color: 'from-[#A2D2FF] to-[#BDE0FE]',
      shadow: 'shadow-[#A2D2FF]/30',
      badge: 'Binnenkort',
      isAvailable: false
    },
    {
      id: 'quiz-coco',
      title: 'Coco\'s Grote Quiz',
      description: 'Test je algemene kennis in de ultieme uitdaging!',
      icon: Trophy,
      color: 'from-[#CFBAF0] to-[#E2D1F9]',
      shadow: 'shadow-[#CFBAF0]/30',
      badge: 'Ontwikkeling',
      isAvailable: false
    }
  ];

  return (
    <div className="min-h-[100dvh] bg-[#FFF8FA] p-4 md:p-12 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <header className="mb-12 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <div className="flex items-center gap-4 justify-center lg:justify-start mb-4">
              <div className="p-3 bg-pink-100 rounded-2xl">
                <Gamepad2 className="w-8 h-8 text-pink-500" />
              </div>
              <span className="text-pink-400 font-black tracking-widest uppercase text-sm">Welkom bij Coco Games</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-[#5D4E60] mb-6 leading-tight">
              Kies een spel en ga op <span className="text-pink-500 underline decoration-pink-200 decoration-8 underline-offset-8">avontuur!</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl leading-relaxed">
              Speel de leukste leerzame spellen met Coco de papegaai. Leer topografie, rekenen, spelling en nog veel meer!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-none"
          >
            <img 
              src="/images/headertopo.svg" 
              alt="Coco Logo" 
              className="w-48 md:w-80 h-auto animate-bounce-slow"
            />
          </motion.div>
        </header>

        {/* Tiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                disabled={!game.isAvailable}
                onClick={() => onStartGame(game.id)}
                className={`group relative w-full text-left bg-white rounded-[2.5rem] p-8 shadow-xl transition-all border-4 border-transparent overflow-hidden ${
                  game.isAvailable 
                    ? `hover:border-${game.id === 'topo-coco' ? 'pink' : 'green'}-200 cursor-pointer active:scale-[0.98]` 
                    : 'opacity-70 grayscale-[0.5] cursor-not-allowed'
                }`}
              >
                {/* Background Gradient Circle */}
                <div className={`absolute -right-12 -top-12 w-48 h-48 bg-gradient-to-br ${game.color} opacity-10 rounded-full group-hover:scale-110 transition-transform duration-500`} />
                
                <div className="relative flex items-start gap-6">
                  <div className={`flex-none p-5 rounded-3xl bg-gradient-to-br ${game.color} text-white ${game.shadow} shadow-lg group-hover:rotate-6 transition-transform`}>
                    <game.icon className="w-8 h-8 md:w-12 md:h-12" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl md:text-3xl font-black text-[#5D4E60]">{game.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        game.isAvailable ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {game.badge}
                      </span>
                    </div>
                    <p className="text-slate-500 font-medium mb-6 line-clamp-2 md:line-clamp-none">
                      {game.description}
                    </p>
                    
                    {game.isAvailable && (
                      <div className="flex items-center gap-2 text-pink-500 font-black text-sm group-hover:gap-4 transition-all uppercase tracking-widest">
                        <span>Speel dit spel</span>
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Footer info */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-20 text-center pb-12"
        >
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-pink-50">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[#5D4E60] font-bold text-sm">Meer spellen komen er binnenkort bij! 🚀</span>
          </div>
        </motion.footer>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Home;
