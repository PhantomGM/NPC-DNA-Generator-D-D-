
import type { Npc } from '../types';
import * as npcData from '../data/npcData';

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const setGender = (): string => getRandomItem(npcData.genders);
const setRace = (): string => getRandomItem(npcData.races);

const setName = (gender: string, race: string): string => {
  let firstName: string;
  let lastName: string;

  const getFirstName = (nameList: { male: string[]; female: string[] }) => {
    return getRandomItem(nameList[gender as keyof typeof nameList]);
  };
  
  switch (race) {
    case 'Human':
      firstName = getFirstName(npcData.humanFirstNames);
      lastName = getRandomItem(npcData.humanLastNames);
      break;
    case 'Elf':
      firstName = getFirstName(npcData.elfFirstNames);
      lastName = getRandomItem(npcData.elfLastNames);
      break;
    case 'Dwarf':
      firstName = getFirstName(npcData.dwarfFirstNames);
      lastName = getRandomItem(npcData.dwarfLastNames);
      break;
    case 'Halfling':
      firstName = getFirstName(npcData.halflingFirstNames);
      lastName = getRandomItem(npcData.halflingLastNames);
      break;
    case 'Gnome':
      firstName = getFirstName(npcData.gnomeFirstNames);
      lastName = getRandomItem(npcData.gnomeLastNames);
      break;
    case 'Goliath':
      firstName = getFirstName(npcData.goliathFirstNames);
      lastName = getRandomItem(npcData.goliathLastNames);
      break;
    case 'Half-elf':
      firstName = getFirstName(npcData.halfElfFirstNames);
      lastName = getRandomItem(npcData.halfElfLastNames);
      break;
    case 'Half-orc':
      firstName = getFirstName(npcData.halfOrcFirstNames);
      lastName = getRandomItem(npcData.halfOrcLastNames);
      break;
    case 'Tiefling':
      firstName = getFirstName(npcData.tieflingFirstNames);
      lastName = getRandomItem(npcData.tieflingLastNames);
      break;
    default:
      firstName = getFirstName(npcData.humanFirstNames);
      lastName = getRandomItem(npcData.humanLastNames);
  }

  return `${firstName.trim()} ${lastName.trim()}`;
};

const setAge = (): string => getRandomItem(npcData.ages);
const setIntelligence = (): string => getRandomItem(npcData.intelligences);
const setHairStyle = (): string => getRandomItem(npcData.hairStyles);
const setHairColor = (): string => getRandomItem(npcData.hairColors);
const setFacialHair = (gender: string, race: string): string => {
  if (gender === 'male' || (race === 'Dwarf' && Math.random() > 0.5)) {
    return getRandomItem(npcData.facialHairStyles);
  }
  return ".";
};
const setHeight = (): string => getRandomItem(npcData.heights);
const setWeight = (): string => getRandomItem(npcData.weights);
const setEyeShape = (): string => getRandomItem(npcData.eyeShapes);
const setEyeColor = (): string => getRandomItem(npcData.eyeColors);
const setComplexion = (): string => getRandomItem(npcData.complexions);
const setDescriptors = (): string => getRandomItem(npcData.descriptors);
const setProfession = (): string => getRandomItem(npcData.professions);
const setDemeanor = (): string => getRandomItem(npcData.demeanors);
const setWantsOrNeeds = (): string => getRandomItem(npcData.wantsOrNeeds);
const setSecretOrObstacle = (): string => getRandomItem(npcData.secretOrObstacles);
const setAlsoCarrying = (): string[] => {
  const numItems = Math.floor(Math.random() * 4) + 1;
  const selectedItems: string[] = [];
  const itemsCopy = [...npcData.items];
  for (let i = 0; i < numItems; i++) {
    if(itemsCopy.length === 0) break;
    const itemIndex = Math.floor(Math.random() * itemsCopy.length);
    selectedItems.push(itemsCopy.splice(itemIndex, 1)[0]);
  }
  return selectedItems;
};

export const generateNpc = (): Npc => {
  const gender = setGender();
  const race = setRace();
  const name = setName(gender, race);
  const age = setAge();
  const intelligence = setIntelligence();
  const hairStyle = setHairStyle();
  const hairColor = setHairColor();
  const facialHair = setFacialHair(gender, race);
  const height = setHeight();
  const weight = setWeight();
  const eyeShape = setEyeShape();
  const eyeColor = setEyeColor();
  const complexion = setComplexion();
  const descriptor = setDescriptors();
  const profession = setProfession();
  const demeanor = setDemeanor();
  const wantsOrNeed = setWantsOrNeeds();
  const secretOrObstacle = setSecretOrObstacle();
  const alsoCarrying = setAlsoCarrying();
  const gold = Math.floor(Math.random() * 100);
  const silver = Math.floor(Math.random() * 100);
  const copper = Math.floor(Math.random() * 100);

  const fullDescription = `${name}, a${intelligence.trim()}${age} ${gender} ${race} with${complexion} skin, ${hairStyle} ${hairColor}${facialHair.trim()} Is ${height} with a${weight} build, has ${eyeShape} ${eyeColor}, and ${descriptor}. ${name.split(' ')[0]} is a${profession}, has a${demeanor} attitude and is currently ${wantsOrNeed}, and ${secretOrObstacle}. They are carrying ${alsoCarrying.join(', ')} and have ${gold}GP, ${silver}SP, and ${copper}CP in their coin purse.`;

  return {
    name,
    gender,
    race,
    age,
    intelligence,
    hairStyle,
    hairColor,
    facialHair,
    height,
    weight,
    eyeShape,
    eyeColor,
    complexion,
    descriptor,
    profession,
    demeanor,
    wantsOrNeed,
    secretOrObstacle,
    alsoCarrying,
    gold,
    silver,
    copper,
    fullDescription,
  };
};