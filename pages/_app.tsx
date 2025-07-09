import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Check API health on app start
    const checkApiHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const result = await response.json();
        
        if (!result.apiKeyConfigured) {
          console.warn('⚠️ Stability AI API key not configured. Please set STABILITY_API_KEY in your .env.local file.');
        }
      } catch (error) {
        console.error('Health check failed:', error);
      }
    };

    checkApiHealth();
  }, []);

  return <Component {...pageProps} />
} 