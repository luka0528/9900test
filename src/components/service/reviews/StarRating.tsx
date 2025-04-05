import { Star } from "lucide-react";
import React, { useState } from "react";

interface props {
  hoveredRating: number;
  setHoveredRating: (rating: number) => void;
  selectedRating: number;
  setSelectedRating: (rating: number) => void;
}

export default function StarRating(props: props) {
  const { hoveredRating, setHoveredRating, selectedRating, setSelectedRating } =
    props;
  const totalStars = 5;

  const handleMouseEnter = (index: number) => {
    setHoveredRating(index);
  };

  const handleMouseLeave = () => {
    setHoveredRating(0);
  };

  const handleClick = (index: number) => {
    setSelectedRating(index);
  };

  const renderStars = () => {
    return Array.from({ length: totalStars }, (_, index) => {
      const starIndex = index + 1;
      const isSelected = starIndex <= selectedRating;
      const isHovered = starIndex <= hoveredRating;

      return (
        <Star
          key={starIndex}
          onMouseEnter={() => handleMouseEnter(starIndex)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(starIndex)}
          className={`mb-2 h-8 w-8 cursor-pointer stroke-0 transition-colors ${
            isHovered || isSelected ? "fill-yellow-400" : "fill-muted"
          }`}
          aria-hidden="true"
        />
      );
    });
  };

  return <div className="flex">{renderStars()}</div>;
}
