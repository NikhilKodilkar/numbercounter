import * as THREE from 'three';
import { gsap } from 'gsap';
import { Unicorn } from './Unicorn.js';
import { SoundManager } from './SoundManager.js';

class NumberGame {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.currentNumber = Math.floor(Math.random() * 89) + 11; // Random number between 11 and 99
        this.targetNumbers = [];
        this.score = 0;
        this.isAnimating = false;
        this.particles = [];
        this.lastTime = 0;
        this.soundManager = new SoundManager();
        this.streak = 0;
        this.bestStreak = 0;
        this.debugConsole = document.getElementById('debug-console');
        this.log('Game initialized');

        this.init();
        this.setupLights();
        this.unicorn = new Unicorn(this.scene);
        this.setupEventListeners();
        this.createParticleSystem();
        this.updateDisplay();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // Sky blue background
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.z = 5;
        this.camera.position.y = 1;
        this.camera.lookAt(0, 0, 0);

        // Set button text
        const submitButton = document.getElementById('submit-button');
        if (submitButton) {
            submitButton.textContent = 'GO !';
        }

        // Create a ground plane
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x90EE90,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2;
        this.scene.add(ground);

        // Add ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        this.animate();
        this.setupDebugConsole();
    }

    createParticleSystem() {
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = Math.random() * 5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

            colors[i * 3] = Math.random();
            colors[i * 3 + 1] = Math.random();
            colors[i * 3 + 2] = Math.random();
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        this.particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        this.particleSystem.visible = false;
        this.scene.add(this.particleSystem);
    }

    showCelebrationParticles() {
        this.particleSystem.visible = true;
        gsap.to(this.particleSystem.material, {
            opacity: 0,
            duration: 2,
            onComplete: () => {
                this.particleSystem.visible = false;
                this.particleSystem.material.opacity = 0.8;
            }
        });
    }

    setupLights() {
        // Add directional light for shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // Add point light for sparkle effects
        const pointLight = new THREE.PointLight(0xff69b4, 1, 10);
        pointLight.position.set(2, 2, 2);
        this.scene.add(pointLight);
    }

    setupEventListeners() {
        this.log('Setting up event listeners');
        
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        const submitButton = document.getElementById('submit-button');
        const firstAnswer = document.getElementById('first-answer');
        const secondAnswer = document.getElementById('second-answer');
        const thirdAnswer = document.getElementById('third-answer');
        const refreshButton = document.querySelector('.refresh-button');

        if (!submitButton || !firstAnswer || !secondAnswer || !thirdAnswer || !refreshButton) {
            this.log('Error: Could not find all required elements');
            return;
        }

        // Global keyboard event listener
        document.addEventListener('keydown', (e) => {
            this.log(`Key pressed: ${e.key}`);
            if (e.key === 'Enter') {
                e.preventDefault();
                this.log('Enter key pressed - checking answers');
                this.checkAnswers();
            } else if (e.key.toLowerCase() === 'h') {
                this.log('H key pressed - showing hint');
                this.showHint();
            } else if (e.key === 'Escape') {
                this.log('Escape key pressed - clearing active input');
                const activeElement = document.activeElement;
                if (activeElement && activeElement.tagName === 'INPUT') {
                    activeElement.value = '';
                    activeElement.style.borderColor = '#ff69b4';
                    activeElement.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                }
            }
        });

        submitButton.addEventListener('click', (e) => {
            this.log('GO button clicked');
            e.preventDefault();
            this.checkAnswers();
        });

        refreshButton.addEventListener('click', (e) => {
            this.log('Refresh button clicked');
            e.preventDefault();
            this.refreshNumber();
        });

        // Input field event listeners
        [firstAnswer, secondAnswer, thirdAnswer].forEach((input, index, inputs) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.log(`Enter pressed in input ${index + 1}`);
                    if (index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    } else {
                        this.checkAnswers();
                    }
                }
            });

            input.addEventListener('input', () => {
                this.log(`Input ${index + 1} value changed: ${input.value}`);
                if (input.value.length === 2) {
                    if (index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    } else {
                        this.checkAnswers();
                    }
                }
            });
        });

        this.log('Event listeners setup complete');
    }

    showHint() {
        const message = document.getElementById('message');
        
        let hint = '';
        if (this.currentNumber % 10 === 9) {
            hint = `Think about moving to the next tens place after ${this.currentNumber}...`;
        } else if (this.currentNumber % 10 === 0) {
            hint = `We just started at ${this.currentNumber}, what are the next three numbers?`;
        } else {
            hint = `After ${this.currentNumber}, count up three numbers: ${this.currentNumber + 1}, ${this.currentNumber + 2}, ${this.currentNumber + 3}`;
        }
        
        message.textContent = hint;
        message.style.color = '#FFD700';
        setTimeout(() => {
            message.textContent = '';
        }, 5000); // Show hint for 5 seconds
    }

    checkAnswers() {
        this.log('Checking answers...');
        const inputs = [
            document.getElementById('first-answer'),
            document.getElementById('second-answer'),
            document.getElementById('third-answer')
        ];

        const values = inputs.map(input => parseInt(input.value));
        this.log(`Input values: ${values.join(', ')}`);
        
        if (values.some(isNaN)) {
            this.log('Some inputs are empty');
            this.showMessage('Please fill in all numbers! 📝', 'orange');
            return;
        }

        const expectedValues = [
            this.currentNumber + 1,
            this.currentNumber + 2,
            this.currentNumber + 3
        ];
        this.log(`Expected values: ${expectedValues.join(', ')}`);

        const isCorrect = values.every((value, index) => value === expectedValues[index]);
        this.log(`Answer is ${isCorrect ? 'correct' : 'incorrect'}`);

        if (isCorrect) {
            this.handleCorrectSequence();
        } else {
            const incorrectIndices = values.map((value, index) => 
                value !== expectedValues[index] ? index : -1
            ).filter(index => index !== -1);

            inputs.forEach((input, index) => {
                if (incorrectIndices.includes(index)) {
                    input.style.borderColor = '#ff0000';
                    input.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                }
            });

            this.handleIncorrectSequence();
        }
    }

    handleCorrectSequence() {
        // Update streak
        this.streak++;
        if (this.streak > this.bestStreak) {
            this.bestStreak = this.streak;
            document.getElementById('best-streak-value').textContent = this.bestStreak;
        }
        document.getElementById('streak-value').textContent = this.streak;
        
        // Update score and display
        this.score += 30;
        document.getElementById('score-value').textContent = this.score;
        
        // Play animations and sounds
        this.unicorn.playHappyAnimation();
        this.soundManager.playCorrectSound();
        this.soundManager.playCelebrationSound();
        this.showCelebrationParticles();
        
        // Show success message
        this.showMessage('Great job! 🌟', '#90EE90');
        
        // Clear inputs, reset colors, and set focus immediately
        this.clearInputs();
        
        // Update to next number after a short celebration delay
        setTimeout(() => {
            // Move to next sequence
            this.currentNumber += 3;
            this.updateDisplay();
            
            // Reset input styles
            const inputs = document.querySelectorAll('input[type="number"]');
            inputs.forEach(input => {
                input.style.borderColor = '#ff69b4';
                input.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                input.value = '';
            });
            
            // Focus on first input
            document.getElementById('first-answer').focus();
        }, 1000);
    }

    handleIncorrectSequence() {
        // Reset streak
        this.streak = 0;
        document.getElementById('streak-value').textContent = this.streak;
        
        // Play animations and sounds
        this.unicorn.playSadAnimation();
        this.soundManager.playIncorrectSound();
        
        // Show error message with hint prompt
        this.showMessage('Not quite right! Try again or press H for a hint 💫', '#FFB6C1');
        
        // Clear inputs but preserve the current number
        setTimeout(() => {
            this.clearInputs();
            document.getElementById('first-answer').focus();
        }, 1000);
    }

    showMessage(text, color) {
        const message = document.getElementById('message');
        message.textContent = text;
        message.style.color = color;
        message.style.background = 'rgba(0, 0, 0, 0.5)';
        message.style.padding = '15px 30px';
        message.style.borderRadius = '15px';
        message.style.marginTop = '20px';
        message.style.display = 'block';
        message.style.width = 'auto';
        message.style.textAlign = 'center';
        message.style.fontWeight = 'bold';
        message.style.fontSize = '1.2em';
        message.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    }

    clearInputs() {
        const inputs = document.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.value = '';
            input.style.borderColor = '#ff69b4';
            input.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        });
    }

    updateDisplay() {
        document.getElementById('current-number').textContent = this.currentNumber;
    }

    animate(currentTime = 0) {
        requestAnimationFrame(this.animate.bind(this));
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update unicorn animations
        if (this.unicorn) {
            this.unicorn.update(deltaTime);
        }

        if (this.particleSystem && this.particleSystem.visible) {
            const positions = this.particleSystem.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += deltaTime * 0.5; // Move particles upward
                if (positions[i + 1] > 5) {
                    positions[i + 1] = 0; // Reset particle position when it goes too high
                }
            }
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }

    refreshNumber() {
        const oldNumber = this.currentNumber;
        this.currentNumber = Math.floor(Math.random() * 89) + 11;
        this.log(`Refreshing number from ${oldNumber} to ${this.currentNumber}`);
        this.updateDisplay();
        this.clearInputs();
        document.getElementById('first-answer').focus();
    }

    log(message) {
        const content = document.getElementById('debug-console-content');
        const p = document.createElement('p');
        p.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
        content.appendChild(p);
        content.scrollTop = content.scrollHeight;
        console.log(message);
    }

    setupDebugConsole() {
        const consoleHeader = document.getElementById('debug-console-header');
        const consoleToggle = document.getElementById('debug-console-toggle');
        const debugConsole = document.getElementById('debug-console');

        consoleHeader.addEventListener('click', () => {
            debugConsole.classList.toggle('collapsed');
            consoleToggle.textContent = debugConsole.classList.contains('collapsed') ? '[+]' : '[-]';
        });

        // Start collapsed
        debugConsole.classList.add('collapsed');
        consoleToggle.textContent = '[+]';
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new NumberGame();
}); 