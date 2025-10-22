import React, { useState, useCallback, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateNpc } from './services/npcGenerator';
import { decodeDnaProfile, generateNpcImage } from './services/geminiService';
import { generatePersonalityDna } from './services/dnaGenerator';
import { NpcCard } from './components/NpcCard';
import { Button } from './components/Button';
import { Spinner } from './components/Spinner';
import type { Npc } from './types';

function App() {
  const [npc, setNpc] = useState<Npc | null>(null);
  const [npcProfile, setNpcProfile] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [dna, setDna] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

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

      const errors: string[] = [];

      if (profileResult.status === 'fulfilled') {
        setNpc(baseNpc);
        setDna(personalityDna);
        setNpcProfile(profileResult.value);
      } else {
        console.error('Failed to generate NPC profile:', profileResult.reason);
        errors.push('Failed to generate NPC profile. Please try again.');
      }

      if (imageResult.status === 'fulfilled') {
        setImageUrl(imageResult.value);
      } else {
        console.error('Failed to generate NPC image:', imageResult.reason);
        errors.push('The portrait could not be generated. Please try again.');
      }

      if (errors.length) {
        setError(errors.join(' '));
      }
    } catch (err) {
      console.error('Failed to generate NPC profile and/or image:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during generation.');
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
    } finally {
      setIsImageLoading(false);
    }
  }, [npc]);

  const handleDownloadPdf = useCallback(async () => {
    if (!npcCardRef.current || !npc) return;
    setIsDownloadingPdf(true);
    try {
      const canvas = await html2canvas(npcCardRef.current, {
        backgroundColor: '#1e293b',
        scale: 2,
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasAspectRatio = canvas.width / canvas.height;
      const margin = 10;

      let imgWidth = pdfWidth - margin * 2;
      let imgHeight = imgWidth / canvasAspectRatio;

      if (imgHeight > pdfHeight - margin * 2) {
        imgHeight = pdfHeight - margin * 2;
        imgWidth = imgHeight * canvasAspectRatio;
      }

      const xOffset = (pdfWidth - imgWidth) / 2;
      const yOffset = (pdfHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      pdf.save(`npc-profile-${npc.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      setError('Unable to download the NPC profile as a PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
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
          <Button onClick={handleDownloadPdf} variant="secondary" disabled={isDownloadingPdf}>
            {isDownloadingPdf ? <><Spinner /> <span>Downloading...</span></> : 'Download PDF'}
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

export default App;