# Counting with Sparkle the Unicorn! 🦄

A fun and interactive counting game designed to help children practice counting from 1 to 100, with special focus on number transitions (like 29 -> 30 or 59 -> 60).

## Features

- Beautiful 3D environment with a friendly unicorn character
- Interactive counting exercises
- Encouraging feedback and celebrations for correct answers
- Special animations for milestone achievements
- Kid-friendly interface with bright colors and engaging visuals

## Setup

1. Make sure you have [Node.js](https://nodejs.org/) installed on your computer
2. Open a terminal in the project directory
3. Install the dependencies:
```bash
npm install
```
4. Start the development server:
```bash
npm start
```
5. Open your browser and navigate to `http://localhost:3000`

## How to Play

1. Click the "Start Game" button to begin
2. A random number will appear, and your child needs to count the next three numbers
3. Type each number and press Enter or click Submit
4. Get encouraging feedback and see the unicorn celebrate for correct answers!
5. Practice transitions between numbers like 29 -> 30 or 59 -> 60

## Development

This game is built using:
- Three.js for 3D graphics
- GSAP for animations
- Vite for development and building 

this.walkSpeed = 2; // Speed of movement
this.walkBounds = { left: -4, right: 4 }; // Walking boundaries
this.model.scale.set(0.5, 0.5, 0.5); // Size of the unicorn 