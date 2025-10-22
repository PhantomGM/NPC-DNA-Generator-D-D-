import React, { forwardRef, useMemo, useState } from 'react';
import type { Npc } from '../types';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { decodeDna } from '../services/dnaDecoder';

interface ParsedProfileContent {
  name: string;
  role: string;
  alignment: string;
  narrativeEssence?: string;
  archetype?: string;
  appearance?: string;
  personality?: string;
  backstory?: string;
  bdi?: string;
  strengthsWeaknesses?: string;
  secrets?: string;
  relationships?: string;
  possessions?: string;
  roleplayingCues?: string;
  interaction?: string;
  hooks?: string;
}

interface ParsedProfileError {
  error: true;
  raw: string;
  name?: string;
}

type ParsedProfile = ParsedProfileContent | ParsedProfileError;

const isParsedProfileError = (profile: ParsedProfile | null): profile is ParsedProfileError => {
  return Boolean(profile && 'error' in profile && profile.error);
};

// Helper components for rendering parsed markdown content

// Renders blocks of text, handling simple lists and emphasis
const SectionContent: React.FC<{ text?: string }> = React.memo(({ text }) => {
  if (!text) return <p className="text-slate-500 italic">Not available.</p>;

  return (
    <div className="space-y-3 text-slate-300 font-light">
      {text.split('\n').map((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine === '') return null;

        // List items
        if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('– ') || trimmedLine.startsWith('• ')) {
          return (
            <div key={index} className="flex items-start">
              <span className="mr-3 text-amber-500 mt-1">{trimmedLine.charAt(0)}</span>
              <p className="flex-1">{trimmedLine.substring(2)}</p>
            </div>
          );
        }

        // Simple paragraphs
        return <p key={index}>{trimmedLine}</p>;
      })}
    </div>
  );
});

