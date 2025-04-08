import React from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: number;
  color?: string;
}

const MAX_STAR_RATING = 5;

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 32,
}) => {
  const normalizedRating = Math.max(0, Math.min(rating, MAX_STAR_RATING));

  return (
    <div className="flex items-center">
      {[...Array(MAX_STAR_RATING)].map((_, index) => {
        const fillPercentage =
          Math.min(Math.max(normalizedRating - index, 0), 1) * 100;

        return (
          <div key={index} className="relative">
            <Star size={size} className="text-gray-300" strokeWidth={1.5} />

            <div
              className="absolute left-0 top-0 overflow-hidden"
              style={{ width: `${fillPercentage}%` }}
            >
              <Star
                size={size}
                className="text-yellow-400"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth={1.5}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
