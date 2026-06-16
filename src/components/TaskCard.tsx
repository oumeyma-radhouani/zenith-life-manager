// src/components/TaskCard.tsx

// 1. Define the exact data this component is allowed to accept (TypeScript)
interface TaskCardProps {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  xpReward: number;
}

// 2. The Component Function
export default function TaskCard({ title, difficulty, xpReward }: TaskCardProps) {
  
  // A quick dynamic styling trick based on difficulty
  const difficultyColor = 
    difficulty === 'Easy' ? 'text-green-400' : 
    difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between hover:border-indigo-500 transition-colors duration-300">
      
      {/* Left Side: Task Info */}
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className={`text-sm font-semibold mt-1 ${difficultyColor}`}>
          {difficulty}
        </p>
      </div>

      {/* Right Side: Rewards & Action */}
      <div className="flex flex-col items-end">
        <span className="text-indigo-400 font-bold text-lg">+{xpReward} XP</span>
        <button className="mt-2 text-xs bg-zinc-800 hover:bg-indigo-600 text-white px-4 py-1.5 rounded transition-all duration-200">
          Complete
        </button>
      </div>

    </div>
  );
}