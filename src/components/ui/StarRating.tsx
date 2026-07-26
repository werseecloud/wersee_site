import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  className?: string;
  showCount?: boolean;
  count?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 16,
  interactive = false,
  onRate,
  className,
  showCount = false,
  count = 0
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  const handleClick = (value: number) => {
    if (interactive && onRate) {
      onRate(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(null);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {[...Array(maxRating)].map((_, i) => {
          const value = i + 1;
          const isFilled = value <= displayRating;
          const isHalf = !isFilled && value - 0.5 <= displayRating;

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(value)}
              onMouseEnter={() => handleMouseEnter(value)}
              onMouseLeave={handleMouseLeave}
              className={cn(
                "p-0.5 transition-transform",
                interactive ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-default"
              )}
            >
              <Star
                size={size}
                className={cn(
                  "transition-colors",
                  isFilled 
                    ? "fill-amber-400 text-amber-400" 
                    : isHalf 
                      ? "fill-amber-400/50 text-amber-400" 
                      : "text-gray-300"
                )}
              />
            </button>
          );
        })}
      </div>
      
      {showCount && (
        <span className="text-sm font-medium text-gray-500 ml-1">
          {rating.toFixed(1)} <span className="text-gray-400">({count})</span>
        </span>
      )}
    </div>
  );
};
