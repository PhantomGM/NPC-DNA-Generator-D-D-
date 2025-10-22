import React, { useState, useCallback, useRef } from 'react';
import { generateNpc } from './services/npcGenerator';
import { decodeDnaProfile, generateNpcImage } from './services/geminiService';
import { generatePersonalityDna } from './services/dnaGenerator';
import { NpcCard } from './components/NpcCard';
import { Button } from './components/Button';
import { Spinner } from './components/Spinner';
import type { Npc } from './types';

// FIX: Changed to a named export to address module resolution issues.
export function App() {
  const [npc, setNpc] = useState<Npc | null>(null);
  const [npcProfile, setNpcProfile] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [dna, setDna] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const npcCardRef = useRef<HTMLDivElement>(null);

  const handleGenerateProfile = useCallback(async () => {
    setIsProfileLoading(true);
    setError(null);
    setNpc(null);
    setNpcProfile(null);
    setImageUrl(null);
    setDna(null);

    try {
      const baseNpc = generateNpc();
      const personalityDna = generatePersonalityDna();

      const [profileResult, imageResult] = await Promise.allSettled([
        decodeDnaProfile(personalityDna, baseNpc),
        generateNpcImage(baseNpc),
      ]);

      // The profile is essential. If it fails, we can't proceed.
      if (profileResult.status === 'rejected') {
        console.error('Failed to generate NPC profile:', profileResult.reason);
        // Throw the specific reason to be displayed to the user.
        throw profileResult.reason;
      }

      // Profile succeeded, so we can set the main state.
      setNpc(baseNpc);
      setDna(personalityDna);
      setNpcProfile(profileResult.value);

      // Now handle the image result, which is non-essential.
      if (imageResult.status === 'fulfilled') {
        setImageUrl(imageResult.value);
      } else {
        console.error('Failed to generate NPC image:', imageResult.reason);
        // Set an error for the user, but we will still show the profile.
        setError('The character profile was created, but the portrait could not be generated.');
        setImageUrl(null); // Ensure image is cleared.
      }
    } catch (err) {
      console.error('Failed to generate NPC:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during generation.');
      // Clear all state on a critical failure
      setNpc(null);
      setNpcProfile(null);
      setImageUrl(null);
      setDna(null);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  const handleGenerateImage = useCallback(async () => {
    if (!npc) return;
    setIsImageLoading(true);
    setError(null);
    
    try {
      const generatedImageUrl = await generateNpcImage(npc);
      setImageUrl(generatedImageUrl);
    } catch (err) {
      console.error('Failed to generate image:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setImageUrl(null); // Clear image on failure
    } finally {
      setIsImageLoading(false);
    }
  }, [npc]);

  const handleDownloadHtml = useCallback(() => {
    if (!npcCardRef.current || !npc) return;
    setIsDownloading(true);

    try {
      // 1. Clone the card element to avoid modifying the live DOM.
      const cardElement = npcCardRef.current.cloneNode(true) as HTMLElement;

      // 2. Find and remove the "Re-generate Portrait" button from the cloned element.
      const buttonToRemove = cardElement.querySelector('[data-download-remove="true"]');
      if (buttonToRemove) {
          buttonToRemove.remove();
      }

      // 3. Get the raw HTML of the modified clone.
      const cardHtml = cardElement.outerHTML;

      // 4. This script will be embedded in the downloaded file to make the tabs interactive.
      const script = 'const tabs = document.querySelectorAll(\'[role="tab"]\');\n' +
        'const tabPanels = document.querySelectorAll(\'[role="tabpanel"]\');\n' +
        'const inactiveClasses = \'bg-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200\';\n' +
        'const activeClasses = \'bg-slate-700 text-amber-400\';\n' +
        'const baseClasses = \'px-4 py-2 text-sm font-bold transition-colors duration-200 focus:outline-none rounded-t-lg\';\n' +
        'function switchTab(clickedTab) {\n' +
        '  tabs.forEach(tab => {\n' +
        '    tab.setAttribute(\'aria-selected\', \'false\');\n' +
        '    tab.className = baseClasses + \' \' + inactiveClasses;\n' +
        '  });\n' +
        '  tabPanels.forEach(panel => {\n' +
        '    panel.hidden = true;\n' +
        '  });\n' +
        '  clickedTab.setAttribute(\'aria-selected\', \'true\');\n' +
        '  clickedTab.className = baseClasses + \' \' + activeClasses;\n' +
        '  const controlledPanel = document.getElementById(clickedTab.getAttribute(\'aria-controls\'));\n' +
        '  if (controlledPanel) {\n' +
        '    controlledPanel.hidden = false;\n' +
        '  }\n' +
        '}\n' +
        'tabs.forEach(tab => {\n' +
        '  tab.addEventListener(\'click\', (e) => switchTab(e.currentTarget));\n' +
        '});\n' +
        'if (tabs.length > 0) {\n' +
        '  switchTab(tabs[0]);\n' +
        '}\n';

      // 5. Define the SVG icon as a string and URL-encode it for the data URI.
      const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 8.5V15.5L12 22L22 15.5V8.5L12 2Z"></path><line x1="2" y1="8.5" x2="12" y2="12"></line><line x1="22" y1="8.5" x2="12" y2="12"></line><line x1="12" y1="2" x2="12" y2="12"></line><line x1="12" y1="22" x2="12" y2="12"></line><line x1="2" y1="15.5" x2="12" y2="12"></line><line x1="22" y1="15.5" x2="12" y2="12"></line></svg>`;
      const faviconUrlEncoded = `data:image/svg+xml,${svgIcon.replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23').replace(/"/g, "'")}`;

      // 6. Construct the full HTML document string, including the embedded icon.
      const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${npc.name} - NPC Profile</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="icon" href="${faviconUrlEncoded}">
        <style>
          body {
            background-color: #0f172a; /* bg-slate-900 */
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 2rem;
            min-height: 100vh;
            font-family: sans-serif;
          }
        </style>
      </head>
      <body>
        ${cardHtml}
        <script>${script}</script>
      </body>
      </html>`;

      // 7. Create a Blob and trigger the download.
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `npc-profile-${npc.name.replace(/\s+/g, '_')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Failed to generate HTML file:", error);
        setError("Unable to download the NPC profile. Please try again.");
    } finally {
        setIsDownloading(false);
    }
}, [npc]);

  return (
    <div className="bg-slate-900 min-h-screen text-white font-sans p-4 md:p-8 flex flex-col items-center">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-amber-500 mb-2">NPC DNA Decoder</h1>
        <p className="text-lg md:text-xl text-slate-400">Crafting deep, narrative-driven characters from a genetic code.</p>
      </header>
      
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative max-w-4xl w-full text-left mb-6 flex justify-between items-center" role="alert">
          <div>
            <strong className="font-bold">An error occurred: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1" aria-label="Close">
            <svg className="fill-current h-6 w-6 text-red-400 hover:text-red-200 transition-colors" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </button>
        </div>
      )}

      <div className="mb-8 flex flex-wrap gap-4 justify-center">
        <Button onClick={handleGenerateProfile} variant="primary" disabled={isProfileLoading}>
          {isProfileLoading ? <><Spinner /> <span>Decoding DNA...</span></> : 'Generate NPC Profile'}
        </Button>
        {npc && (
          <Button onClick={handleDownloadHtml} variant="secondary" disabled={isDownloading}>
            {isDownloading ? <><Spinner /> <span>Downloading...</span></> : 'Download Character Sheet'}
          </Button>
        )}
      </div>

      <main className="w-full flex justify-center">
        {isProfileLoading && (
          <div className="text-center text-slate-400 flex flex-col items-center">
            <Spinner />
            <p className="mt-2">Decoding personality DNA and crafting narrative...</p>
          </div>
        )}
        {npc && npcProfile && dna && !isProfileLoading && (
          <NpcCard
            ref={npcCardRef}
            npc={npc}
            profile={npcProfile}
            imageUrl={imageUrl}
            isImageLoading={isImageLoading}
            onGenerateImage={handleGenerateImage}
            dna={dna}
          />
        )}
        {!npc && !isProfileLoading && (
          <div className="text-center text-slate-500 max-w-md">
            <p>Click the button to generate your first fully-realized NPC from a unique personality DNA code!</p>
          </div>
        )}
      </main>

      <footer className="mt-auto pt-8 text-center text-slate-500 text-sm">
        <p>Built with React, TypeScript, and the Google Gemini API.</p>
      </footer>
    </div>
  );
}