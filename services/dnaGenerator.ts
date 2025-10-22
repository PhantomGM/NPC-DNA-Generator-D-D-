// services/dnaGenerator.ts

// LNC traits (Paired Traits)
const lncTraits: [string, string][] = [
    ["B", "C"], ["R", "O"], ["L", "T"], ["F", "I"], ["S", "X"],
    ["P", "M"], ["D", "U"], ["G", "H"], ["Y", "W"], ["E", "A"],
    ["N", "V"], ["K", "Q"], ["Z", "B"], ["O", "P"], ["C", "H"],
    ["R", "L"], ["A", "S"], ["D", "A"], ["A", "H"], ["I", "C"]
];

// GNE traits (Unpaired Traits)
const gneTraits: string[] = [
    "H", "C", "K", "G", "L", "J", "M", "F", "E", "B", "U", "S", "I", "R", "T", "A", "D", "V", "Y", "X"
];

const getRandomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const generatePersonalityDna = (): string => {
    // Generate LNC DNA
    const lncDna: string[] = [];
    const lncScores: number[] = [];
    for (const pair of lncTraits) {
        const chosenTrait = pair[getRandomInt(0, 1)];
        const lncScore = getRandomInt(1, 9);
        const intensity = getRandomInt(1, 5);
        lncScores.push(lncScore);
        lncDna.push(`${lncScore}${chosenTrait}${intensity}`);
    }

    // Generate GNE DNA
    const gneDna: string[] = [];
    const gneScores: number[] = [];
    for (const trait of gneTraits) {
        const gneScore = getRandomInt(1, 9);
        gneScores.push(gneScore);
        gneDna.push(`${trait}${gneScore}`);
    }

    // Calculate averages
    const lncAverage = Math.round(lncScores.reduce((a, b) => a + b, 0) / lncScores.length);
    const gneAverage = Math.round(gneScores.reduce((a, b) => a + b, 0) / gneScores.length);

    // Combine into final string
    return `(${lncAverage}/${gneAverage}) ${lncDna.join(',')} - ${gneDna.join(',')}`;
};
