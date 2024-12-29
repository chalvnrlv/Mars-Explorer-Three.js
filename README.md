# Mars Explorer

Mars Explorer is an interactive 3D web-based simulation where users can explore a Martian terrain with an astronaut character. The project leverages Three.js for 3D rendering and FBXLoader for loading 3D models and animations.

## Features

- Fully interactive 3D Mars terrain.
- Controllable astronaut character with walking, jumping, and idle animations.
- Responsive design to fit various screen sizes.
- Smooth camera controls using OrbitControls.
- Animations and physics for a more immersive experience.

## Directory Structure

```
chalvnrlv-Mars-Explorer-Three.js/
├── index.html          # Entry point for the application
├── assets/             # 3D models and assets
│   ├── Mars.fbx
│   ├── AstroJump.fbx
│   ├── AstroBackwards.fbx
│   ├── AstroIdle.fbx
│   ├── mars2.fbx
│   └── AstroWalking.fbx
├── package.json        # Project dependencies and scripts
├── main.js             # Core application logic
└── LICENSE             # License file
```

## Installation

Follow these steps to set up and run the project locally:

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/chalvnrlv/Mars-Explorer-Three.js.git
   cd Mars-Explorer-Three.js
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:<port>` to explore Mars!

## Usage

- **Move forward:** Press `W`
- **Move backward:** Press `S`
- **Turn left:** Press `A`
- **Turn right:** Press `D`
- **Jump:** Press `Space`

The camera can be adjusted using mouse movements or touch gestures.

## Technical Details

### Core Technologies

- **Three.js**: A JavaScript 3D library used to render the 3D scene and handle animations.
- **FBXLoader**: Used to load and parse FBX models and animations.
- **OrbitControls**: Enables intuitive camera navigation.

### Key Functionalities

1. **3D Scene Setup**
   - Mars terrain is loaded from `Mars.fbx` and scaled to fit the environment.
   - Directional and ambient lighting to simulate natural Martian conditions.

2. **Character Control**
   - An astronaut model (`AstroIdle.fbx`) is used as the player character.
   - Supports animations for walking, jumping, and idling, dynamically switched based on user input.

3. **Physics and Interactions**
   - Basic collision detection ensures the player stays on the terrain.

## Assets

- 3D models and animations are located in the `assets/` directory.
- Models:
  - `Mars.fbx`: The Martian terrain.
  - `Astro*.fbx`: Animations for the astronaut character.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For inquiries or issues, please open a GitHub issue or contact the author at [chalvnrlv@example.com](mailto:chalvnrlv@example.com).

---

Enjoy exploring Mars! 🚀

