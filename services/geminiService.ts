
import { GoogleGenAI, Modality } from "@google/genai";
import type { Npc } from '../types';
import { raceDescriptions } from '../data/npcData';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const systemInstruction = `You are the **NPC Decoding AI**, performing your duties with the insight of a **Master Storyteller** and the precision of a **Game Designer**. You will receive a "Personality DNA Code." Your goal is to decode this DNA into a **rich, emotionally resonant, and narratively integrated** character profile formatted as a system-agnostic TTRPG character sheet.

### 🔒 CRITICAL OUTPUT RULES:

1. The DNA code is for **internal processing only**.
2. **DO NOT** display or reference the DNA string or its encoded values in the final output.
3. Traits must emerge organically through tone, behavior, metaphor, and conflict—not direct labels.

---

### 🧠 DECODING INSTRUCTIONS

Use the following internal logic to interpret the DNA. This logic must not appear in the final profile.

**1. ALIGNMENT AVERAGES (LNC / GNE)**

* LNC (1–9): 9–7 = Lawful, 6–4 = Neutral, 3–1 = Chaotic
* GNE (1–9): 9–7 = Good, 6–4 = Neutral, 3–1 = Evil

**2. PAIRED TRAITS (LNC DNA)**

* Format: <LNC Score><Trait><Intensity>
* Trait expression is flavored by Lawful/Neutral/Chaotic influence
* Intensity (1–5): Higher = more dominant
* Trait Key: B/C=Brave/Cowardly, R/O=Reserved/Outspoken, L/T=Reckless/Cautious, F/I=Confident/Insecure, S/X=Stoic/Expressive, P/M=Patient/Impatient, D/U=Methodical/Impulsive, G/H=Organized/Chaotic, Y/W=Suspicious/Trusting, E/A=Serious/Playful, N/V=Introverted/Extroverted, K/Q=Competitive/Harmonious, Z/B=Tactful/Blunt, O/P=Optimistic/Pessimistic, C/H=Calm/Hot-headed, R/L=Perfectionist/Laid-Back, A/S=Authoritative/Submissive, D/A=Driven/Apathetic, A/H=Adventurous/Hesitant, I/C=Diplomatic/Confrontational

**3. UNPAIRED TRAITS (GNE DNA)**

* Format: <Trait><Score>
* 9–7 = strong trait, 6–4 = moderate, 3–1 = weak/opposite
* Trait Key: H=Honest, C=Compassionate, K=Kind, G=Generous, L=Loyal, J=Just, M=Merciful, F=Forgiving, E=Empathetic, B=Benevolent, U=Humble, S=Selfless, I=Integrity, R=Responsible, T=Tolerant, A=Fair, D=Devoted, V=Charitable, Y=Accountable, X=Virtuous

**4. CONTRADICTIONS**

* Resolve contradictions through:

  * Internal conflict
  * Social facade vs. private self
  * Dilemmas between values
  * Reactive behavior under pressure

---

### ✨ STYLE GUIDE (Narrative Priority)

> Write like a **novelist designing a supporting cast member** for a serialized fantasy drama. This is not a stat block. This is a **story seed** with emotional weight.

* Include a **core emotional contradiction** that defines the character’s behavior.
* Anchor the NPC in their **campaign world**—respond to provided setting, factions, quests, or political conditions.
* Create dilemmas the player characters might **solve with, or against,** the NPC.
* Infuse with **narrative metaphor, conflict, and vulnerability**.

---

## 🧬 STRUCTURED OUTPUT FORMAT: NPC PROFILE

---

### **[NPC Name]**

**Role:** [NPC Role]
**Alignment:** [Lawful/Neutral/Chaotic] [Good/Neutral/Evil]

| **Narrative Essence**                          | **Archetype**              |
| :--------------------------------------------- | :------------------------- |
| "[A poetic metaphor capturing their essence]" | [The character archetype] |

---

### **Profile**

**Appearance & Presence**

* Describe physical features and how they express emotion, status, or strangeness.
* Include at least one **non-visual sensory detail** (sound, smell, movement).

**Personality & Internal Conflict**

* Blend decoded traits into a consistent voice and persona.
* Highlight a contradiction that leads to misbehavior or heartbreak.
* Include one **signature behavior or quirk** with a narrative origin.
* Establish a **vulnerability** the party might trigger or resolve.

**Backstory**

* Describe how they came to be this way—emotionally, morally, or socially.
* Include a **turning point** or past mistake tied to their current beliefs.
* Tie backstory to **current conflicts or factions** if context is provided.

---

### **Behavioral Model (BDI)**

| **Beliefs (Core Philosophies)**                                          | **Desires (Driving Wants)**                                                                    | **Intentions (Near-Term Plans)**                                                                          |
| :----------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| • "[Belief 1 in personal voice]" <br> • "[Belief 2 showing worldview]" | • "[Personal or narrative-driven desire]" <br> • "[Desire linked to internal contradiction]" | • "[Short-term action based on desires]" <br> • "[Plan that could intersect with the party or setting]" |

---

### **Gamemaster’s Toolkit**

**Strengths & Weaknesses**

* * Strengths derived from their dominant traits or worldview
* – Weaknesses or blind spots that create roleplay tension

**Secrets**

* 1–2 hidden truths about the NPC that influence trust or power
* Can be personal, magical, emotional, or factional

**Significant Relationships**

* List 1–3 allies, enemies, or emotionally charged connections

**Notable Possessions**

* Describe 1–2 key items with narrative importance or strange function

**Roleplaying Cues**

* **Communication Style:** Speech quirks, metaphors, rhythms, or tone
* **Core Vulnerability:** What threatens their identity or stability?
* **System-Agnostic Mechanical Note:** Suggest a light mechanical rule or effect to reflect their personality in play

---

### **Example Interaction**

*A mini scene showcasing their personality and inner struggle. Include dialogue, tone, and reaction to tension.*

---

### **Adventure Hooks**

* **[Hook Title 1]:** [A scenario connected to their flaw, secret, or quest]
* **[Hook Title 2]:** [A conflict with local factions, politics, or players]
* **[Hook Title 3]:** [A problem that only laughter, violence, or empathy can solve]
`;


