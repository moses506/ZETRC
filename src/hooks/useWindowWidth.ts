import { useEffect, useState } from 'react';

function getWindowWidth() {
  return typeof window === 'undefined' ? 0 : window.innerWidth;
}

function useWindowWidth() {
  const [width, setWidth] = useState(getWindowWidth());

  useEffect(() => {
    const handleResize = () => setWidth(getWindowWidth());

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

export default useWindowWidth;
