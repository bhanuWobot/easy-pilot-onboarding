import type { OnboardingConfig } from '../types/onboarding';

/**
 * Generates a shareable link with base64-encoded configuration in the URL hash
 */
export function generateShareableLink(config: OnboardingConfig): string {
  try {
    const jsonString = JSON.stringify(config);
    const base64 = btoa(encodeURIComponent(jsonString));
    return `${window.location.origin}/welcome#config=${base64}`;
  } catch (error) {
    console.error('Error generating shareable link:', error);
    throw new Error('Failed to generate shareable link');
  }
}

/**
 * Parses configuration from URL hash
 */
export function parseConfigFromHash(): OnboardingConfig | null {
  try {
    const hash = window.location.hash;
    const match = hash.match(/config=([^&]+)/);
    
    if (!match) return null;
    
    const decoded = decodeURIComponent(atob(match[1]));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error parsing config from URL hash:', error);
    return null;
  }
}

/**
 * Copies text to clipboard and returns a promise
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}
