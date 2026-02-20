'use client';

import { useRouter as useNextRouter } from 'next/navigation';
import { useCallback } from 'react';

export const useRouter = () => {
  const { push: pushRouter, replace: replaceRouter, ...rest } = useNextRouter();
  // const [ loaderCounter, setLoaderCounter ] = useState(0);
  
  const push = useCallback(async (url: string) => {
    // setLoaderCounter(prevState => prevState + 1);
    const result = await pushRouter(url);
    // setLoaderCounter(prevState => prevState - 1);
    return result;
  }, [ pushRouter ]);
  
  const replace = useCallback(async (url: string) => {
    // setLoaderCounter(prevState => prevState + 1);
    const result = await replaceRouter(url);
    // setLoaderCounter(prevState => prevState - 1);
    return result;
  }, [ replaceRouter ]);
  
  return { push, replace, isLoadingRoute: false, /*!!loaderCounter,*/ ...rest };
};