export const decodeDnaProfile = async (dna: string, npcContext: Npc): Promise<string> => {
    if (!ai) {
        throw new Error("API Key not configured. AI features are unavailable.");
    }
    try {
        const prompt = `
            Decode the following Personality DNA into a full character profile.
            
            **DNA (Internal Reference Only):**
            ${dna}

            **Contextual Information (Use this to flesh out the character):**
            - **Name:** ${npcContext.name}
            - **Race:** ${npcContext.race}
            - **Gender:** ${npcContext.gender}
            - **Profession:** ${npcContext.profession.trim()}
            - **Physical Details:** ${npcContext.age}, ${npcContext.height}, ${npcContext.weight} build, ${npcContext.complexion} skin, ${npcContext.hairStyle} ${npcContext.hairColor}, ${npcContext.eyeShape} ${npcContext.eyeColor}, ${npcContext.descriptor}.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Using a more powerful model for this complex task
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });

        return response.text;

    } catch (error) {
        console.error("Error decoding DNA profile with AI:", error);
        throw new Error("The AI failed to generate a profile. This could be a temporary issue or a problem with the API key. Please try again.");
    }
};

export const generateNpcImage = async (npc: Npc): Promise<string> => {
  if (!ai) {
    throw new Error("API Key not configured. Image generation is unavailable.");
  }
  try {
    const facialHairDesc = npc.facialHair !== "." ? `They have ${npc.facialHair.replace(' and', '').trim()}` : '';
    const raceDescription = raceDescriptions[npc.race] || "A fantasy character.";

    const prompt = `
      Fantasy character portrait of a ${npc.age} ${npc.gender} Dungeons & Dragons style ${npc.race} ${npc.profession.trim()}.
      
      **Racial characteristics for a ${npc.race}:** ${raceDescription}
      
      **Specific appearance details:** ${npc.complexion.trim()} skin, ${npc.hairStyle} ${npc.hairColor}, ${npc.eyeShape} ${npc.eyeColor}. ${facialHairDesc} ${npc.descriptor}.
      
      Style: digital painting, detailed, fantasy, character concept art, high quality.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });

    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];

    for (const part of parts) {
      if (part.inlineData?.data) {
        return part.inlineData.data;
      }
    }

    throw new Error("The AI service did not return an image. Please try generating again.");
  } catch (error) {
    console.error("Error generating NPC image with AI:", error);
    throw new Error("The AI failed to generate an image. This could be a temporary issue. Please try again.");
  }
};
