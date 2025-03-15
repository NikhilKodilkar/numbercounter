import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { gsap } from 'gsap';

export class Unicorn {
    constructor(scene) {
        this.scene = scene;
        this.model = null;
        this.rainbow = null;
        this.rainbowParticles = null;
        this.isAnimating = false;
        this.mixer = null;
        this.animations = {};
        this.walkSpeed = 1.2;
        this.walkBounds = { left: -4, right: 4 };
        this.walkDirection = 1; // 1 for right, -1 for left
        this.isWalking = true;
        
        // Load the model first
        this.loadModel().then(() => {
            this.createRainbow();
            this.createRainbowParticles();
            this.startWalking();
        });
    }

    async loadModel() {
        try {
            const loader = new GLTFLoader();
            const gltf = await loader.loadAsync('/models/unicorn.glb');
            
            this.model = gltf.scene;
            
            // Debug: Print model structure
            console.log('Model structure:');
            this.model.traverse((object) => {
                console.log(`Object name: "${object.name}", Type: ${object.type}`);
                if (object.isBone) {
                    console.log('Found bone:', object.name);
                }
            });
            
            // Apply default transformations
            this.model.position.y = -1.2;
            this.model.position.x = -4; // Start from left
            this.model.scale.set(2, 2, 2); // Make it a bit smaller
            
            // Store animations if they exist
            if (gltf.animations && gltf.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(this.model);
                gltf.animations.forEach(clip => {
                    this.animations[clip.name] = this.mixer.clipAction(clip);
                });
            }
            
            // Add model to scene
            this.scene.add(this.model);
            
            // Store initial positions for animations
            this.initialY = this.model.position.y;
            this.initialX = this.model.position.x;
            this.initialRotation = this.model.rotation.y;
            
            console.log('Unicorn model loaded successfully');
        } catch (error) {
            console.error('Error loading unicorn model:', error);
        }
    }

    startWalking() {
        if (!this.model) return;
        
        // If there's a walk animation in the model, play it
        if (this.animations['walk']) {
            this.animations['walk'].reset().play();
        } else {
            // If no walk animation, create a simple bobbing motion
            this.createBobbingAnimation();
        }
    }

    createBobbingAnimation() {
        if (!this.model) return;

        // Create a more complex walking animation using multiple transformations
        const timeline = gsap.timeline({
            repeat: -1
        });

        // Store initial position and rotation
        const startY = this.initialY;
        const startRotZ = this.model.rotation.z;

        // Combined walking motion
        timeline
            // Step 1: Forward tilt and up
            .to(this.model.position, {
                y: startY + 0.1,
                duration: 0.3,
                ease: "sine.inOut"
            })
            .to(this.model.rotation, {
                z: startRotZ - 0.05,
                duration: 0.3,
                ease: "sine.inOut"
            }, "<")
            // Step 2: Back to center and down
            .to(this.model.position, {
                y: startY - 0.05,
                duration: 0.3,
                ease: "sine.inOut"
            })
            .to(this.model.rotation, {
                z: startRotZ + 0.05,
                duration: 0.3,
                ease: "sine.inOut"
            }, "<")
            // Step 3: Slight backward tilt and up
            .to(this.model.position, {
                y: startY + 0.1,
                duration: 0.3,
                ease: "sine.inOut"
            })
            .to(this.model.rotation, {
                z: startRotZ + 0.05,
                duration: 0.3,
                ease: "sine.inOut"
            }, "<")
            // Step 4: Back to starting position
            .to(this.model.position, {
                y: startY,
                duration: 0.3,
                ease: "sine.inOut"
            })
            .to(this.model.rotation, {
                z: startRotZ,
                duration: 0.3,
                ease: "sine.inOut"
            }, "<");
    }

    updateWalking(deltaTime) {
        if (!this.model || !this.isWalking) return;

        // Update position
        const movement = this.walkSpeed * deltaTime * this.walkDirection;
        this.model.position.x += movement;

        // Check bounds and turn around if needed
        if (this.model.position.x >= this.walkBounds.right) {
            this.walkDirection = -1; // Start walking left
            this.model.rotation.y = Math.PI; // Turn around
        } else if (this.model.position.x <= this.walkBounds.left) {
            this.walkDirection = 1; // Start walking right
            this.model.rotation.y = 0; // Turn around
        }
    }

