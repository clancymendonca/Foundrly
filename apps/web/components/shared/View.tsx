'use client';

import React, { useEffect, useState, useRef } from 'react';
import Ping from './Ping';
import CountUp from 'react-countup';

const View = ({ id }: { id: string }) => {
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const hasIncremented = useRef(false);

  // Initial fetch of views
  useEffect(() => {
    const fetchViews = async () => {
      try {
        const res = await fetch(`/api/views?id=${id}`);
        if (!res.ok) {
          console.error('Failed to fetch views:', res.statusText);
          return;
        }

        const data = await res.json();
        setTotalViews(data.views);
      } catch (error) {
        console.error('Error fetching views:', error);
      }
    };

    fetchViews();
  }, [id]);

  // Increment views only once
  useEffect(() => {
    const incrementViews = async () => {
      if (hasIncremented.current) return;
      // Prevent double increment in the same session for this id
      if (typeof window !== 'undefined') {
        const key = `viewed_${id}`;
        if (sessionStorage.getItem(key)) {
          hasIncremented.current = true;
          return;
        }
      }
      try {
        const res = await fetch(`/api/views?id=${id}`, { method: 'POST' });
        if (!res.ok) {
          console.error('Failed to update views:', res.statusText);
          return;
        }

        const data = await res.json();
        if (data.success) {
          setTotalViews(data.views);
          hasIncremented.current = true;
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`viewed_${id}`, 'true');
          }
        }
      } catch (error) {
        console.error('Error updating views:', error);
      }
    };

    incrementViews();
  }, [id]);

  return (
    <div className='view-container'>
      <div className="absolute -top-2 -right-2">
        <Ping />
      </div>
      <p className="view-text">
        <span className="font-black">
          Views: {totalViews !== null ? (
            <CountUp end={totalViews} duration={1} />
          ) : (
            <svg className="animate-spin h-5 w-5 inline text-gray-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
        </span>
      </p>
    </div>
  );
};

export default View;