// Renders a markdown table
const MarkdownTable: React.FC<{ markdown?: string }> = React.memo(({ markdown }) => {
    if (!markdown?.trim()) return null;

    const lines = markdown.trim().split('\n');
    const separatorIndex = lines.findIndex(line => line.includes('---') && line.includes('|'));

    if (separatorIndex < 1) { // Must be at least a header row before separator
        return <SectionContent text={markdown} />;
    }

    const headerLine = lines[separatorIndex - 1];
    const bodyLines = lines.slice(separatorIndex + 1);

    if (!headerLine.includes('|')) {
        return <SectionContent text={markdown} />;
    }

    const parseRow = (rowLine: string): string[] => {
        const parts = rowLine.split('|');
        // Handles `| cell1 | cell2 |` format by removing empty first and last elements
        if (parts.length > 2 && parts[0].trim() === '' && parts[parts.length - 1].trim() === '') {
            return parts.slice(1, -1).map(c => c.trim());
        }
        return parts.map(c => c.trim());
    };

    const headers = parseRow(headerLine).map(h => h.replace(/\*\*/g, ''));
    const rows = bodyLines
        .filter(line => line.includes('|'))
        .map(rowLine => parseRow(rowLine));
    
    if (headers.length === 0) return <SectionContent text={markdown} />;

    return (
        <div className="overflow-x-auto -mx-4">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr>
                        {headers.map((header, i) => (
                            <th key={i} className="border-b-2 border-slate-600 p-3 text-amber-400 font-bold uppercase tracking-wider text-sm">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className="border-b border-slate-700">
                            {row.map((cell, j) => (
                                <td key={j} className="p-3 align-top">
                                    <SectionContent text={cell.replace(/<br>/g, '\n')} />
                                </td>
                            ))}
                            {/* Pad cells if row is shorter than header */}
                            {Array.from({ length: Math.max(0, headers.length - row.length) }).map((_, k) => <td key={row.length + k} className="p-3 align-top" />)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});


// Section wrapper
const ProfileSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h4 className="text-xl font-bold text-amber-500 border-b-2 border-amber-800/50 pb-2 mb-3">{title}</h4>
    {children}
  </div>
);

// Tab component
const Tab: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-bold transition-colors duration-200 focus:outline-none rounded-t-lg ${
            active
                ? 'bg-slate-700 text-amber-400'
                : 'bg-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`}
        role="tab"
        aria-selected={active}
    >
        {children}
    </button>
);


interface NpcCardProps {
  npc: Npc;
  profile: string; // The full markdown profile
  imageUrl: string | null;
  isImageLoading: boolean;
  onGenerateImage: () => void;
  dna: string;
}

export const NpcCard = forwardRef<HTMLDivElement, NpcCardProps>(({
  npc,
  profile,
  imageUrl,
  isImageLoading,
  onGenerateImage,
  dna,
}, ref) => {
  const [activeTab, setActiveTab] = useState('profile');

  const parsedProfile = useMemo<ParsedProfile | null>(() => {
    if (!profile) return null;

    const parsed: ParsedProfileContent = {
      name: npc.name,
      role: '',
      alignment: '',
      narrativeEssence: '',
      archetype: '',
      appearance: '',
      personality: '',
      backstory: '',
      bdi: '',
      strengthsWeaknesses: '',
      secrets: '',
      relationships: '',
      possessions: '',
      roleplayingCues: '',
      interaction: '',
      hooks: '',
    };

    try {
        const allHeaders = [
            "Appearance & Presence", "Personality & Internal Conflict", "Backstory",
            "Behavioral Model (BDI)", "Strengths & Weaknesses",
            "Secrets", "Significant Relationships", "Notable Possessions", "Roleplaying Cues",
            "Example Interaction", "Adventure Hooks"
        ];

        // Find the start of the first content section to isolate the header block
        let firstSectionIndex = profile.length;
        for (const headerText of ["Profile", ...allHeaders]) {
            const escapedText = headerText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(^|\\n)\\s*(?:#+\\s*)?(?:\\*\\*)?${escapedText}(?:\\*\\*)?`, 'i');
            const match = profile.match(regex);
            if (match && match.index! < firstSectionIndex) {
                firstSectionIndex = match.index!;
            }
        }

        const headerBlock = profile.substring(0, firstSectionIndex).trim();

        // --- 1. Parse the top-level header block ---
        parsed.name = headerBlock.match(/^(?:#+\s*)?\*\*(.*?)\*\*/)?.[1]?.trim() || npc.name;
        parsed.role = headerBlock.match(/\*\*Role:\*\* (.*?)\n/)?.[1]?.trim() || '';
        parsed.alignment = headerBlock.match(/\*\*Alignment:\*\* (.*?)\n/)?.[1]?.trim() || '';

        const tableRegex = /\|.*?\n\|[ -:|]+?\n\|(.*?)\|(.*?)\|/s; // 's' flag for dotall
        const tableMatch = headerBlock.match(tableRegex);
        if (tableMatch) {
            parsed.narrativeEssence = tableMatch[1]?.trim().replace(/["\[\]]/g, '') || '';
            parsed.archetype = tableMatch[2]?.trim().replace(/["\[\]]/g, '') || '';
        }

        // --- 2. Parse all content sections in a single pass ---
        const contentBlock = profile.substring(firstSectionIndex);
        const sectionMap: Record<string, string> = {};

        const headerLocations = allHeaders.map(headerText => {
            const key = headerText.toLowerCase()
                .replace(/\s&\s/g, ' ')
                .replace(/[\s-]+/g, '_')
                .replace(/[()]/g, '');
            const escapedText = headerText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(^|\\n)\\s*(?:#+\\s*)?(?:\\*\\*)?${escapedText}(?:\\*\\*)?`, 'i');
            const match = contentBlock.match(regex);

            return {
                key,
                header: headerText,
                index: match ? match.index! : -1,
                headerLength: match ? match[0].length : 0
            };
        })
        .filter(h => h.index !== -1)
        .sort((a, b) => a.index - b.index);

        for (let i = 0; i < headerLocations.length; i++) {
            const currentHeader = headerLocations[i];
            const nextHeader = headerLocations[i + 1];

            const start = currentHeader.index + currentHeader.headerLength;
            const end = nextHeader ? nextHeader.index : contentBlock.length;

            sectionMap[currentHeader.key] = contentBlock.substring(start, end).trim();
        }

        // --- 3. Assign parsed content directly from the map ---
        parsed.appearance = sectionMap.appearance_presence;
        parsed.personality = sectionMap.personality_internal_conflict;
        parsed.backstory = sectionMap.backstory;
        parsed.bdi = sectionMap.behavioral_model_bdi;
        parsed.strengthsWeaknesses = sectionMap.strengths_weaknesses;
        parsed.secrets = sectionMap.secrets;
        parsed.relationships = sectionMap.significant_relationships;
        parsed.possessions = sectionMap.notable_possessions;
        parsed.roleplayingCues = sectionMap.roleplaying_cues;
        parsed.interaction = sectionMap.example_interaction;
        parsed.hooks = sectionMap.adventure_hooks;

    } catch (e) {
      console.error("Failed to parse NPC profile markdown.", e);
      return { error: true, raw: profile };
    }

    // A final check to ensure something was parsed
    if (Object.values(parsed).filter(v => typeof v === 'string' && v.length > 10).length < 3) {
      console.warn("Parsing may have failed to extract enough content.", parsed);
      // We don't return an error here anymore to allow partial rendering
    }

    return parsed;
  }, [profile, npc.name]);

  const decodedDna = useMemo(() => {
    if (!dna) return null;
    return decodeDna(dna);
  }, [dna]);

  if (!parsedProfile) {
    return null; // Or some loading/error state
  }

  if (isParsedProfileError(parsedProfile)) {
    // Fallback for parsing errors
    return (
        <div ref={ref} className="bg-slate-800 text-slate-300 rounded-lg shadow-2xl p-6 md:p-8 border border-slate-700 w-full max-w-5xl mx-auto font-serif">
            <h3 className="text-red-500 font-bold text-xl mb-4">Error Parsing AI Profile</h3>
            <p className="text-slate-400 mb-4">The AI response did not follow the expected format. Displaying raw text for debugging:</p>
            <pre className="whitespace-pre-wrap bg-slate-900 p-4 rounded-md text-sm">{parsedProfile.raw}</pre>
        </div>
    );
  }

  return (
    <div ref={ref} className="bg-slate-800/50 backdrop-blur-sm text-slate-300 rounded-lg shadow-2xl p-6 md:p-8 border border-slate-700 w-full max-w-6xl mx-auto font-serif">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Vitals & Portrait */}
        <div className="lg:col-span-4 flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold text-amber-400 mb-4 tracking-wide">{parsedProfile.name}</h2>
            <div className="w-full max-w-sm h-auto aspect-square bg-slate-700 rounded-md mb-4 flex items-center justify-center overflow-hidden border-2 border-slate-600 shadow-lg">
                {isImageLoading ? (
                <Spinner />
                ) : imageUrl ? (
                <img src={`data:image/png;base64,${imageUrl}`} alt={parsedProfile.name} className="w-full h-full object-cover" />
                ) : (
                <div className="text-slate-500 text-center p-4">
                    <p className="text-lg">No Portrait</p>
                    <p className="text-sm mt-2">Click below to generate one.</p>
                </div>
                )}
            </div>
            <Button onClick={onGenerateImage} disabled={isImageLoading} variant="secondary" className="flex items-center justify-center w-full max-w-sm">
                {isImageLoading ? <><Spinner /> <span>Creating Portrait...</span></> : (imageUrl ? 'Re-generate Portrait' : 'Create Portrait')}
            </Button>
            <div className="mt-6 w-full text-left bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <div className="space-y-1">
                    <p><strong className="text-slate-400 font-semibold w-24 inline-block">Role:</strong> {parsedProfile.role || 'N/A'}</p>
                    <p><strong className="text-slate-400 font-semibold w-24 inline-block">Profession:</strong> {npc.profession.trim()}</p>
                    <p><strong className="text-slate-400 font-semibold w-24 inline-block">Demeanor:</strong> {npc.demeanor.trim()}</p>
                    <p><strong className="text-slate-400 font-semibold w-24 inline-block">Alignment:</strong> {parsedProfile.alignment || 'N/A'}</p>
                    <p><strong className="text-slate-400 font-semibold w-24 inline-block">Archetype:</strong> {parsedProfile.archetype || 'N/A'}</p>
                    <p><strong className="text-slate-400 font-semibold w-24 inline-block">Race:</strong> {npc.race}</p>
                    <p><strong className="text-slate-400 font-semibold w-24 inline-block">Gender:</strong> {npc.gender}</p>
                    <p><strong className="text-slate-400 font-semibold w-24 inline-block">Age:</strong> {npc.age}</p>
                    <p><strong className="text-slate-400 font-semibold w-24 inline-block">Height:</strong> {npc.height}</p>
                    <p><strong className="text-slate-400 font-semibold w-24 inline-block">Build:</strong> {npc.weight.trim()}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-amber-200/80 italic text-center">"{parsedProfile.narrativeEssence || '...'}"</p>
                </div>
            </div>
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-8">
            <div className="border-b border-slate-700 mb-4">
                <nav className="-mb-px flex space-x-2" aria-label="Tabs">
                    <Tab active={activeTab === 'profile'} onClick={() => setActiveTab('profile')}>Profile</Tab>
                    <Tab active={activeTab === 'behavior'} onClick={() => setActiveTab('behavior')}>Behavior</Tab>
                    <Tab active={activeTab === 'gm_toolkit'} onClick={() => setActiveTab('gm_toolkit')}>GM Toolkit</Tab>
                    <Tab active={activeTab === 'story'} onClick={() => setActiveTab('story')}>Story Hooks</Tab>
                    <Tab active={activeTab === 'dna'} onClick={() => setActiveTab('dna')}>DNA Profile</Tab>
                </nav>
            </div>

            <div className="mt-4">
                {activeTab === 'profile' && (
                    <div>
                        <ProfileSection title="Appearance & Presence"><SectionContent text={parsedProfile.appearance} /></ProfileSection>
                        <ProfileSection title="Personality & Internal Conflict"><SectionContent text={parsedProfile.personality} /></ProfileSection>
                        <ProfileSection title="Backstory"><SectionContent text={parsedProfile.backstory} /></ProfileSection>
                    </div>
                )}
                {activeTab === 'behavior' && (
                    <div>
                         <ProfileSection title="Behavioral Model (BDI)"><MarkdownTable markdown={parsedProfile.bdi} /></ProfileSection>
                         <ProfileSection title="Core Motivation (Generated)">
                            <SectionContent text={`* **Wants/Needs:** ${npc.wantsOrNeed}\n* **Secret/Obstacle:** ${npc.secretOrObstacle}`} />
                        </ProfileSection>
                    </div>
                )}
                {activeTab === 'gm_toolkit' && (() => {
                    const carryingText = npc.alsoCarrying.map(item => `* ${item}`).join('\n');
                    return (
                        <div>
                            <ProfileSection title="Strengths & Weaknesses"><SectionContent text={parsedProfile.strengthsWeaknesses} /></ProfileSection>
                            <ProfileSection title="Secrets"><SectionContent text={parsedProfile.secrets} /></ProfileSection>
                            <ProfileSection title="Significant Relationships"><SectionContent text={parsedProfile.relationships} /></ProfileSection>
                            <ProfileSection title="Notable Possessions (AI)"><SectionContent text={parsedProfile.possessions} /></ProfileSection>
                            <ProfileSection title="Inventory & Currency (Generated)">
                                <SectionContent text={carryingText} />
                                <div className="flex flex-wrap gap-3 mt-3">
                                    <span className="font-mono bg-yellow-900/50 text-yellow-300 px-2 py-1 rounded">GP: {npc.gold}</span>
                                    <span className="font-mono bg-slate-600/50 text-slate-300 px-2 py-1 rounded">SP: {npc.silver}</span>
                                    <span className="font-mono bg-orange-900/50 text-orange-400 px-2 py-1 rounded">CP: {npc.copper}</span>
                                </div>
                            </ProfileSection>
                            <ProfileSection title="Roleplaying Cues"><SectionContent text={parsedProfile.roleplayingCues} /></ProfileSection>
                        </div>
                    );
                })()}
                 {activeTab === 'story' && (
                    <div>
                        <ProfileSection title="Example Interaction"><SectionContent text={parsedProfile.interaction} /></ProfileSection>
                        <ProfileSection title="Adventure Hooks"><SectionContent text={parsedProfile.hooks} /></ProfileSection>
                    </div>
                )}
                {activeTab === 'dna' && decodedDna && (
              <div>
                <ProfileSection title="Personality DNA Analysis">
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 font-mono text-amber-300 text-sm mb-6 break-all">
                    {dna}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-bold text-slate-300 mb-2">Alignment Averages</h5>
                      <p className="text-slate-400"><strong>{decodedDna.alignment.lnc} ({decodedDna.alignment.lncScore}/9):</strong> Law vs Chaos</p>
                      <p className="text-slate-400"><strong>{decodedDna.alignment.gne} ({decodedDna.alignment.gneScore}/9):</strong> Good vs Evil</p>
                    </div>
                  </div>
                </ProfileSection>

                <ProfileSection title="Paired Traits (LNC)">
                  <div className="space-y-4">
                    {decodedDna.pairedTraits.map((trait, index) => {
                      const [trait1, trait2] = trait.pair.split(' / ');
                      return (
                        <div key={index} className="bg-slate-900/30 p-3 rounded-md">
                          <div className="flex justify-between items-center text-lg">
                            <span className={trait.name === trait1 ? 'font-bold text-amber-400' : 'text-slate-500'}>{trait1}</span>
                            <span className="text-slate-600 font-sans text-sm">vs</span>
                            <span className={trait.name === trait2 ? 'font-bold text-amber-400' : 'text-slate-500'}>{trait2}</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2">
                             <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: `${trait.intensity * 20}%` }}></div>
                          </div>
                           <p className="text-xs text-slate-500 mt-1 text-right">Intensity: {trait.intensity}/5, Influence: {trait.influence}</p>
                        </div>
                      );
                    })}
                  </div>
                </ProfileSection>

                <ProfileSection title="Unpaired Traits (GNE)">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {decodedDna.unpairedTraits.map((trait, index) => (
                      <div key={index} className="bg-slate-900/30 p-3 rounded-md">
                        <p className="font-semibold text-slate-300">{trait.name}</p>
                        <p className="text-sm text-slate-400">Strength: <span className="font-bold">{trait.strength} ({trait.score}/9)</span></p>
                      </div>
                    ))}
                  </div>
                </ProfileSection>
              </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
});