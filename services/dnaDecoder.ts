// services/dnaDecoder.ts

export interface DecodedDna {
    alignment: {
        lnc: string;
        gne: string;
        lncScore: number;
        gneScore: number;
    };
    pairedTraits: {
        name: string;
        score: number;
        intensity: number;
        influence: string;
        pair: string;
    }[];
    unpairedTraits: {
        name: string;
        score: number;
        strength: string;
    }[];
}

const lncTraitMap: { name1: string; name2: string }[] = [
    { name1: 'Brave', name2: 'Cowardly' },
    { name1: 'Reserved', name2: 'Outspoken' },
    { name1: 'Reckless', name2: 'Cautious' },
    { name1: 'Confident', name2: 'Insecure' },
    { name1: 'Stoic', name2: 'Expressive' },
    { name1: 'Patient', name2: 'Impatient' },
    { name1: 'Methodical', name2: 'Impulsive' },
    { name1: 'Organized', name2: 'Chaotic' },
    { name1: 'Suspicious', name2: 'Trusting' },
    { name1: 'Serious', name2: 'Playful' },
    { name1: 'Introverted', name2: 'Extroverted' },
    { name1: 'Competitive', name2: 'Harmonious' },
    { name1: 'Tactful', name2: 'Blunt' },
    { name1: 'Optimistic', name2: 'Pessimistic' },
    { name1: 'Calm', name2: 'Hot-headed' },
    { name1: 'Perfectionist', name2: 'Laid-Back' },
    { name1: 'Authoritative', name2: 'Submissive' },
    { name1: 'Driven', name2: 'Apathetic' },
    { name1: 'Adventurous', name2: 'Hesitant' },
    { name1: 'Diplomatic', name2: 'Confrontational' },
];

const lncTraitKeys: [string, string][] = [
    ["B", "C"], ["R", "O"], ["L", "T"], ["F", "I"], ["S", "X"],
    ["P", "M"], ["D", "U"], ["G", "H"], ["Y", "W"], ["E", "A"],
    ["N", "V"], ["K", "Q"], ["Z", "B"], ["O", "P"], ["C", "H"],
    ["R", "L"], ["A", "S"], ["D", "A"], ["A", "H"], ["I", "C"]
];

const gneTraitMap: { [key: string]: string } = {
    H: 'Honest', C: 'Compassionate', K: 'Kind', G: 'Generous', L: 'Loyal',
    J: 'Just', M: 'Merciful', F: 'Forgiving', E: 'Empathetic', B: 'Benevolent',
    U: 'Humble', S: 'Selfless', I: 'Integrity', R: 'Responsible', T: 'Tolerant',
    A: 'Fair', D: 'Devoted', V: 'Charitable', Y: 'Accountable', X: 'Virtuous'
};

const getLncAlignment = (score: number) => {
    if (score >= 7) return 'Lawful';
    if (score >= 4) return 'Neutral';
    return 'Chaotic';
};

const getGneAlignment = (score: number) => {
    if (score >= 7) return 'Good';
    if (score >= 4) return 'Neutral';
    return 'Evil';
};

const getGneStrength = (score: number) => {
    if (score >= 7) return 'Strong';
    if (score >= 4) return 'Moderate';
    return 'Weak/Opposite';
};

export const decodeDna = (dna: string): DecodedDna | null => {
    try {
        const match = dna.match(/\((\d+)\/(\d+)\) (.*) - (.*)/);
        if (!match) return null;

        const [, lncAvg, gneAvg, lncPart, gnePart] = match;
        const lncAverage = parseInt(lncAvg, 10);
        const gneAverage = parseInt(gneAvg, 10);

        const lncTraitsRaw = lncPart.split(',');
        const gneTraitsRaw = gnePart.split(',');

        const pairedTraits = lncTraitsRaw.map((trait, index) => {
            const score = parseInt(trait[0], 10);
            const key = trait[1];
            const intensity = parseInt(trait[2], 10);
            
            const [key1, key2] = lncTraitKeys[index];
            const { name1, name2 } = lncTraitMap[index];

            const traitName = (key === key1) ? name1 : name2;
            const pairName = `${name1} / ${name2}`;

            return {
                name: traitName,
                score: score,
                intensity: intensity,
                influence: getLncAlignment(score),
                pair: pairName
            };
        });

        const unpairedTraits = gneTraitsRaw.map((trait) => {
            const key = trait[0];
            const score = parseInt(trait.substring(1), 10);
            
            return {
                name: gneTraitMap[key] || 'Unknown',
                score: score,
                strength: getGneStrength(score)
            };
        });

        return {
            alignment: {
                lnc: getLncAlignment(lncAverage),
                gne: getGneAlignment(gneAverage),
                lncScore: lncAverage,
                gneScore: gneAverage
            },
            pairedTraits,
            unpairedTraits
        };
    } catch (error) {
        console.error("Failed to decode DNA string:", error);
        return null;
    }
};