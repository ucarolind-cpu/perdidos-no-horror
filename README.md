# Perdidos no horror

Implement ONLY the main menu screen of the game "PERDIDOS NO HORROR".



IMPORTANT:

Use the provided reference image as the exact visual reference for the main menu.



DO NOT redesign, replace, recolor, crop, distort, or substantially modify the background.



The wooden background, title, lantern, ropes, nails, cobwebs, cracks, moss, lighting, textures and overall composition must remain visually consistent with the reference image.



At this stage, ONLY create the visual main menu screen.



VISIBLE ELEMENTS:

- Game title: "PERDIDOS NO HORROR"

- Button: "JOGAR"

- Button: "CONFIGURAÇÕES"

- Button: "SAIR"



For now, these buttons are VISUAL ONLY.

Do not implement their navigation or functionality yet.

Do not create the multiplayer lobby, settings screen, character selection, room system, gameplay or any other screen.



The game must use Portuguese for all visible interface text.



ORIENTATION:

This is a landscape mobile game designed for 16:9.



If the device is held vertically/portrait:

- Do not allow the game to become playable in portrait mode.

- Display a clear overlay/message saying:

  "VIRE O CELULAR PARA JOGAR"

- Show a simple visual indication of a phone rotating to landscape.

- Temporarily hide/block the game interface while the device is in portrait orientation.

- When the device is rotated back to landscape, automatically hide the message and show the main menu again.



IMPORTANT:

Do not change the reference background while implementing the orientation system.

Do not generate a new background.

Do not add gameplay elements.

Do not implement any functionality for the buttons yet.



The goal of this step is ONLY:

1. Reproduce the provided main menu visual.

2. Make it responsive to landscape 16:9 mobile screens.

3. Add the portrait-orientation warning.

4. Keep all buttons visible but non-functional for now.

5. Keep the visual identity of the reference image intact.



LANGUAGE REQUIREMENT:

The entire game MUST be in Portuguese (Brazil).



All visible text must be in Portuguese, including:

- Menus

- Buttons

- Settings

- System messages

- Notifications

- Objectives

- Missions

- Dialogues

- Error messages

- Orientation warnings

- Multiplayer screens

- Loading screens

- Any future interface or gameplay text



Do NOT use English anywhere in the game's user interface unless explicitly requested later.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://perdidos-no-horror.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fc0d3626-ce8f-40ab-9498-aff8681c8b61).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
