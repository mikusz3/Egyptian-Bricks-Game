const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 20;

const brickRowCount = 5;
const brickColumnCount = 8;
const brickWidth = (canvas.width - (brickColumnCount + 1) * 10) / brickColumnCount;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 10;

const paddleHeight = 20;
const paddleWidth = 100;
let paddleX = (canvas.width - paddleWidth) / 2;

const ballRadius = 10;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2;
let dy = -2;

let rightPressed = false;
let leftPressed = false;
let isPaused = false;
let score = 0;
let lives = 3;
let powerUpActive = false;
let powerUpCooldown = false;
let bullets = [];
let waiting = false;
let currentStage = 1;

let bricks = [];

// Sound effects
const ballTapSound = document.getElementById('ballTapSound');
const brickBreakSound = document.getElementById('brickBreakSound');
const lifeLostSound = document.getElementById('lifeLostSound');
const powerUpSound = document.getElementById('powerUpSound');
const shootingSound = document.getElementById('shootingSound');
const stageCompleteSound = document.getElementById('stageCompleteSound');
const backgroundMusic = document.getElementById('backgroundMusic');

// Ensure background music continues playing
window.onload = function() {
    const musicPlaying = window.localStorage.getItem('musicPlaying');
    const musicPaused = window.localStorage.getItem('musicPaused');
    if (musicPlaying !== 'true' || musicPaused === 'true') {
        backgroundMusic.play();
        window.localStorage.setItem('musicPlaying', 'true');
        window.localStorage.setItem('musicPaused', 'false');
    }
};

// Paddle movement based on device tilt
window.addEventListener('deviceorientation', (event) => {
    const tiltLR = event.gamma; // Left-to-right tilt in degrees
    if (tiltLR > 10) {
        rightPressed = true;
        leftPressed = false;
    } else if (tiltLR < -10) {
        leftPressed = true;
        rightPressed = false;
    } else {
        leftPressed = false;
        rightPressed = false;
    }
});

function generateRandomStage() {
    const urlParams = new URLSearchParams(window.location.search);
    currentStage = parseInt(urlParams.get('stage')) || 1;

    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
            const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
            const randomColorIndex = Math.floor(Math.random() * 3);
            bricks[c][r] = {
                x: brickX,
                y: brickY,
                status: 1,
                color: randomColorIndex === 0 ? '#ff6666' : randomColorIndex === 1 ? '#66ff66' : '#6666ff'
            };
        }
    }
}

function resetBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = 1;
        }
    }
}

function drawBricks() {
    let allBricksBroken = true;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status == 1) {
                const brick = bricks[c][r];
                ctx.fillStyle = brick.color;
                ctx.fillRect(brick.x, brick.y, brickWidth, brickHeight);
                ctx.strokeStyle = '#fff';
                ctx.strokeRect(brick.x, brick.y, brickWidth, brickHeight);
                allBricksBroken = false;
            }
        }
    }
    if (allBricksBroken) {
        stageCompleted();
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
}

function drawBullets() {
    ctx.fillStyle = '#ff0';
    bullets.forEach((bullet, index) => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        bullet.y -= 5;

        // Check collision with bricks
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                const b = bricks[c][r];
                if (b.status == 1) {
                    if (bullet.x > b.x && bullet.x < b.x + brickWidth && bullet.y > b.y && bullet.y < b.y + brickHeight) {
                        b.status = 0;
                        bullets.splice(index, 1);
                        score += 10;
                        brickBreakSound.play();
                        break;
                    }
                }
            }
        }

        // Remove bullets that are off the screen
        if (bullet.y < 0) {
            bullets.splice(index, 1);
        }
    });
}

function draw() {
    if (!isPaused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBricks();
        drawBall();
        drawPaddle();
        drawBullets();
        drawScore();
        drawLives();
        if (!waiting) {
            moveBall();
        }
        movePaddle();
        requestAnimationFrame(draw);
    }
}

function moveBall() {
    x += dx;
    y += dy;

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
        ballTapSound.play();
    }
    if (y + dy < ballRadius) {
        dy = -dy;
        ballTapSound.play();
    } else if (y + dy > canvas.height - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
            ballTapSound.play();
        } else {
            lives--;
            lifeLostSound.play();
            if (lives <= 0) {
                gameOver();
            } else {
                isPaused = true;
                waiting = true;
                setTimeout(() => {
                    x = canvas.width / 2;
                    y = canvas.height - 30;
                    dx = 2;
                    dy = -2;
                    paddleX = (canvas.width - paddleWidth) / 2;
                    resetBricks();
                    isPaused = false;
                    waiting = false;
                    draw();
                }, 5000);
            }
        }
    }

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status == 1) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.status = 0;
                    score += 10;
                    brickBreakSound.play();
                    setTimeout(() => regenerateBrick(c, r), Math.random() * 60000 + 60000);
                }
            }
        }
    }
}

function movePaddle() {
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
    }

    if (powerUpActive && bullets.length < 5) {
        bullets.push({ x: paddleX, y: canvas.height - paddleHeight });
        bullets.push({ x: paddleX + paddleWidth, y: canvas.height - paddleHeight });
        shootingSound.play();
    }
}

function drawScore() {
    document.getElementById('score').innerText = `Score: ${score}`;
}

function drawLives() {
    ctx.font = '16px Comic Neue, Dancing Script';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Lives: ${lives}`, canvas.width - 65, 20);
}

function gameOver() {
    isPaused = true;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function stageCompleted() {
    isPaused = true;
    stageCompleteSound.play();
    document.getElementById('stageCompletedScreen').classList.remove('hidden');
}

document.getElementById('retryButton').addEventListener('click', () => {
    location.reload();
});

document.getElementById('stageSelectButton').addEventListener('click', () => {
    window.location.href = 'stage-select-mobile.html';
});

document.getElementById('titleScreenButton').addEventListener('click', () => {
    window.location.href = 'index-mobile.html';
});

document.getElementById('nextStageButton').addEventListener('click', () => {
    currentStage++;
    location.href = `game-mobile.html?stage=${currentStage}`;
});

document.getElementById('stageSelectButton2').addEventListener('click', () => {
    window.location.href = 'stage-select-mobile.html';
});

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

function keyDownHandler(e) {
    if (e.key == 'Right' || e.key == 'ArrowRight') {
        rightPressed = true;
    } else if (e.key == 'Left' || e.key == 'ArrowLeft') {
        leftPressed = true;
    } else if (e.key == 'Enter') {
        togglePause();
    }
}

function keyUpHandler(e) {
    if (e.key == 'Right' || e.key == 'ArrowRight') {
        rightPressed = false;
    } else if (e.key == 'Left' || e.key == 'ArrowLeft') {
        leftPressed = false;
    }
}

document.getElementById('pauseButton').addEventListener('click', togglePause);

function togglePause() {
    isPaused = !isPaused;
    if (!isPaused) {
        draw();
    }
}

document.getElementById('powerUpButton').addEventListener('click', activatePowerUp);

function activatePowerUp() {
    if (!powerUpActive && !powerUpCooldown) {
        powerUpActive = true;
        powerUpCooldown = true;
        powerUpSound.play();
        setTimeout(deactivatePowerUp, 5000);
        setTimeout(() => powerUpCooldown = false, 10000);
    }
}

function deactivatePowerUp() {
    powerUpActive = false;
}

function regenerateBrick(c, r) {
    bricks[c][r].status = 1;
}

generateRandomStage();
draw();
