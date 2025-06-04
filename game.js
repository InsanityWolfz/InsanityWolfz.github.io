// Fantasy Adventure - JavaScript Version
// Converted from Python pygame to HTML5 Canvas

// Constants
const SCREEN_WIDTH = 1000;
const SCREEN_HEIGHT = 700;
const FPS = 60;
const PLAYER_SPEED = 180;
const ENEMY_SPEED = 60;

// Colors
const COLORS = {
    BLACK: '#000000',
    WHITE: '#FFFFFF',
    DARK_GREEN: '#225922',
    LIGHT_GREEN: '#55a855',
    BROWN: '#654321',
    DARK_BROWN: '#3e2723',
    BLUE: '#3385ff',
    GOLD: '#ffd700',
    RED: '#dc3232',
    PURPLE: '#9400d3',
    GRAY: '#808080',
    STONE_GRAY: '#696969'
};

// Direction enum
const Direction = {
    IDLE: 0,
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
};

class FantasyGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = SCREEN_WIDTH;
        this.canvas.height = SCREEN_HEIGHT;
        
        this.running = false;
        this.paused = false;
        this.lastTime = 0;
        
        // Game entities
        this.player = null;
        this.enemies = [];
        this.treasures = [];
        this.obstacles = [];
        
        // Input handling
        this.keys = {};
        this.setupInputHandlers();
        
        // Initialize game
        this.init();
    }
    
    setupInputHandlers() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Escape') {
                this.stop();
            } else if (e.code === 'KeyP') {
                this.paused = !this.paused;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    init() {
        // Create maze layout first
        const validPositions = this.createMazeLayout();
        
        // Shuffle positions for random placement
        this.shuffleArray(validPositions);
        
        // Create player at a safe starting position
        const startPositions = [[60, 60], [60, 100], [100, 60], [140, 60]];
        let playerPos = null;
        
        for (let pos of startPositions) {
            if (validPositions.some(vp => vp[0] === pos[0] && vp[1] === pos[1])) {
                playerPos = pos;
                break;
            }
        }
        
        if (!playerPos) {
            playerPos = validPositions[0];
        }
        
        this.player = new Player(playerPos[0], playerPos[1]);
        
        // Remove player position from available positions
        const playerIndex = validPositions.findIndex(pos => pos[0] === playerPos[0] && pos[1] === playerPos[1]);
        if (playerIndex !== -1) {
            validPositions.splice(playerIndex, 1);
        }
        
        // Create treasures
        const treasureCount = Math.min(8, Math.floor(validPositions.length / 4));
        const treasurePositions = validPositions.slice(-treasureCount);
        
        for (let [x, y] of treasurePositions) {
            this.treasures.push(new Treasure(x, y));
        }
        
        // Remove treasure positions
        validPositions.splice(-treasureCount);
        
        // Create enemies
        const enemyCount = Math.min(6, Math.floor(validPositions.length / 5));
        const enemyPositions = validPositions.slice(0, enemyCount);
        
        for (let [x, y] of enemyPositions) {
            this.enemies.push(new Enemy(x, y));
        }
    }
    
    createMazeLayout() {
        // Define maze in a grid (1 = wall, 0 = empty)
        const mazeGrid = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
            [1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1],
            [1,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1],
            [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
            [1,1,1,0,1,1,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1],
            [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,1,0,1],
            [1,0,1,1,1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1],
            [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
            [1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1],
            [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
            [1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
            [1,0,1,0,1,1,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        
        // Create walls based on the grid
        for (let row = 0; row < mazeGrid.length; row++) {
            for (let col = 0; col < mazeGrid[row].length; col++) {
                if (mazeGrid[row][col] === 1) {
                    const x = col * 40 + 20;
                    const y = row * 40 + 20;
                    this.obstacles.push(new Obstacle(x, y));
                }
            }
        }
        
        // Get valid spawn positions (empty spaces)
        const validPositions = [];
        for (let row = 0; row < mazeGrid.length; row++) {
            for (let col = 0; col < mazeGrid[row].length; col++) {
                if (mazeGrid[row][col] === 0) {
                    const x = col * 40 + 20;
                    const y = row * 40 + 20;
                    validPositions.push([x, y]);
                }
            }
        }
        
        return validPositions;
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    update(dt) {
        if (!this.paused) {
            // Update player
            this.player.update(dt, this.keys, this.obstacles);
            
            // Update enemies
            for (let enemy of this.enemies) {
                enemy.update(dt, this.player, this.obstacles);
            }
            
            // Check treasure collection
            for (let i = this.treasures.length - 1; i >= 0; i--) {
                const treasure = this.treasures[i];
                if (this.checkCollision(this.player, treasure)) {
                    this.player.score += 100;
                    this.treasures.splice(i, 1);
                }
            }
            
            // Check enemy collision
            for (let enemy of this.enemies) {
                if (this.checkCollision(this.player, enemy)) {
                    this.player.health -= 50 * dt; // Gradual damage
                    if (this.player.health <= 0) {
                        this.player.health = 0;
                    }
                }
            }
        }
    }
    
    checkCollision(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (entity1.radius + entity2.radius);
    }
    
    drawBackground() {
        // Draw stone floor background
        this.ctx.fillStyle = '#404040';
        this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        // Add floor texture
        this.ctx.fillStyle = '#505050';
        for (let x = 0; x < SCREEN_WIDTH; x += 40) {
            for (let y = 0; y < SCREEN_HEIGHT; y += 40) {
                if (Math.random() < 0.3) {
                    this.ctx.fillRect(x + 10, y + 10, 4, 4);
                }
                if (Math.random() < 0.2) {
                    this.ctx.fillStyle = '#303030';
                    this.ctx.fillRect(x + 20, y + 25, 3, 3);
                    this.ctx.fillStyle = '#505050';
                }
            }
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        // Draw background
        this.drawBackground();
        
        // Draw obstacles
        for (let obstacle of this.obstacles) {
            obstacle.draw(this.ctx);
        }
        
        // Draw treasures
        for (let treasure of this.treasures) {
            treasure.draw(this.ctx);
        }
        
        // Draw enemies
        for (let enemy of this.enemies) {
            enemy.draw(this.ctx);
        }
        
        // Draw player
        this.player.draw(this.ctx);
        
        // Draw UI
        this.drawUI();
    }
    
    drawUI() {
        // Health bar
        const healthWidth = (this.player.health / 100) * 200;
        this.ctx.fillStyle = COLORS.RED;
        this.ctx.fillRect(20, 20, 200, 20);
        this.ctx.fillStyle = COLORS.WHITE;
        this.ctx.fillRect(20, 20, healthWidth, 20);
        this.ctx.strokeStyle = COLORS.BLACK;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(20, 20, 200, 20);
        
        // Text
        this.ctx.fillStyle = COLORS.WHITE;
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Health: ${Math.floor(this.player.health)}`, 20, 65);
        this.ctx.fillText(`Treasure: ${this.player.score}`, 20, 95);
        
        // Instructions
        this.ctx.font = '20px Arial';
        if (this.treasures.length > 0) {
            this.ctx.fillText('Navigate the maze! Collect treasure! Avoid goblins!', 20, SCREEN_HEIGHT - 60);
        } else {
            this.ctx.fillStyle = COLORS.GOLD;
            this.ctx.fillText('All treasure collected! You escaped the maze!', 20, SCREEN_HEIGHT - 60);
        }
        
        this.ctx.fillStyle = COLORS.WHITE;
        this.ctx.fillText('WASD to move, P to pause, ESC to quit', 20, SCREEN_HEIGHT - 30);
        
        if (this.paused) {
            this.ctx.fillStyle = COLORS.RED;
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', SCREEN_WIDTH / 2, 50);
            this.ctx.textAlign = 'left';
        }
        
        if (this.player.health <= 0) {
            this.ctx.fillStyle = COLORS.RED;
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
            this.ctx.textAlign = 'left';
        }
    }
    
    gameLoop(currentTime) {
        if (!this.running) return;
        
        const dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(dt);
        this.draw();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    stop() {
        this.running = false;
    }
}

// Sprite creation functions
function createHeroSprite(direction, frame = 0, ctx) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const spriteCtx = canvas.getContext('2d');
    
    // Base colors
    const skin = '#ffddbb';
    const armor = '#4682b4';
    const cape = '#b22222';
    const sword = '#c0c0c0';
    
    // Animation offset for walking
    const bob = frame % 2 === 1 ? 1 : 0;
    
    if (direction === Direction.DOWN || direction === Direction.IDLE) {
        // Head
        spriteCtx.fillStyle = skin;
        spriteCtx.fillRect(12, 6, 8, 8);
        // Body (armor)
        spriteCtx.fillStyle = armor;
        spriteCtx.fillRect(10, 14, 12, 10);
        // Cape
        spriteCtx.fillStyle = cape;
        spriteCtx.fillRect(8, 16, 16, 8);
        // Legs
        spriteCtx.fillStyle = COLORS.BROWN;
        spriteCtx.fillRect(11, 24 + bob, 3, 6);
        spriteCtx.fillRect(18, 24 + bob, 3, 6);
        // Sword
        spriteCtx.fillStyle = sword;
        spriteCtx.fillRect(24, 12, 2, 12);
        // Eyes
        spriteCtx.fillStyle = COLORS.BLACK;
        spriteCtx.fillRect(13, 8, 1, 1);
        spriteCtx.fillRect(18, 8, 1, 1);
    }
    // Add other directions...
    
    return canvas;
}

function createGoblinSprite(direction, frame = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 24;
    const spriteCtx = canvas.getContext('2d');
    
    // Colors
    const greenSkin = '#4c994c';
    const darkGreen = '#336633';
    const redEyes = '#ff0000';
    
    const bob = frame % 2 === 1 ? 1 : 0;
    
    if (direction === Direction.DOWN || direction === Direction.IDLE) {
        // Head
        spriteCtx.fillStyle = greenSkin;
        spriteCtx.fillRect(8, 4, 8, 6);
        // Ears
        spriteCtx.fillRect(6, 3, 2, 4);
        spriteCtx.fillRect(16, 3, 2, 4);
        // Body
        spriteCtx.fillStyle = darkGreen;
        spriteCtx.fillRect(7, 10, 10, 8);
        // Legs
        spriteCtx.fillStyle = greenSkin;
        spriteCtx.fillRect(8, 18 + bob, 2, 4);
        spriteCtx.fillRect(14, 18 + bob, 2, 4);
        // Eyes
        spriteCtx.fillStyle = redEyes;
        spriteCtx.fillRect(9, 6, 1, 1);
        spriteCtx.fillRect(14, 6, 1, 1);
    }
    // Add other directions...
    
    return canvas;
}

function createTreasureSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 20;
    const spriteCtx = canvas.getContext('2d');
    
    // Chest base
    spriteCtx.fillStyle = COLORS.BROWN;
    spriteCtx.fillRect(2, 8, 20, 12);
    spriteCtx.fillStyle = COLORS.DARK_BROWN;
    spriteCtx.fillRect(2, 8, 20, 2);
    
    // Chest lid
    spriteCtx.fillStyle = COLORS.BROWN;
    spriteCtx.fillRect(2, 4, 20, 6);
    spriteCtx.fillStyle = COLORS.DARK_BROWN;
    spriteCtx.fillRect(2, 4, 20, 2);
    
    // Lock
    spriteCtx.fillStyle = COLORS.GOLD;
    spriteCtx.fillRect(10, 10, 4, 3);
    
    // Decorative studs
    spriteCtx.fillRect(4, 12, 2, 2);
    spriteCtx.fillRect(18, 12, 2, 2);
    
    return canvas;
}

function createWallSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const spriteCtx = canvas.getContext('2d');
    
    // Stone blocks
    spriteCtx.fillStyle = COLORS.STONE_GRAY;
    spriteCtx.fillRect(0, 0, 40, 40);
    spriteCtx.fillStyle = COLORS.GRAY;
    spriteCtx.fillRect(0, 0, 40, 2);
    spriteCtx.fillRect(0, 0, 2, 40);
    
    // Stone texture
    spriteCtx.fillStyle = '#5a5a5a';
    spriteCtx.fillRect(5, 5, 30, 30);
    spriteCtx.fillStyle = '#8c8c8c';
    spriteCtx.fillRect(10, 10, 8, 8);
    spriteCtx.fillRect(22, 22, 8, 8);
    spriteCtx.fillStyle = '#505050';
    spriteCtx.fillRect(18, 8, 6, 6);
    spriteCtx.fillRect(8, 25, 6, 6);
    
    return canvas;
}

// Game entity classes
class AnimatedSprite {
    constructor(x, y, spriteCreator) {
        this.x = x;
        this.y = y;
        this.spriteCreator = spriteCreator;
        this.radius = 16;
        
        // Create animation frames
        this.sprites = {
            [Direction.IDLE]: [spriteCreator(Direction.IDLE, 0)],
            [Direction.UP]: [spriteCreator(Direction.UP, 0), spriteCreator(Direction.UP, 1)],
            [Direction.DOWN]: [spriteCreator(Direction.DOWN, 0), spriteCreator(Direction.DOWN, 1)],
            [Direction.LEFT]: [spriteCreator(Direction.LEFT, 0), spriteCreator(Direction.LEFT, 1)],
            [Direction.RIGHT]: [spriteCreator(Direction.RIGHT, 0), spriteCreator(Direction.RIGHT, 1)]
        };
        
        this.currentDirection = Direction.IDLE;
        this.currentFrame = 0;
        this.animationSpeed = 15;
        this.animationCounter = 0;
    }
    
    draw(ctx) {
        const sprite = this.sprites[this.currentDirection][this.currentFrame];
        ctx.drawImage(sprite, this.x - sprite.width/2, this.y - sprite.height/2);
    }
}

class Player extends AnimatedSprite {
    constructor(x, y) {
        super(x, y, createHeroSprite);
        this.health = 100;
        this.score = 0;
    }
    
    update(dt, keys, obstacles) {
        // Store old position
        const oldX = this.x;
        const oldY = this.y;
        
        // Handle movement
        let dx = 0;
        let dy = 0;
        let newDirection = Direction.IDLE;
        
        // Check for vertical movement
        if (keys['KeyW'] || keys['ArrowUp']) {
            dy = -PLAYER_SPEED * dt;
            newDirection = Direction.UP;
        } else if (keys['KeyS'] || keys['ArrowDown']) {
            dy = PLAYER_SPEED * dt;
            newDirection = Direction.DOWN;
        }
        
        // Check for horizontal movement
        if (keys['KeyA'] || keys['ArrowLeft']) {
            dx = -PLAYER_SPEED * dt;
            newDirection = Direction.LEFT;
        } else if (keys['KeyD'] || keys['ArrowRight']) {
            dx = PLAYER_SPEED * dt;
            newDirection = Direction.RIGHT;
        }
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        // Update position
        this.x += dx;
        this.y += dy;
        
        // Keep player on screen
        this.x = Math.max(16, Math.min(SCREEN_WIDTH - 16, this.x));
        this.y = Math.max(16, Math.min(SCREEN_HEIGHT - 16, this.y));
        
        // Check collision with obstacles
        for (let obstacle of obstacles) {
            if (this.checkCollisionWith(obstacle)) {
                this.x = oldX;
                this.y = oldY;
                break;
            }
        }
        
        // Update animation
        if (newDirection !== Direction.IDLE) {
            this.currentDirection = newDirection;
            this.animationCounter++;
            
            if (this.animationCounter >= this.animationSpeed) {
                this.animationCounter = 0;
                this.currentFrame = (this.currentFrame + 1) % this.sprites[this.currentDirection].length;
            }
        } else {
            this.currentDirection = Direction.IDLE;
            this.currentFrame = 0;
        }
    }
    
    checkCollisionWith(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.radius + other.radius);
    }
}

class Enemy extends AnimatedSprite {
    constructor(x, y) {
        super(x, y, createGoblinSprite);
        this.speed = ENEMY_SPEED;
        this.radius = 12;
        this.directionTimer = 0;
        this.currentDirection = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT][Math.floor(Math.random() * 4)];
    }
    
    update(dt, player, obstacles) {
        // Simple AI: move toward player with occasional random movement
        this.directionTimer += dt;
        
        if (this.directionTimer >= 3.0) {
            this.directionTimer = 0;
            // 70% chance to move toward player, 30% random
            if (Math.random() < 0.7) {
                // Move toward player
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.currentDirection = dx > 0 ? Direction.RIGHT : Direction.LEFT;
                } else {
                    this.currentDirection = dy > 0 ? Direction.DOWN : Direction.UP;
                }
            } else {
                // Random direction
                this.currentDirection = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT][Math.floor(Math.random() * 4)];
            }
        }
        
        // Store old position
        const oldX = this.x;
        const oldY = this.y;
        
        // Move based on current direction
        let dx = 0;
        let dy = 0;
        
        if (this.currentDirection === Direction.UP) {
            dy = -this.speed * dt;
        } else if (this.currentDirection === Direction.DOWN) {
            dy = this.speed * dt;
        } else if (this.currentDirection === Direction.LEFT) {
            dx = -this.speed * dt;
        } else if (this.currentDirection === Direction.RIGHT) {
            dx = this.speed * dt;
        }
        
        this.x += dx;
        this.y += dy;
        
        // Keep on screen
        this.x = Math.max(12, Math.min(SCREEN_WIDTH - 12, this.x));
        this.y = Math.max(12, Math.min(SCREEN_HEIGHT - 12, this.y));
        
        // Check collision with obstacles
        for (let obstacle of obstacles) {
            if (this.checkCollisionWith(obstacle)) {
                this.x = oldX;
                this.y = oldY;
                this.currentDirection = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT][Math.floor(Math.random() * 4)];
                break;
            }
        }
        
        // Update animation
        this.animationCounter++;
        if (this.animationCounter >= this.animationSpeed) {
            this.animationCounter = 0;
            this.currentFrame = (this.currentFrame + 1) % this.sprites[this.currentDirection].length;
        }
    }
    
    checkCollisionWith(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.radius + other.radius);
    }
}

class Treasure {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.sprite = createTreasureSprite();
    }
    
    draw(ctx) {
        ctx.drawImage(this.sprite, this.x - this.sprite.width/2, this.y - this.sprite.height/2);
    }
}

class Obstacle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.sprite = createWallSprite();
    }
    
    draw(ctx) {
        ctx.drawImage(this.sprite, this.x - this.sprite.width/2, this.y - this.sprite.height/2);
    }
}

// Export for use in HTML
window.FantasyGame = FantasyGame;