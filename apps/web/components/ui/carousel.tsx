'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarouselProps {
  children: React.ReactNode[];
  className?: string;
  itemsPerView?: number;
  showDots?: boolean;
  showArrows?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  externalControls?: boolean;
  onPrevClick?: () => void;
  onNextClick?: () => void;
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
}

export function Carousel({
  children,
  className,
  itemsPerView = 3,
  showDots = true,
  showArrows = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  externalControls = false,
  onPrevClick,
  onNextClick,
  currentIndex: externalCurrentIndex,
  onIndexChange,
}: CarouselProps) {
  const [internalCurrentIndex, setInternalCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const totalItems = children.length;
  const maxIndex = Math.max(0, totalItems - itemsPerView);
  
  // Use external index if provided, otherwise use internal state
  const currentIndex = externalControls && externalCurrentIndex !== undefined ? externalCurrentIndex : internalCurrentIndex;
  const setCurrentIndex = externalControls && onIndexChange ? onIndexChange : setInternalCurrentIndex;

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const newIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const newIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
    setCurrentIndex(newIndex);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Handle external control clicks
  const handlePrevClick = () => {
    if (externalControls && onPrevClick) {
      onPrevClick();
    } else {
      prevSlide();
    }
  };

  const handleNextClick = () => {
    if (externalControls && onNextClick) {
      onNextClick();
    } else {
      nextSlide();
    }
  };

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || totalItems <= itemsPerView) return;

    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, totalItems, itemsPerView]);

  if (totalItems === 0) return null;

  return (
    <div className={cn('relative w-full', className)}>
      {/* Carousel Container */}
      <div className="overflow-hidden">
        <div
          ref={containerRef}
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${(currentIndex * 100) / itemsPerView}%)`,
          }}
        >
          {children.map((child, index) => (
            <div
              key={index}
              className="flex-shrink-0 px-3"
              style={{ width: `${100 / itemsPerView}%` }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows - Only show if not using external controls */}
      {showArrows && totalItems > itemsPerView && !externalControls && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="absolute -left-16 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg border-2"
            onClick={handlePrevClick}
            disabled={isTransitioning}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="absolute -right-16 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg border-2"
            onClick={handleNextClick}
            disabled={isTransitioning}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && totalItems > itemsPerView && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-colors duration-200',
                index === currentIndex
                  ? 'bg-blue-600'
                  : 'bg-gray-300 hover:bg-gray-400'
              )}
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
            />
          ))}
        </div>
      )}
    </div>
  );
}
