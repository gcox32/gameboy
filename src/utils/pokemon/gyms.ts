import { Badge, Gym, TM } from '@/types/pokemon';
import { gymLeaderImgPath as imgUrl } from "@/../config";

const HMs: TM[] = [
    { id: 'HM01', name: 'Cut', hiddenMachine: true },
    { id: 'HM02', name: 'Fly', hiddenMachine: true },
    { id: 'HM03', name: 'Surf', hiddenMachine: true },
    { id: 'HM04', name: 'Strength', hiddenMachine: true },
    { id: 'HM05', name: 'Flash', hiddenMachine: true },
];

export const badges: Badge[] = [
    { name: "Boulder Badge", image: "boulder.png", giver: 'Brock',     hm: HMs[4],               statBoost: 'attack'  },
    { name: "Cascade Badge", image: "cascade.png", giver: 'Misty',     hm: HMs[0], obeyLevel: 30                      },
    { name: "Thunder Badge", image: "thunder.png", giver: 'Lt. Surge', hm: HMs[1],               statBoost: 'defense' },
    { name: "Rainbow Badge", image: "rainbow.png", giver: 'Erika',     hm: HMs[3], obeyLevel: 50                      },
    { name: "Soul Badge",    image: "soul.png",    giver: 'Koga',      hm: HMs[2],               statBoost: 'speed'   },
    { name: "Marsh Badge",   image: "marsh.png",   giver: 'Sabrina',               obeyLevel: 70                      },
    { name: "Volcano Badge", image: "volcano.png", giver: 'Blaine',                              statBoost: 'special' },
    { name: "Earth Badge",   image: "earth.png",   giver: 'Giovanni',              obeyLevel: 100                     },
];

export const gyms: Gym[] = [
    {
        name: 'Pewter Gym',
        description: '...',
        gymLocation: 'Pewter City',
        badge: badges[0],
        leader: 'Brock',
        leaderImage: imgUrl + '1_Brock.png',
        leaderDescription: 'The Rock Solid Pokémon Trainer!',
    },
    {
        name: 'Cerulean Gym',
        description: '...',
        gymLocation: 'Cerulean City',
        badge: badges[1],
        leader: 'Misty',
        leaderImage: imgUrl + '2_Misty.png',
        leaderDescription: 'The Tomboyish Mermaid!',
    },
    {
        name: 'Vermillion Gym',
        description: '...',
        gymLocation: 'Vermillion City',
        badge: badges[2],
        leader: 'Lt. Surge',
        leaderImage: imgUrl + '3_Lt_Surge.png',
        leaderDescription: 'The Lightning American!',
    },
    {
        name: 'Celadon Gym',
        description: '...',
        gymLocation: 'Celadon City',
        badge: badges[3],
        leader: 'Erika',
        leaderImage: imgUrl + '4_Erika.png',
        leaderDescription: 'The Nature-Loving Princess!',
    },
    {
        name: 'Fuchsia Gym',
        description: '...',
        gymLocation: 'Fuchsia City',
        badge: badges[4],
        leader: 'Koga',
        leaderImage: imgUrl + '5_Koga.png',
        leaderDescription: 'The Poisonous Ninja Master!',
    },
    {
        name: 'Saffron Gym',
        description: '...',
        gymLocation: 'Saffron City',
        badge: badges[5],
        leader: 'Sabrina',
        leaderImage: imgUrl + '6_Sabrina.png',
        leaderDescription: 'The Master of Psychic Pokémon!',
    },
    {
        name: 'Cinnabar Gym',
        description: '...',
        gymLocation: 'Cinnabar Island',
        badge: badges[6],
        leader: 'Blaine',
        leaderImage: imgUrl + '7_Blaine.png',
        leaderDescription: 'The Hot-Headed Quiz Master!',
    },
    {
        name: 'Viridian Gym',
        description: '...',
        gymLocation: 'Indigo Plateau',
        badge: badges[7],
        leader: 'Giovanni',
        leaderImage: imgUrl + '8_Giovanni.png',
        leaderDescription: '...',
    }
]