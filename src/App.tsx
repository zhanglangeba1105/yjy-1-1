import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { Toaster } from '@/components/ui/Toaster';
import { useAppStore } from '@/store/useAppStore';

export default function App() {
  const initialize = useAppStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
