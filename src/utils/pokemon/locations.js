const imgUrl = 'https://assets.letmedemo.com/public/gameboy/images/backgrounds/'

export const locations = [
    {
        title: 'Pallet Town',
        x: 72,
        y: 95,
        locType: 'town',
        img: imgUrl + 'pallet-oaks-lab.png',
        width: 17,
        height: 17,
        desc: "Pallet Town (Japanese: マサラタウン Masara Town) is a small town located in southwestern Kanto. It is the hometown of the player and their rival in the Kanto-based games. In other games, it is specifically the hometown of Red and Blue. In the anime, it is the hometown of Ash and Gary. Professor Oak's Laboratory, where the famous Professor Oak conducts his research, is located in the town.",
        persons: ["Prof. Oak", "Delia", "Red", "Daisy"],
        places: ["Oak's Lab", "Player's Home", "Rivals's Home"],
        slogan: "Shades of your journey await!",
    },
    {
        title: 'Viridian City',
        x: 72,
        y: 147,
        locType: 'city',
        img: imgUrl + 'viridian-city.png',
        width: 17,
        height: 17,
        desc: "Viridian City (Japanese: トキワシティ Tokiwa City) is a small city located in western Kanto. It is home to the Viridian Gym, which can only be challenged by the player once they have obtained the Badges of the seven other Gyms of Kanto. In the Kanto-based games, the Gym Leader is Giovanni, the boss of Team Rocket and a Ground-type expert. After being defeated, he abandons the Gym and is replaced by Blue, who has no specialty type. He is the Gym Leader during the events of the Johto-based games.",
        persons: ["Old Man"],
        places: ["Viridian Gym", "Trainer's School"],
        slogan: "The Eternally Green Paradise",
    },
    {
        title: 'Pewter City',
        x: 72,
        y: 235,
        locType: 'city',
        img: imgUrl + 'pewter-city.png',
        width: 17,
        height: 17,
        desc: "Pewter City (Japanese: ニビシティ Nibi City) is a city located in northwestern Kanto. The most notable resident of the city is Brock, a Rock-type expert and the Leader of the Pewter Gym. The city has two exits. To the east is Route 3, leading to Route 4 and Mt. Moon. To the south is Route 2, leading to Viridian City.",
        persons: ["Brock"],
        places: ["Pewter Gym", "Pewter Museum of Science"],
        slogan: "A Stone Gray City",
    },
    {
        title: 'Cerulean City',
        x: 211,
        y: 252,
        locType: 'city',
        img: imgUrl + 'cerulean-city.png',
        width: 17,
        height: 17,
        desc: "Cerulean City (Japanese: ハナダシティ Hanada City) is a seaside city located in northern Kanto. It is situated near a sea inlet to the north, with Saffron City to the south, and Mt. Moon to the west. It is home to Misty, the Cerulean City Gym Leader. The city is one of only two cities in Kanto to have four different routes enter the city, the other being Saffron City. Cerulean is a mid-sized city with a few attractions, including the Bike Shop and the Berry Powder man.",
        persons: ["Misty"],
        places: ["Cerulean Gym", "Bike Shop"],
        slogan: "A Mysterious, Blue Aura Surrounds It",
    },
    {
        title: 'Vermillion City',
        x: 211,
        y: 131,
        locType: 'city',
        img: imgUrl + 'vermillion-city.png',
        width: 17,
        height: 17,
        desc: "Vermilion City (Japanese: クチバシティ Kuchiba City) is a city in Kanto. Situated near a sea inlet to the south, it serves as a popular sea port for ships such as the S.S. Anne. Vermilion Harbor is a home port for many ships. The S.S. Anne sails around the world and returns to Vermilion once a year. The S.S. Aqua sails from Olivine City in Johto to Vermilion Harbor. The Seagallop Ferries sail regularly to all of the Sevii Islands. Aside from the harbor, the other exits to the city are Route 11 and Diglett's Cave to the east. North of the city is Route 6.",
        persons: ["Lt. Surge", "Fishing Guru"],
        places: ["Vermillion Gym", "Vermillion Harbor", "Pokemon Fan Club", "Construction Site"],
        slogan: "The Port of Exquisite Sunsets",
    },
    {
        title: 'Lavender Town',
        x: 280,
        y: 200,
        locType: 'city',
        img: imgUrl + 'lavender-town.png',
        width: 17,
        height: 17,
        desc: "Lavender Town (Japanese: シオンタウン Cion Town) is a small town located in northeast Kanto, just south of the Rock Tunnel. The citizens of Lavender Town in Generations I, III, and VII claim Lavender Town is known mainly for ghost sightings in the Pokémon Tower and as the main gravesite of Pokémon. In Generations II and IV, the town is noticeably modernized with the inclusion of a broadcasting station. The citizens claim the ghosts that appear in the tower are the spirits of Pokémon that have died. North of Lavender is Route 10 and the Rock Tunnel. West of the town is Route 8, while to the south is Route 12 and the Silence Bridge.",
        persons: ["Mr. Fugi", "Name Rater"],
        places: ["Pokemon Tower", "Lavender Volunteer Pokémon House"],
        slogan: "The Noble Purple Town",
    },
    {
        title: 'Celadon City',
        x: 159,
        y: 200,
        locType: 'city',
        img: imgUrl + 'celadon-city.png',
        width: 17,
        height: 17,
        desc: "Celadon City (Japanese: タマムシシティ Tamamushi City) is located in central Kanto. It is the most populous city in Kanto and the eighth most populous in the Pokémon world, surpassing even Saffron City in the east. The city has two entrances, one from the east via Route 7, and one from the west via Route 16. Celadon is the main place to spend money in Kanto, through the Celadon Department Store and the Celadon Game Corner. It is the home of the Celadon Condominiums, where residents of the city live, and the Celadon Hotel, where visitors can rest. Celadon is also home to Erika, the city's Gym Leader, and Eusine, the hunter who pursues Suicune.",
        persons: ["Erika"],
        places: ["Celadon Gym", "Celadon Department Store", "Team Rocket Hideout", "Celadon Game Corner", "Celadon Hotel"],
        slogan: "The City of Rainbow Dreams",
    },
    {
        title: 'Fuschia City',
        x: 176,
        y: 61,
        locType: 'city',
        img: imgUrl + 'fuschia-city.png',
        width: 17,
        height: 17,
        desc: "Fuchsia City (Japanese: セキチクシティ Sekichiku City) is a city located in southwest Kanto. Its most distinguishing features are the Safari Zone in the Generation I and III games and the Poison-type Gym. Koga is the Fuchsia City Gym Leader until his daughter Janine takes over in the Generation II and IV games. Route 15 leads into the city from the east, Route 18 from the west, and the beach of Route 19 is in the south. In Generation II, the Safari Zone is closed down. In Pokémon HeartGold and SoulSilver, Pal Park replaces the closed-down Safari Zone. In Pokémon: Let's Go, Pikachu! and Let's Go, Eevee!, the zoo in the city is referred to as the Safari Zone, while the former Safari Zone's location is now occupied by GO Park.",
        persons: ["Koga", "Bill's Grandfather", "Safari Warden"],
        places: ["Fuschia Gym", "Safari Zone", "Pokemon Zoo"],
        slogan: "Behold! It's Passion Pink!",
    },
    {
        title: 'Saffron City',
        x: 211,
        y: 200,
        locType: 'city',
        img: imgUrl + 'saffron-city.png',
        width: 17,
        height: 17,
        desc: "Saffron City (Japanese: ヤマブキシティ Yamabuki City) is a sprawling metropolis in the Kanto region. It lies in between Celadon City, Vermilion City, Lavender Town, and Cerulean City. It is home to Sabrina, the city's Gym Leader. It is modeled after Japan's capital city of Tokyo and is the largest and one of the busiest cities in Kanto, being famous even in other regions. It is the tenth most populous city in the Pokémon world and one of the only cities in Kanto that has enough visible houses to accommodate its population in the games. The large Silph Co. headquarters building stands firm as the city's centerpiece while two Gyms dominate the northeastern corner district. Not only is this the central business district of Kanto, it also holds the region's largest infrastructure, including the Magnet Train station, which allows ease of access between Kanto and Johto.",
        persons: ["Sabrina", "Copycat", "Mr. Psychic"],
        places: ["Saffron Gym", "Silph Co. Head Office", "Fighting Dojo", "Pokemon Trainer Fan Club"],
        slogan: "Shining, Golden Land of Commerce",
    },
    {
        title: 'Cinnabar Island',
        x: 72,
        y: 25,
        locType: 'city',
        img: imgUrl + 'cinnabar-island.png',
        width: 17,
        height: 17,
        desc: "Cinnabar Island (Japanese: グレン島 Guren Island; グレンタウン Guren Town) is a large island located off the southern coast of the Kanto region, south of Pallet Town. It is home to a large volcano. Blaine was once the resident Gym Leader specializing in Fire-type Pokémon, but in the Johto-based games, Cinnabar Island had been ravaged by a volcanic eruption and Blaine has moved the Cinnabar Gym to the Seafoam Islands.",
        persons: [],
        places: [],
        slogan: "The Fiery Town of Burning Desire",
    },
    {
        title: 'Indigo Plateau',
        x: 37,
        y: 252,
        locType: 'city',
        img: imgUrl + 'indigo-plateau.png',
        width: 17,
        height: 17,
        desc: "The Indigo Plateau (Japanese: セキエイこうげん Sekiei Plateau) serves as the capital for the Pokémon League in the Kanto region. It is the final destination for Pokémon Trainers collecting Indigo or Johto League Badges. This is where the Trainers who have defeated all of the eight Gym Leaders of either Kanto or Johto battle against the Elite Four and the Pokémon Champion. In the anime, it is the location of the Indigo Plateau Conference, the Kanto Grand Festival, and the Pokémon League Village. It is located just north of Victory Road and Route 23, and east of Mt. Silver. In the Generation I games, Pokémon FireRed and LeafGreen, and Pokémon: Let's Go, Pikachu! and Let's Go, Eevee!, the only way to reach the Indigo Plateau is by going through Route 23. In the Generation II games and Pokémon HeartGold and SoulSilver, the Indigo Plateau is reached by going through Route 26. In all the games, Trainers must venture through Victory Road, a lengthy cave acting as a final test for Trainers. The Elite Four must be battled consecutively, with breaks to the Pokémon Center prohibited. Trainers are unable to go back or return to previous rooms. The only way to open the door and progress through each room is to defeat the Elite Four member of that room. Each member of the Elite Four is stronger than the previous member, and like Gym Leaders, each specializes in a different type.",
        persons: ["Lorelei", "Bruno", "Agatha", "Lance"],
        places: [],
        slogan: "The Ultimate Goal of Trainers!",
    },
    {
        title: 'Route 1',
        x: 72,
        y: 113,
        locType: 'route',
        img: '',
        width: 17,
        height: 34,
        persons: [],
        places: [],
    },
    {
        title: 'Route 2',
        x: 72,
        y: 165,
        locType: 'route',
        img: '',
        width: 17,
        height: 38,
        persons: [],
        places: [],
    },
    {
        title: 'Viridian Forest',
        x: 72,
        y: 202,
        locType: 'forest',
        img: '',
        width: 17,
        height: 32,
        persons: [],
        places: [],
    },
    {
        title: "Diglett's Cave - West",
        x: 90,
        y: 217,
        locType: 'cave',
        img: '',
        width: 17,
        height: 17,
        persons: [],
        places: [],
    },
    {
        title: 'Route 3',
        x: 90,
        y: 235,
        locType: 'route',
        img: '',
        width: 52,
        height: 17,
        persons: [],
        places: [],
    },
    {
        title: 'Mt. Moon',
        x: 124,
        y: 252,
        locType: 'cave',
        img: '',
        width: 51,
        height: 17,
        persons: [],
        places: [],
    },
    {
        title: 'Route 4',
        x: 175,
        y: 252,
        locType: 'route',
        img: '',
        width: 35,
        height: 17,
        persons: [],
        places: [],
    },
    {
        title: 'Route 24',
        x: 211,
        y: 269,
        locType: 'route',
        img: '',
        width: 17,
        height: 17,
        persons: [],
        places: [],
    },
    {
        title: 'Route 25',
        x: 211,
        y: 286,
        locType: 'route',
        img: '',
        width: 35,
        height: 17,
        persons: [],
        places: [],
    },
    {
        title: 'Sea Cottage',
        x: 246,
        y: 286,
        locType: 'landmark',
        img: '',
        width: 17,
        height: 17,
        persons: [],
        places: [],
    },
    {
        title: 'Route 5',
        x: 211,
        y: 216,
        locType: 'route',
        img: '',
        width: 17,
        height: 35,
        persons: [],
        places: [],
    },
    {
        title: 'Route 6',
        x: 211,
        y: 148,
        locType: 'route',
        img: '',
        width: 17,
        height: 51,
        persons: [],
        places: [],
    },
    {
        title: 'Route 9',
        x: 228,
        y: 252,
        locType: 'route',
        img: '',
        width: 71,
        height: 17,
        persons: [],
        places: [],
    },
    {
        title: 'Rock Tunnel',
        x: 265,
        y: 234,
        locType: 'cave',
        img: '',
        width: 34,
        height: 19,
        persons: [],
        places: [],
    },
    {
        title: 'Route 10',
        x: 280,
        y: 218,
        locType: 'route',
        img: '',
        width: 19,
        height: 17,
        persons: [],
        places: [],
    },
    {
        title: 'Route 8',
        x: 229,
        y: 200,
        locType: 'route',
        img: '',
        width: 51,
        height: 17,
        persons: [],
        places: [],
    },
    {
        title: 'Route 7',
        x: 177,
        y: 200,
        locType: 'route',
        img: '',
        width: 34,
        height: 17,
        persons: [],
        places: [],
    },
    {
        title: 'Route 11',
        x: 228,
        y: 130,
        locType: 'route',
        img: '',
        width: 52,
        height: 17,
        persons: [],
        places: [],
    },
    {
        title: 'Route 12',
        x: 280,
        y: 95,
        locType: 'route',
        img: '',
        width: 17,
        height: 104,
        persons: [],
        places: [],
    },
    {
        title: 'Route 13',
        x: 228,
        y: 95,
        locType: 'route',
        img: '',
        width: 53,
        height: 18,
        persons: [],
        places: [],
    },
    {
        title: 'Route 14',
        x: 228,
        y: 60,
        locType: 'route',
        img: '',
        width: 18,
        height: 36,
        persons: [],
        places: [],
    },
    {
        title: 'Route 15',
        x: 193,
        y: 60,
        locType: 'route',
        img: '',
        width: 36,
        height: 18,
        persons: [],
        places: [],
    },
    {
        title: 'Route 16',
        x: 106,
        y: 200,
        locType: 'route',
        img: '',
        width: 52,
        height: 17,
        persons: [],
        places: [],
    },
    {
        title: 'Route 17',
        x: 106,
        y: 60,
        locType: 'route',
        img: '',
        width: 17,
        height: 140,
        persons: [],
        places: [],
    },
    {
        title: 'Route 18',
        x: 123,
        y: 60,
        locType: 'route',
        img: '',
        width: 52,
        height: 18,
        persons: [],
        places: [],
    },
    {
        title: 'Safari Zone',
        x: 176,
        y: 78,
        locType: 'landmark',
        img: '',
        width: 17,
        height: 17,
        persons: [],
        places: [],
    },
    {
        title: 'Route 19',
        x: 142,
        y: 25,
        locType: 'route',
        img: '',
        width: 51,
        height: 18,
        persons: [],
        places: [],
    },
    {
        title: 'Seafoam Islands',
        x: 123,
        y: 25,
        locType: 'cave',
        img: '',
        width: 19,
        height: 18,
        persons: [],
        places: [],
    },
    {
        title: 'Route 20',
        x: 89,
        y: 25,
        locType: 'route',
        img: '',
        width: 34,
        height: 18,
        persons: [],
        places: [],
    },
    {
        title: 'Route 21',
        x: 71,
        y: 43,
        locType: 'route',
        img: '',
        width: 18,
        height: 52,
        persons: [],
        places: [],
    },
    {
        title: 'Route 22',
        x: 36,
        y: 147,
        locType: 'route',
        img: '',
        width: 35,
        height: 18,
        persons: [],
        places: [],
    },
    {
        title: 'Route 23',
        x: 36,
        y: 165,
        locType: 'route',
        img: '',
        width: 18,
        height: 38,
        persons: [],
        places: [],
    },
    {
        title: 'Victory Road',
        x: 36,
        y: 202,
        locType: 'cave',
        img: '',
        width: 18,
        height: 49,
        persons: [],
        places: [],
    },
    {
        title: 'Power Plant',
        x: 297,
        y: 218,
        locType: 'landmark',
        img: '',
        width: 19,
        height: 17,
        persons: [],
        places: [],
    },
    {
        title: "Diglett's Cave - East",
        x: 229,
        y: 148,
        locType: 'cave',
        img: '',
        width: 17,
        height: 17,
        persons: [],
        places: [],
    },
    {
        title: "Cerulean Cave",
        x: 192,
        y: 271,
        locType: 'cave',
        img: '',
        width: 17,
        height: 17,
        persons: [],
        places: [],
    }

]