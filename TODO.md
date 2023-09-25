# TODO
A place to get all my thoughts out on what needs to be done.

## Refactor Vanilla JS to React
- Convert the Emulator from a JS Class to a Context
- Wrap that Context around all the buttons that trigger methods like `.run()`, `.start()`, `.pause()`
- Add the json that's being read during gameplay to the "State": then we can do the really cool stuff like update the team in the UI in real time, or update our badges,or even update our position on the map. This one will surely be the most challening.

## Convert the Save and Load Functions
As of Sept 24, 2023, the Save and Load functions reference the old implementation built on a Django app (i.e. "hit this endpoint with this payload and the app will save/load the thing"). Only the bones of that implementation are helpful now; instead we want to use a GraphQL schema to write and retrieve Save States.

## UX QOL
In the original implementation, everything was vanilla, so a lot of it was hacked together and accomplished exactly what I needed but no more. This time around, I want this thing to look more professional. 
- Save settings
    - `Autosave` button: toggle on/off; use a 10 second interval or something
    - Save multiple states per game
    - In addition to a custom title and description, identify a Save State by progress metrics (i.e. the way the game reminds you where you are on load)
- Modal UX
    - `New Game` button -> `Choose Game` modal
    - `Save Game` button -> `Save` or `Save As`
        - `Save` -> Saves game and assigns timestamp as state title, autofills progress metrics, overwrites Save State used from load
        - `Save As` -> Assigns state title, writes new save state, autofills progress metrics
            - Prompts the user to choose to a) consider different title if the chosen title already exists, b) overwrite the existing Save State by that title, or c) cancel the `Save As` flow
- Create User Profile model in schema
    - Profile ought to include:
        1. `sub` from Cognito User Pool
        2. Settings preferences (e.g. `Autosave`, `Game Speed`), to be set upon authentication
    - Save States ought to `@belongsTo` a Profile and any Profile might `@hasMany` Save States

# New Features (Stretch Goals)
There are some stretch goals with this project that will really take the gameplay experience over the top and revolve primarily around interpreting the realtime game data.

## Generate Team Art
We have art from Ken Sugimori for every Pokemon saved in S3 that can be retrieved based on the player's active party. This alone presents the possibilities for a standalone app: for example, imagine allowing the player to configure the positions of the 1 to 6 pokemon around a similar-styled cartoon image of himself/herself.
![for example](https://assets.letmedemo.com/gameboy/images/sugimori/rg/006.png)

## Manipulate the Game in New Ways
The Emulator is built to control the game through the use of simple commands (i.e. A, B, start, select, Up, Down, Left, Right). But what if, when prompted to enter your name, instead of having to navigate to each letter, the player could just use the keyboard? There's a reason this is all the way down here.

## Write a README.md of this Project