    createRainbow() {
        try {
            // Create points for the rainbow curve
            const points = [];
            const segments = 50;
            
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const x = 6 * (t - 0.5); // Width of 6 units, centered
                const y = -4 * (t * t - t); // Parabolic curve, height of 1 unit
                points.push(new THREE.Vector3(x, y, 0));
            }

            // Create a smooth curve through the points
            const curve = new THREE.CatmullRomCurve3(points);
            
            // Create a tube geometry for the rainbow
            const tubeGeometry = new THREE.TubeGeometry(curve, 50, 0.1, 8, false);
            
            // Create rainbow colors with gradients
            const colors = new Float32Array(tubeGeometry.attributes.position.count * 3);
            const rainbowColors = [
                new THREE.Color(0xff0000), // Red
                new THREE.Color(0xff7f00), // Orange
                new THREE.Color(0xffff00), // Yellow
                new THREE.Color(0x00ff00), // Green
                new THREE.Color(0x0000ff), // Blue
                new THREE.Color(0x4b0082), // Indigo
                new THREE.Color(0x9400d3)  // Violet
            ];

            // Apply colors to the tube vertices
            const positions = tubeGeometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                const y = positions[i + 1];
                const colorIndex = Math.floor(((y + 4) / 8) * rainbowColors.length);
                const color = rainbowColors[Math.min(Math.max(colorIndex, 0), rainbowColors.length - 1)];
                colors[i] = color.r;
                colors[i + 1] = color.g;
                colors[i + 2] = color.b;
            }

            tubeGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const rainbowMaterial = new THREE.MeshBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide
            });

            this.rainbow = new THREE.Mesh(tubeGeometry, rainbowMaterial);
            this.rainbow.position.y = 1; // Raise the rainbow up a bit
            this.scene.add(this.rainbow);
            console.log('Rainbow created successfully');
        } catch (error) {
            console.error('Error creating rainbow:', error);
        }
    }

    createRainbowParticles() {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const rainbowColors = [
            new THREE.Color(0xff0000),
            new THREE.Color(0xff7f00),
            new THREE.Color(0xffff00),
            new THREE.Color(0x00ff00),
            new THREE.Color(0x0000ff),
            new THREE.Color(0x4b0082),
            new THREE.Color(0x9400d3)
        ];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 4;
            positions[i * 3 + 1] = Math.random() * 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 4;

            const color = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0
        });

        this.rainbowParticles = new THREE.Points(geometry, material);
        this.scene.add(this.rainbowParticles);
    }

    playHappyAnimation() {
        if (this.isAnimating || !this.model) return;
        this.isAnimating = true;
        this.isWalking = false;

        if (this.animations['walk']) {
            this.animations['walk'].stop();
        }

        // Create the complete animation sequence
        const timeline = gsap.timeline({
            onComplete: () => {
                this.isAnimating = false;
                this.isWalking = true;
                if (this.animations['happy']) {
                    this.animations['happy'].stop();
                }
                if (this.animations['walk']) {
                    this.animations['walk'].reset().play();
                }
                gsap.to([this.rainbow.material, this.rainbowParticles.material], {
                    opacity: 0,
                    duration: 0.5
                });
                // Return to original walking state
                this.model.rotation.set(0, this.walkDirection < 0 ? Math.PI : 0, 0);
                this.model.position.z = 0;
            }
        });

        // Store original position and rotation
        const originalX = this.model.position.x;
        const originalY = this.model.position.y;
        const originalRotationY = this.model.rotation.y;

        // Approach sequence
        timeline
            // First walk to center
            .to(this.model.position, {
                x: 0,
                duration: 0.8,
                ease: "power1.inOut"
            })
            // Turn to face screen
            .to(this.model.rotation, {
                y: -Math.PI / 2, // Face the screen
                duration: 0.5,
                ease: "power2.inOut"
            })
            // Step closer to screen
            .to(this.model.position, {
                z: 2,
                duration: 0.5,
                ease: "power1.inOut"
            })
            // Show rainbow and particles
            .to([this.rainbow.material, this.rainbowParticles.material], {
                opacity: 1,
                duration: 0.3
            })
            // Jump and spin celebration
            .to(this.model.position, {
                y: originalY + 1.5,
                duration: 0.5,
                ease: "power2.out"
            })
            .to(this.model.rotation, {
                y: -Math.PI / 2 + Math.PI * 2,
                duration: 0.8,
                ease: "none"
            }, "-=0.4")
            .to(this.model.position, {
                y: originalY,
                duration: 0.4,
                ease: "power2.in"
            }, "-=0.3")
            // Return to position
            .to(this.model.position, {
                x: originalX,
                z: 0,
                duration: 0.8,
                ease: "power1.inOut"
            })
            .to(this.model.rotation, {
                y: originalRotationY,
                duration: 0.5,
                ease: "power2.inOut"
            }, "-=0.4");
    }

    playSadAnimation() {
        if (this.isAnimating || !this.model) return;
        this.isAnimating = true;
        this.isWalking = false;

        if (this.animations['walk']) {
            this.animations['walk'].stop();
        }

        const timeline = gsap.timeline({
            onComplete: () => {
                this.isAnimating = false;
                this.isWalking = true;
                if (this.animations['walk']) {
                    this.animations['walk'].reset().play();
                }
                // Return to original position and rotation
                this.model.rotation.set(0, this.walkDirection < 0 ? Math.PI : 0, 0);
                this.model.position.z = 0;
            }
        });

        // Store original position and rotation
        const originalX = this.model.position.x;
        const originalRotationY = this.model.rotation.y;

        // Approach and head shake sequence
        timeline
            // First walk to center
            .to(this.model.position, {
                x: 0,
                duration: 0.8,
                ease: "power1.inOut"
            })
            // Turn to face screen
            .to(this.model.rotation, {
                y: -Math.PI / 2, // Face the screen
                duration: 0.5,
                ease: "power2.inOut"
            })
            // Step closer to screen
            .to(this.model.position, {
                z: 2,
                duration: 0.5,
                ease: "power1.inOut"
            })
            // Head shake "no" animation - horizontal shaking
            .to(this.model.rotation, {
                y: -Math.PI / 2 + 0.3, // Shake right
                duration: 0.15,
                ease: "power2.out"
            })
            .to(this.model.rotation, {
                y: -Math.PI / 2 - 0.3, // Shake left
                duration: 0.15,
                ease: "power1.inOut"
            })
            .to(this.model.rotation, {
                y: -Math.PI / 2 + 0.3, // Shake right
                duration: 0.15,
                ease: "power1.inOut"
            })
            .to(this.model.rotation, {
                y: -Math.PI / 2 - 0.3, // Shake left
                duration: 0.15,
                ease: "power1.inOut"
            })
            .to(this.model.rotation, {
                y: -Math.PI / 2 + 0.3, // Shake right
                duration: 0.15,
                ease: "power1.inOut"
            })
            .to(this.model.rotation, {
                y: -Math.PI / 2, // Return to center
                duration: 0.15,
                ease: "power2.inOut"
            })
            // Return to position
            .to(this.model.position, {
                x: originalX,
                z: 0,
                duration: 0.8,
                ease: "power1.inOut"
            })
            .to(this.model.rotation, {
                y: originalRotationY,
                duration: 0.5,
                ease: "power2.inOut"
            }, "-=0.4");
    }

    update(deltaTime) {
        // Update animation mixer if it exists
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }

        // Update walking animation
        this.updateWalking(deltaTime);

        // Update rainbow particles
        if (this.rainbowParticles && this.rainbowParticles.material.opacity > 0) {
            const positions = this.rainbowParticles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += deltaTime * 0.5;
                if (positions[i + 1] > 2) {
                    positions[i + 1] = 0;
                }
            }
            this.rainbowParticles.geometry.attributes.position.needsUpdate = true;
        }
    }
} 