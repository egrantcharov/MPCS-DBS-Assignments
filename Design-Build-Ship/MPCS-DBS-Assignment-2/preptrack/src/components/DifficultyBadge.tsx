import { Difficulty } from '@/context/types';
import { cn, getDifficultyColor } from '@/lib/utils';

export default function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={cn(
        'px-2.5 py-0.5 rounded-full text-xs font-medium',
        getDifficultyColor(difficulty)
      )}
    >
      {difficulty}
    </span>
  );
}
