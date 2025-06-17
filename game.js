// متغيرات اللعبة الأساسية
let gameState = 'menu'; // menu, playing, paused, gameOver, shop
let canvas, ctx;
let gameData = {
    score: 0,
    coins: 0,
    distance: 0,
    bestScore: 0,
    totalCoins: 0,
    selectedCharacter: 'runner1',
    unlockedCharacters: ['runner1', 'runner2'],
    purchasedItems: [],
    currentTheme: 'default'
};

// متغيرات اللاعب
let player = {
    x: 400,
    y: 450,
    width: 40,
    height: 60,
    lane: 1, // 0=يسار, 1=وسط, 2=يمين
    isJumping: false,
    isSliding: false,
    jumpHeight: 0,
    jumpSpeed: 0,
    slideTimer: 0,
    speed: 5,
    character: 'runner1'
};

// متغيرات اللعبة
let gameSpeed = 3;
let obstacles = [];
let coins = [];
let powerUps = [];
let particles = [];
let backgroundElements = [];

// إعدادات المسارات
const lanes = [300, 400, 500];
const laneWidth = 100;

// فئات الكائنات
class Obstacle {
    constructor(x, y, lane, type = 'barrier') {
        this.x = x;
        this.y = y;
        this.lane = lane;
        this.type = type;
        this.width = 60;
        this.height = type === 'low' ? 40 : 80;
        this.color = type === 'low' ? '#8B4513' : '#FF4444';
        this.passed = false;
    }

    update() {
        this.x -= gameSpeed;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // إضافة تفاصيل بصرية
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
        
        // رسم أيقونة حسب النوع
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        const icon = this.type === 'low' ? '🚧' : '🚫';
        ctx.fillText(icon, this.x + this.width/2, this.y + this.height/2 + 7);
    }

    checkCollision(playerObj) {
        return this.x < playerObj.x + playerObj.width &&
               this.x + this.width > playerObj.x &&
               this.y < playerObj.y + playerObj.height &&
               this.y + this.height > playerObj.y;
    }
}

class Coin {
    constructor(x, y, lane) {
        this.x = x;
        this.y = y;
        this.lane = lane;
        this.width = 30;
        this.height = 30;
        this.collected = false;
        this.rotation = 0;
        this.value = 10;
    }

    update() {
        this.x -= gameSpeed;
        this.rotation += 0.1;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        
        // رسم العملة
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // رسم رمز العملة
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💰', 0, 4);
        
        ctx.restore();
    }

    checkCollision(playerObj) {
        const distance = Math.sqrt(
            Math.pow(this.x + this.width/2 - (playerObj.x + playerObj.width/2), 2) +
            Math.pow(this.y + this.height/2 - (playerObj.y + playerObj.height/2), 2)
        );
        return distance < 25;
    }
}

class PowerUp {
    constructor(x, y, lane, type) {
        this.x = x;
        this.y = y;
        this.lane = lane;
        this.type = type; // speed, shield, magnet
        this.width = 40;
        this.height = 40;
        this.collected = false;
        this.pulse = 0;
    }

    update() {
        this.x -= gameSpeed;
        this.pulse += 0.1;
    }

    draw() {
        const scale = 1 + Math.sin(this.pulse) * 0.1;
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.scale(scale, scale);
        
        // رسم القوة الخاصة
        ctx.fillStyle = this.getColor();
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // رسم الأيقونة
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.getIcon(), 0, 5);
        
        ctx.restore();
    }

    getColor() {
        switch(this.type) {
            case 'speed': return '#00FF00';
            case 'shield': return '#0080FF';
            case 'magnet': return '#FF8000';
            default: return '#FFFFFF';
        }
    }

    getIcon() {
        switch(this.type) {
            case 'speed': return '⚡';
            case 'shield': return '🛡️';
            case 'magnet': return '🧲';
            default: return '?';
        }
    }

    checkCollision(playerObj) {
        const distance = Math.sqrt(
            Math.pow(this.x + this.width/2 - (playerObj.x + playerObj.width/2), 2) +
            Math.pow(this.y + this.height/2 - (playerObj.y + playerObj.height/2), 2)
        );
        return distance < 30;
    }
}

class Particle {
    constructor(x, y, color, size, velocity) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.velocity = velocity;
        this.life = 1.0;
        this.decay = 0.02;
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.life -= this.decay;
        this.size *= 0.98;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0 || this.size <= 0;
    }
}

// تهيئة اللعبة
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // تحميل البيانات المحفوظة
    loadGameData();
    updateUI();
    
    // إعداد أحداث الأزرار
    setupEventListeners();
    
    // بدء حلقة اللعبة
    gameLoop();
}

// إعداد أحداث الأزرار
function setupEventListeners() {
    // أزرار القائمة الرئيسية
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('shopBtn').addEventListener('click', openShop);
    
    // أزرار التحكم
    document.getElementById('jumpBtn').addEventListener('click', () => jump());
    document.getElementById('slideBtn').addEventListener('click', () => slide());
    document.getElementById('leftBtn').addEventListener('click', () => moveLeft());
    document.getElementById('rightBtn').addEventListener('click', () => moveRight());
    
    // أزرار المتجر
    document.getElementById('backToMenuBtn').addEventListener('click', backToMenu);
    
    // أزرار انتهاء اللعبة
    document.getElementById('playAgainBtn').addEventListener('click', startGame);
    document.getElementById('mainMenuBtn').addEventListener('click', backToMenu);
    
    // اختيار الشخصيات
    document.querySelectorAll('.character').forEach(char => {
        char.addEventListener('click', function() {
            if (!this.classList.contains('locked')) {
                selectCharacter(this.dataset.character);
            }
        });
    });
    
    // أزرار فئات المتجر
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchShopCategory(this.dataset.category);
        });
    });
    
    // أزرار الشراء
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            buyItem(this.dataset.item, parseInt(this.dataset.price));
        });
    });
    
    // التحكم بلوحة المفاتيح
    document.addEventListener('keydown', handleKeyPress);
    
    // التحكم باللمس للهواتف
    setupTouchControls();
}

// التحكم بلوحة المفاتيح
function handleKeyPress(event) {
    if (gameState !== 'playing') return;
    
    switch(event.code) {
        case 'Space':
        case 'ArrowUp':
            event.preventDefault();
            jump();
            break;
        case 'ArrowDown':
            event.preventDefault();
            slide();
            break;
        case 'ArrowLeft':
            event.preventDefault();
            moveLeft();
            break;
        case 'ArrowRight':
            event.preventDefault();
            moveRight();
            break;
    }
}

// التحكم باللمس
function setupTouchControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        if (gameState !== 'playing') return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // حركة أفقية
            if (deltaX > 30) {
                moveRight();
            } else if (deltaX < -30) {
                moveLeft();
            }
        } else {
            // حركة عمودية
            if (deltaY < -30) {
                jump();
            } else if (deltaY > 30) {
                slide();
            }
        }
    });
}

// حركات اللاعب
function jump() {
    if (!player.isJumping && !player.isSliding) {
        player.isJumping = true;
        player.jumpSpeed = 15;
        createParticles(player.x + player.width/2, player.y + player.height, '#FFFFFF', 5);
    }
}

function slide() {
    if (!player.isSliding && !player.isJumping) {
        player.isSliding = true;
        player.slideTimer = 30;
        createParticles(player.x + player.width/2, player.y + player.height, '#FFFF00', 5);
    }
}

function moveLeft() {
    if (player.lane > 0) {
        player.lane--;
        player.x = lanes[player.lane];
        createParticles(player.x + player.width, player.y + player.height/2, '#00FF00', 3);
    }
}

function moveRight() {
    if (player.lane < 2) {
        player.lane++;
        player.x = lanes[player.lane];
        createParticles(player.x, player.y + player.height/2, '#00FF00', 3);
    }
}

// إنشاء الجسيمات
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(
            x + (Math.random() - 0.5) * 20,
            y + (Math.random() - 0.5) * 20,
            color,
            Math.random() * 5 + 2,
            {
                x: (Math.random() - 0.5) * 4,
                y: (Math.random() - 0.5) * 4
            }
        ));
    }
}

// بدء اللعبة
function startGame() {
    gameState = 'playing';
    resetGameVariables();
    showScreen('gameScreen');
    generateInitialElements();
}

// إعادة تعيين متغيرات اللعبة
function resetGameVariables() {
    gameData.score = 0;
    gameData.coins = 0;
    gameData.distance = 0;
    gameSpeed = 3;
    
    player.x = lanes[1];
    player.y = 450;
    player.lane = 1;
    player.isJumping = false;
    player.isSliding = false;
    player.jumpHeight = 0;
    player.jumpSpeed = 0;
    player.slideTimer = 0;
    
    obstacles = [];
    coins = [];
    powerUps = [];
    particles = [];
    backgroundElements = [];
}

// إنشاء العناصر الأولية
function generateInitialElements() {
    // إنشاء عوائق أولية
    for (let i = 0; i < 3; i++) {
        spawnObstacle();
    }
    
    // إنشاء عملات أولية
    for (let i = 0; i < 5; i++) {
        spawnCoin();
    }
}

// إنشاء عائق جديد
function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    const x = canvas.width + Math.random() * 200;
    const type = Math.random() < 0.3 ? 'low' : 'barrier';
    const y = type === 'low' ? 470 : 430;
    
    obstacles.push(new Obstacle(x, y, lane, type));
}

// إنشاء عملة جديدة
function spawnCoin() {
    const lane = Math.floor(Math.random() * 3);
    const x = canvas.width + Math.random() * 300;
    const y = 400 + Math.random() * 50;
    
    coins.push(new Coin(x, y, lane));
}

// إنشاء قوة خاصة
function spawnPowerUp() {
    if (Math.random() < 0.02) { // 2% احتمال
        const lane = Math.floor(Math.random() * 3);
        const x = canvas.width + 100;
        const y = 420;
        const types = ['speed', 'shield', 'magnet'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        powerUps.push(new PowerUp(x, y, lane, type));
    }
}

// تحديث اللعبة
function updateGame() {
    if (gameState !== 'playing') return;
    
    // تحديث اللاعب
    updatePlayer();
    
    // تحديث العوائق
    updateObstacles();
    
    // تحديث العملات
    updateCoins();
    
    // تحديث القوى الخاصة
    updatePowerUps();
    
    // تحديث الجسيمات
    updateParticles();
    
    // إنشاء عناصر جديدة
    spawnNewElements();
    
    // تحديث النقاط والمسافة
    updateScore();
    
    // زيادة السرعة تدريجياً
    gameSpeed += 0.001;
    
    // تحديث واجهة المستخدم
    updateGameUI();
}

// تحديث اللاعب
function updatePlayer() {
    // تحديث القفز
    if (player.isJumping) {
        player.jumpHeight += player.jumpSpeed;
        player.jumpSpeed -= 0.8; // الجاذبية
        
        if (player.jumpHeight <= 0) {
            player.jumpHeight = 0;
            player.isJumping = false;
            player.jumpSpeed = 0;
        }
    }
    
    // تحديث الانزلاق
    if (player.isSliding) {
        player.slideTimer--;
        if (player.slideTimer <= 0) {
            player.isSliding = false;
        }
    }
    
    // تحديث موقع اللاعب
    player.y = 450 - player.jumpHeight;
    if (player.isSliding) {
        player.y += 20;
        player.height = 40;
    } else {
        player.height = 60;
    }
}

// تحديث العوائق
function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();
        
        // فحص التصادم
        if (obstacles[i].checkCollision(player)) {
            gameOver();
            return;
        }
        
        // إزالة العوائق التي خرجت من الشاشة
        if (obstacles[i].x + obstacles[i].width < 0) {
            if (!obstacles[i].passed) {
                gameData.score += 10;
                obstacles[i].passed = true;
            }
            obstacles.splice(i, 1);
        }
    }
}

// تحديث العملات
function updateCoins() {
    for (let i = coins.length - 1; i >= 0; i--) {
        coins[i].update();
        
        // فحص التجميع
        if (coins[i].checkCollision(player) && !coins[i].collected) {
            coins[i].collected = true;
            gameData.coins += coins[i].value;
            gameData.totalCoins += coins[i].value;
            createParticles(coins[i].x, coins[i].y, '#FFD700', 8);
            coins.splice(i, 1);
        }
        
        // إزالة العملات التي خرجت من الشاشة
        else if (coins[i].x + coins[i].width < 0) {
            coins.splice(i, 1);
        }
    }
}

// تحديث القوى الخاصة
function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].update();
        
        // فحص التجميع
        if (powerUps[i].checkCollision(player) && !powerUps[i].collected) {
            powerUps[i].collected = true;
            activatePowerUp(powerUps[i].type);
            createParticles(powerUps[i].x, powerUps[i].y, powerUps[i].getColor(), 10);
            powerUps.splice(i, 1);
        }
        
        // إزالة القوى التي خرجت من الشاشة
        else if (powerUps[i].x + powerUps[i].width < 0) {
            powerUps.splice(i, 1);
        }
    }
}

// تحديث الجسيمات
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }
}

// إنشاء عناصر جديدة
function spawnNewElements() {
    // إنشاء عوائق
    if (Math.random() < 0.02) {
        spawnObstacle();
    }
    
    // إنشاء عملات
    if (Math.random() < 0.03) {
        spawnCoin();
    }
    
    // إنشاء قوى خاصة
    spawnPowerUp();
}

// تحديث النقاط
function updateScore() {
    gameData.distance += gameSpeed;
    gameData.score += Math.floor(gameSpeed);
}

// تحديث واجهة اللعبة
function updateGameUI() {
    document.getElementById('currentScore').textContent = gameData.score;
    document.getElementById('gameCoins').textContent = gameData.coins;
    document.getElementById('distance').textContent = Math.floor(gameData.distance);
}

// تفعيل القوة الخاصة
function activatePowerUp(type) {
    switch(type) {
        case 'speed':
            gameSpeed *= 1.5;
            setTimeout(() => gameSpeed /= 1.5, 5000);
            showNotification('تسارع فائق! ⚡');
            break;
        case 'shield':
            // تطبيق الحماية
            showNotification('درع الحماية نشط! 🛡️');
            break;
        case 'magnet':
            // جذب العملات
            showNotification('مغناطيس العملات! 🧲');
            break;
    }
}

// انتهاء اللعبة
function gameOver() {
    gameState = 'gameOver';
    
    // تحديث أفضل نتيجة
    if (gameData.score > gameData.bestScore) {
        gameData.bestScore = gameData.score;
    }
    
    // حفظ البيانات
    saveGameData();
    
    // عرض شاشة انتهاء اللعبة
    showGameOverScreen();
}

// عرض شاشة انتهاء اللعبة
function showGameOverScreen() {
    document.getElementById('finalScore').textContent = gameData.score;
    document.getElementById('earnedCoins').textContent = gameData.coins;
    document.getElementById('finalDistance').textContent = Math.floor(gameData.distance) + 'م';
    
    // عرض الإنجازات
    showAchievements();
    
    showScreen('gameOverScreen');
}

// عرض الإنجازات
function showAchievements() {
    const achievementsDiv = document.getElementById('achievements');
    achievementsDiv.innerHTML = '';
    
    const achievements = [];
    
    if (gameData.score > 1000) achievements.push('🏆 نقاط عالية!');
    if (gameData.distance > 5000) achievements.push('🏃‍♂️ عداء ماراثون!');
    if (gameData.coins > 100) achievements.push('💰 جامع العملات!');
    
    achievements.forEach(achievement => {
        const div = document.createElement('div');
        div.className = 'achievement';
        div.textContent = achievement;
        achievementsDiv.appendChild(div);
    });
}

// رسم اللعبة
function drawGame() {
    // مسح الشاشة
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // رسم الخلفية
    drawBackground();
    
    // رسم المسارات
    drawLanes();
    
    // رسم العوائق
    obstacles.forEach(obstacle => obstacle.draw());
    
    // رسم العملات
    coins.forEach(coin => coin.draw());
    
    // رسم القوى الخاصة
    powerUps.forEach(powerUp => powerUp.draw());
    
    // رسم اللاعب
    drawPlayer();
    
    // رسم الجسيمات
    particles.forEach(particle => particle.draw());
}

// رسم الخلفية
function drawBackground() {
    // رسم السماء
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // رسم الغيوم
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 5; i++) {
        const x = (i * 200 - gameData.distance * 0.1) % (canvas.width + 100);
        const y = 50 + i * 30;
        drawCloud(x, y);
    }
    
    // رسم المباني
    ctx.fillStyle = 'rgba(100, 100, 100, 0.6)';
    for (let i = 0; i < 10; i++) {
        const x = (i * 150 - gameData.distance * 0.2) % (canvas.width + 200);
        const height = 100 + Math.sin(i) * 50;
        ctx.fillRect(x, canvas.height - height - 100, 80, height);
    }
}

// رسم غيمة
function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 15, y - 15, 15, 0, Math.PI * 2);
    ctx.arc(x + 35, y - 15, 15, 0, Math.PI * 2);
    ctx.fill();
}

// رسم المسارات
function drawLanes() {
    // رسم الأرض
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 500, canvas.width, 100);
    
    // رسم خطوط المسارات
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    
    for (let i = 0; i < 4; i++) {
        const x = 250 + i * 100;
        ctx.beginPath();
        ctx.moveTo(x, 500);
        ctx.lineTo(x, 600);
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
}

// رسم اللاعب
function drawPlayer() {
    const characterEmoji = getCharacterEmoji(gameData.selectedCharacter);
    
    ctx.save();
    
    // تأثير الانزلاق
    if (player.isSliding) {
        ctx.translate(player.x + player.width/2, player.y + player.height/2);
        ctx.rotate(-0.3);
        ctx.translate(-player.width/2, -player.height/2);
    }
    
    // رسم ظل اللاعب
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(player.x + 5, 495, player.width, 10);
    
    // رسم اللاعب
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // رسم الشخصية
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(characterEmoji, player.x + player.width/2, player.y + player.height/2 + 10);
    
    ctx.restore();
}

// الحصول على رمز الشخصية
function getCharacterEmoji(character) {
    switch(character) {
        case 'runner1': return '🏃‍♂️';
        case 'runner2': return '🏃‍♀️';
        case 'runner3': return '🦸‍♂️';
        case 'ninja': return '🥷';
        default: return '🏃‍♂️';
    }
}

// حلقة اللعبة الرئيسية
function gameLoop() {
    updateGame();
    drawGame();
    requestAnimationFrame(gameLoop);
}

// تحديث واجهة المستخدم
function updateUI() {
    document.getElementById('bestScore').textContent = gameData.bestScore;
    document.getElementById('totalCoins').textContent = gameData.totalCoins;
    document.getElementById('shopCoins').textContent = gameData.totalCoins;
    
    // تحديث الشخصيات المفتوحة
    updateCharacterSelection();
}

// تحديث اختيار الشخصيات
function updateCharacterSelection() {
    document.querySelectorAll('.character').forEach(char => {
        const character = char.dataset.character;
        if (gameData.unlockedCharacters.includes(character)) {
            char.classList.remove('locked');
        } else {
            char.classList.add('locked');
        }
        
        if (character === gameData.selectedCharacter) {
            char.classList.add('active');
        } else {
            char.classList.remove('active');
        }
    });
}

// اختيار شخصية
function selectCharacter(character) {
    if (gameData.unlockedCharacters.includes(character)) {
        gameData.selectedCharacter = character;
        player.character = character;
        updateCharacterSelection();
        saveGameData();
    }
}

// فتح المتجر
function openShop() {
    gameState = 'shop';
    showScreen('shopScreen');
    updateShopUI();
}

// العودة للقائمة الرئيسية
function backToMenu() {
    gameState = 'menu';
    showScreen('startScreen');
    updateUI();
}

// تبديل فئة المتجر
function switchShopCategory(category) {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    document.querySelectorAll('.shop-category').forEach(cat => {
        cat.classList.add('hidden');
    });
    document.getElementById(`${category}-shop`).classList.remove('hidden');
}

// شراء عنصر
function buyItem(item, price) {
    if (gameData.totalCoins >= price && !gameData.purchasedItems.includes(item)) {
        gameData.totalCoins -= price;
        gameData.purchasedItems.push(item);
        
        // إضافة العنصر حسب نوعه
        if (['runner3', 'ninja'].includes(item)) {
            gameData.unlockedCharacters.push(item);
        }
        
        saveGameData();
        updateShopUI();
        updateUI();
        showNotification(`تم شراء ${item} بنجاح! 🎉`);
    } else if (gameData.totalCoins < price) {
        showNotification('عملات غير كافية! 💰');
    } else {
        showNotification('تم شراء هذا العنصر مسبقاً! ✅');
    }
}

// تحديث واجهة المتجر
function updateShopUI() {
    document.getElementById('shopCoins').textContent = gameData.totalCoins;
    
    document.querySelectorAll('.buy-btn').forEach(btn => {
        const item = btn.dataset.item;
        const price = parseInt(btn.dataset.price);
        
        if (gameData.purchasedItems.includes(item)) {
            btn.textContent = 'مُشترى';
            btn.disabled = true;
        } else if (gameData.totalCoins < price) {
            btn.textContent = 'عملات غير كافية';
            btn.disabled = true;
        } else {
            btn.textContent = 'شراء';
            btn.disabled = false;
        }
    });
}

// عرض الشاشة
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

// عرض إشعار
function showNotification(message) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.textContent = message;
    notification.classList.remove('hidden');
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 300);
    }, 3000);
}

// حفظ بيانات اللعبة
function saveGameData() {
    localStorage.setItem('subwayGameData', JSON.stringify(gameData));
}

// تحميل بيانات اللعبة
function loadGameData() {
    const saved = localStorage.getItem('subwayGameData');
    if (saved) {
        const savedData = JSON.parse(saved);
        gameData = { ...gameData, ...savedData };
    }
}

// بدء اللعبة عند تحميل الصفحة
window.addEventListener('load', initGame);


// نظام الشخصيات المتقدم
const characterStats = {
    runner1: {
        name: 'العداء الأزرق',
        emoji: '🏃‍♂️',
        speed: 1.0,
        jumpHeight: 1.0,
        coinMagnet: 1.0,
        price: 0,
        description: 'شخصية متوازنة للمبتدئين'
    },
    runner2: {
        name: 'العداءة الوردية',
        emoji: '🏃‍♀️',
        speed: 1.1,
        jumpHeight: 0.9,
        coinMagnet: 1.2,
        price: 0,
        description: 'سريعة وتجمع العملات بكفاءة'
    },
    runner3: {
        name: 'البطل الخارق',
        emoji: '🦸‍♂️',
        speed: 0.9,
        jumpHeight: 1.3,
        coinMagnet: 1.0,
        price: 500,
        description: 'قفزات عالية وقوة خارقة'
    },
    ninja: {
        name: 'النينجا السريع',
        emoji: '🥷',
        speed: 1.4,
        jumpHeight: 1.1,
        coinMagnet: 0.8,
        price: 1000,
        description: 'أسرع شخصية في اللعبة'
    },
    robot: {
        name: 'الروبوت المعدني',
        emoji: '🤖',
        speed: 0.8,
        jumpHeight: 0.8,
        coinMagnet: 1.5,
        price: 1500,
        description: 'مقاوم للعوائق ومغناطيس قوي'
    }
};

// نظام النقاط المتقدم
const scoreSystem = {
    baseScore: 1,
    obstacleBonus: 10,
    coinValue: 5,
    distanceMultiplier: 0.1,
    comboMultiplier: 1.0,
    maxCombo: 10,
    currentCombo: 0,
    
    // حساب النقاط
    calculateScore(action, distance = 0) {
        let score = 0;
        
        switch(action) {
            case 'distance':
                score = Math.floor(distance * this.distanceMultiplier);
                break;
            case 'obstacle':
                score = this.obstacleBonus * this.comboMultiplier;
                this.increaseCombo();
                break;
            case 'coin':
                score = this.coinValue * this.comboMultiplier;
                this.increaseCombo();
                break;
            case 'powerup':
                score = 20 * this.comboMultiplier;
                this.increaseCombo();
                break;
        }
        
        return Math.floor(score);
    },
    
    // زيادة الكومبو
    increaseCombo() {
        this.currentCombo = Math.min(this.currentCombo + 1, this.maxCombo);
        this.comboMultiplier = 1 + (this.currentCombo * 0.1);
    },
    
    // إعادة تعيين الكومبو
    resetCombo() {
        this.currentCombo = 0;
        this.comboMultiplier = 1.0;
    }
};

// نظام الإنجازات
const achievementSystem = {
    achievements: {
        firstRun: {
            name: 'أول جولة',
            description: 'أكمل أول جولة لك',
            icon: '🏃‍♂️',
            unlocked: false,
            condition: (stats) => stats.gamesPlayed >= 1
        },
        speedDemon: {
            name: 'شيطان السرعة',
            description: 'اجمع 100 عملة في جولة واحدة',
            icon: '⚡',
            unlocked: false,
            condition: (stats) => stats.maxCoinsInRun >= 100
        },
        highJumper: {
            name: 'القافز العالي',
            description: 'اقفز 50 مرة في جولة واحدة',
            icon: '🦘',
            unlocked: false,
            condition: (stats) => stats.jumpsInRun >= 50
        },
        coinCollector: {
            name: 'جامع العملات',
            description: 'اجمع 1000 عملة إجمالية',
            icon: '💰',
            unlocked: false,
            condition: (stats) => stats.totalCoins >= 1000
        },
        marathonRunner: {
            name: 'عداء الماراثون',
            description: 'اقطع مسافة 10000 متر',
            icon: '🏃‍♀️',
            unlocked: false,
            condition: (stats) => stats.maxDistance >= 10000
        },
        survivor: {
            name: 'الناجي',
            description: 'تجنب 100 عائق',
            icon: '🛡️',
            unlocked: false,
            condition: (stats) => stats.obstaclesAvoided >= 100
        }
    },
    
    // فحص الإنجازات
    checkAchievements(stats) {
        const newAchievements = [];
        
        for (const [key, achievement] of Object.entries(this.achievements)) {
            if (!achievement.unlocked && achievement.condition(stats)) {
                achievement.unlocked = true;
                newAchievements.push(achievement);
            }
        }
        
        return newAchievements;
    },
    
    // الحصول على الإنجازات المفتوحة
    getUnlockedAchievements() {
        return Object.values(this.achievements).filter(a => a.unlocked);
    }
};

// إحصائيات اللاعب
let playerStats = {
    gamesPlayed: 0,
    totalScore: 0,
    totalCoins: 0,
    totalDistance: 0,
    maxScore: 0,
    maxCoins: 0,
    maxDistance: 0,
    obstaclesAvoided: 0,
    powerUpsCollected: 0,
    jumpsInRun: 0,
    maxCoinsInRun: 0,
    coinsInCurrentRun: 0,
    currentRunDistance: 0
};

// تحديث إحصائيات اللاعب
function updatePlayerStats(action, value = 1) {
    switch(action) {
        case 'gameStart':
            playerStats.gamesPlayed++;
            playerStats.jumpsInRun = 0;
            playerStats.coinsInCurrentRun = 0;
            playerStats.currentRunDistance = 0;
            break;
        case 'jump':
            playerStats.jumpsInRun++;
            break;
        case 'coin':
            playerStats.coinsInCurrentRun += value;
            playerStats.totalCoins += value;
            break;
        case 'obstacle':
            playerStats.obstaclesAvoided++;
            break;
        case 'powerup':
            playerStats.powerUpsCollected++;
            break;
        case 'distance':
            playerStats.currentRunDistance = value;
            playerStats.totalDistance += 1;
            break;
        case 'gameEnd':
            playerStats.maxScore = Math.max(playerStats.maxScore, gameData.score);
            playerStats.maxCoins = Math.max(playerStats.maxCoins, playerStats.coinsInCurrentRun);
            playerStats.maxDistance = Math.max(playerStats.maxDistance, playerStats.currentRunDistance);
            playerStats.maxCoinsInRun = Math.max(playerStats.maxCoinsInRun, playerStats.coinsInCurrentRun);
            break;
    }
}

// نظام القوى الخاصة المحسن
const powerUpSystem = {
    activePowerUps: new Map(),
    
    // تفعيل قوة خاصة
    activate(type, duration = 5000) {
        const powerUp = {
            type: type,
            startTime: Date.now(),
            duration: duration,
            active: true
        };
        
        this.activePowerUps.set(type, powerUp);
        this.applyEffect(type, true);
        
        // إزالة القوة بعد انتهاء المدة
        setTimeout(() => {
            this.deactivate(type);
        }, duration);
    },
    
    // إلغاء تفعيل قوة خاصة
    deactivate(type) {
        if (this.activePowerUps.has(type)) {
            this.applyEffect(type, false);
            this.activePowerUps.delete(type);
        }
    },
    
    // تطبيق تأثير القوة
    applyEffect(type, activate) {
        switch(type) {
            case 'speed':
                if (activate) {
                    gameSpeed *= 1.5;
                    showNotification('تسارع فائق! ⚡', 'success');
                } else {
                    gameSpeed /= 1.5;
                }
                break;
            case 'shield':
                player.hasShield = activate;
                if (activate) {
                    showNotification('درع الحماية نشط! 🛡️', 'success');
                }
                break;
            case 'magnet':
                player.hasMagnet = activate;
                if (activate) {
                    showNotification('مغناطيس العملات! 🧲', 'success');
                }
                break;
            case 'double_coins':
                player.doubleCoins = activate;
                if (activate) {
                    showNotification('عملات مضاعفة! 💰💰', 'success');
                }
                break;
        }
    },
    
    // فحص القوى النشطة
    isActive(type) {
        return this.activePowerUps.has(type);
    },
    
    // تحديث القوى النشطة
    update() {
        for (const [type, powerUp] of this.activePowerUps) {
            const elapsed = Date.now() - powerUp.startTime;
            if (elapsed >= powerUp.duration) {
                this.deactivate(type);
            }
        }
    }
};

// نظام المستويات
const levelSystem = {
    currentLevel: 1,
    experience: 0,
    experienceToNext: 100,
    
    // إضافة خبرة
    addExperience(amount) {
        this.experience += amount;
        
        while (this.experience >= this.experienceToNext) {
            this.levelUp();
        }
    },
    
    // رفع المستوى
    levelUp() {
        this.experience -= this.experienceToNext;
        this.currentLevel++;
        this.experienceToNext = Math.floor(this.experienceToNext * 1.2);
        
        showNotification(`مستوى جديد! المستوى ${this.currentLevel} 🎉`, 'success');
        
        // مكافآت رفع المستوى
        gameData.totalCoins += this.currentLevel * 10;
        updateUI();
    },
    
    // الحصول على نسبة التقدم
    getProgress() {
        return (this.experience / this.experienceToNext) * 100;
    }
};

// تحسين نظام العملات
function collectCoin(coin) {
    const character = characterStats[gameData.selectedCharacter];
    let coinValue = coin.value;
    
    // تطبيق مضاعف الشخصية
    coinValue = Math.floor(coinValue * character.coinMagnet);
    
    // تطبيق مضاعف العملات المضاعفة
    if (player.doubleCoins) {
        coinValue *= 2;
    }
    
    gameData.coins += coinValue;
    gameData.totalCoins += coinValue;
    updatePlayerStats('coin', coinValue);
    
    // إضافة خبرة
    levelSystem.addExperience(2);
    
    // إضافة نقاط
    const score = scoreSystem.calculateScore('coin');
    gameData.score += score;
    
    // تأثيرات بصرية
    createCoinEffect(coin.x, coin.y, coinValue);
}

// تأثيرات بصرية للعملات
function createCoinEffect(x, y, value) {
    // جسيمات ذهبية
    for (let i = 0; i < 8; i++) {
        particles.push(new Particle(
            x + 15,
            y + 15,
            '#FFD700',
            Math.random() * 4 + 2,
            {
                x: (Math.random() - 0.5) * 6,
                y: (Math.random() - 0.5) * 6
            }
        ));
    }
    
    // نص النقاط
    createFloatingText(x, y, `+${value}`, '#FFD700');
}

// إنشاء نص عائم
function createFloatingText(x, y, text, color) {
    const textParticle = {
        x: x,
        y: y,
        text: text,
        color: color,
        life: 1.0,
        velocity: { x: 0, y: -2 },
        update() {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.life -= 0.02;
        },
        draw() {
            ctx.save();
            ctx.globalAlpha = this.life;
            ctx.fillStyle = this.color;
            ctx.font = 'bold 16px Rubik';
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        },
        isDead() {
            return this.life <= 0;
        }
    };
    
    particles.push(textParticle);
}

// تحسين نظام التصادم مع الدرع
function checkObstacleCollision(obstacle) {
    if (obstacle.checkCollision(player)) {
        if (player.hasShield) {
            // استخدام الدرع
            player.hasShield = false;
            powerUpSystem.deactivate('shield');
            createShieldEffect();
            
            // إزالة العائق
            const index = obstacles.indexOf(obstacle);
            if (index > -1) {
                obstacles.splice(index, 1);
            }
            
            showNotification('الدرع حماك من العائق! 🛡️', 'warning');
            return false; // لا تنهي اللعبة
        } else {
            return true; // انتهاء اللعبة
        }
    }
    return false;
}

// تأثير الدرع
function createShieldEffect() {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(
            player.x + player.width/2,
            player.y + player.height/2,
            '#00BFFF',
            Math.random() * 6 + 3,
            {
                x: (Math.random() - 0.5) * 8,
                y: (Math.random() - 0.5) * 8
            }
        ));
    }
}

// تحسين نظام المغناطيس
function updateCoinMagnet() {
    if (!player.hasMagnet) return;
    
    coins.forEach(coin => {
        const distance = Math.sqrt(
            Math.pow(coin.x - player.x, 2) + 
            Math.pow(coin.y - player.y, 2)
        );
        
        if (distance < 150) {
            // جذب العملة نحو اللاعب
            const angle = Math.atan2(player.y - coin.y, player.x - coin.x);
            coin.x += Math.cos(angle) * 3;
            coin.y += Math.sin(angle) * 3;
        }
    });
}

// تحديث واجهة المستخدم المحسنة
function updateAdvancedUI() {
    // تحديث شريط الخبرة
    const progressBar = document.getElementById('experienceBar');
    if (progressBar) {
        progressBar.style.width = levelSystem.getProgress() + '%';
    }
    
    // تحديث المستوى
    const levelDisplay = document.getElementById('currentLevel');
    if (levelDisplay) {
        levelDisplay.textContent = levelSystem.currentLevel;
    }
    
    // تحديث الكومبو
    const comboDisplay = document.getElementById('comboDisplay');
    if (comboDisplay) {
        if (scoreSystem.currentCombo > 0) {
            comboDisplay.textContent = `كومبو: ${scoreSystem.currentCombo}x`;
            comboDisplay.style.display = 'block';
        } else {
            comboDisplay.style.display = 'none';
        }
    }
    
    // تحديث القوى النشطة
    updateActivePowerUpsDisplay();
}

// عرض القوى النشطة
function updateActivePowerUpsDisplay() {
    const powerUpsContainer = document.getElementById('activePowerUps');
    if (!powerUpsContainer) return;
    
    powerUpsContainer.innerHTML = '';
    
    for (const [type, powerUp] of powerUpSystem.activePowerUps) {
        const remaining = Math.max(0, powerUp.duration - (Date.now() - powerUp.startTime));
        const seconds = Math.ceil(remaining / 1000);
        
        const powerUpElement = document.createElement('div');
        powerUpElement.className = 'active-powerup';
        powerUpElement.innerHTML = `
            <span class="powerup-icon">${getPowerUpIcon(type)}</span>
            <span class="powerup-timer">${seconds}s</span>
        `;
        
        powerUpsContainer.appendChild(powerUpElement);
    }
}

// الحصول على أيقونة القوة الخاصة
function getPowerUpIcon(type) {
    switch(type) {
        case 'speed': return '⚡';
        case 'shield': return '🛡️';
        case 'magnet': return '🧲';
        case 'double_coins': return '💰';
        default: return '?';
    }
}

// تحسين نظام الإشعارات
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    // إضافة فئة النوع
    notification.className = `notification ${type}`;
    notificationText.textContent = message;
    
    notification.classList.remove('hidden');
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 300);
    }, 3000);
}

// حفظ الإحصائيات والإنجازات
function saveAdvancedGameData() {
    const advancedData = {
        ...gameData,
        playerStats: playerStats,
        levelSystem: levelSystem,
        achievements: achievementSystem.achievements
    };
    
    localStorage.setItem('subwayGameAdvanced', JSON.stringify(advancedData));
}

// تحميل الإحصائيات والإنجازات
function loadAdvancedGameData() {
    const saved = localStorage.getItem('subwayGameAdvanced');
    if (saved) {
        const savedData = JSON.parse(saved);
        
        if (savedData.playerStats) {
            playerStats = { ...playerStats, ...savedData.playerStats };
        }
        
        if (savedData.levelSystem) {
            levelSystem.currentLevel = savedData.levelSystem.currentLevel || 1;
            levelSystem.experience = savedData.levelSystem.experience || 0;
            levelSystem.experienceToNext = savedData.levelSystem.experienceToNext || 100;
        }
        
        if (savedData.achievements) {
            for (const [key, achievement] of Object.entries(savedData.achievements)) {
                if (achievementSystem.achievements[key]) {
                    achievementSystem.achievements[key].unlocked = achievement.unlocked;
                }
            }
        }
    }
}


// نظام المتجر المتقدم
const shopSystem = {
    categories: {
        characters: {
            name: 'الشخصيات',
            icon: '👥',
            items: {
                runner3: {
                    name: 'البطل الخارق',
                    description: 'قفزات عالية وقوة خارقة',
                    icon: '🦸‍♂️',
                    price: 500,
                    type: 'character',
                    stats: characterStats.runner3
                },
                ninja: {
                    name: 'النينجا السريع',
                    description: 'أسرع شخصية في اللعبة',
                    icon: '🥷',
                    price: 1000,
                    type: 'character',
                    stats: characterStats.ninja
                },
                robot: {
                    name: 'الروبوت المعدني',
                    description: 'مقاوم للعوائق ومغناطيس قوي',
                    icon: '🤖',
                    price: 1500,
                    type: 'character',
                    stats: characterStats.robot
                }
            }
        },
        powerups: {
            name: 'القوى الخاصة',
            icon: '⚡',
            items: {
                speed_boost: {
                    name: 'تسارع فائق',
                    description: 'زيادة السرعة لمدة 10 ثوان',
                    icon: '⚡',
                    price: 100,
                    type: 'consumable',
                    effect: 'speed',
                    duration: 10000
                },
                shield: {
                    name: 'درع الحماية',
                    description: 'حماية من العوائق لمرة واحدة',
                    icon: '🛡️',
                    price: 150,
                    type: 'consumable',
                    effect: 'shield',
                    duration: 30000
                },
                coin_magnet: {
                    name: 'مغناطيس العملات',
                    description: 'جذب العملات من مسافة بعيدة',
                    icon: '🧲',
                    price: 120,
                    type: 'consumable',
                    effect: 'magnet',
                    duration: 15000
                },
                double_coins: {
                    name: 'عملات مضاعفة',
                    description: 'مضاعفة قيمة العملات المجمعة',
                    icon: '💰',
                    price: 200,
                    type: 'consumable',
                    effect: 'double_coins',
                    duration: 20000
                }
            }
        },
        themes: {
            name: 'الخلفيات',
            icon: '🎨',
            items: {
                night_city: {
                    name: 'مدينة ليلية',
                    description: 'خلفية مدينة جميلة في الليل',
                    icon: '🌃',
                    price: 300,
                    type: 'theme',
                    colors: {
                        sky: ['#1a1a2e', '#16213e'],
                        ground: '#2c3e50',
                        buildings: '#34495e'
                    }
                },
                beach: {
                    name: 'شاطئ استوائي',
                    description: 'خلفية شاطئ مشمس ومريح',
                    icon: '🏖️',
                    price: 400,
                    type: 'theme',
                    colors: {
                        sky: ['#87CEEB', '#FFE4B5'],
                        ground: '#F4A460',
                        buildings: '#DEB887'
                    }
                },
                space: {
                    name: 'الفضاء الخارجي',
                    description: 'مغامرة في أعماق الفضاء',
                    icon: '🚀',
                    price: 600,
                    type: 'theme',
                    colors: {
                        sky: ['#000428', '#004e92'],
                        ground: '#2c3e50',
                        buildings: '#34495e'
                    }
                },
                forest: {
                    name: 'الغابة السحرية',
                    description: 'جري عبر غابة خضراء جميلة',
                    icon: '🌲',
                    price: 350,
                    type: 'theme',
                    colors: {
                        sky: ['#56ab2f', '#a8e6cf'],
                        ground: '#8B4513',
                        buildings: '#228B22'
                    }
                }
            }
        },
        upgrades: {
            name: 'التحسينات',
            icon: '⬆️',
            items: {
                coin_multiplier: {
                    name: 'مضاعف العملات',
                    description: 'زيادة دائمة في قيمة العملات بنسبة 20%',
                    icon: '💎',
                    price: 2000,
                    type: 'upgrade',
                    effect: 'coin_multiplier',
                    value: 1.2
                },
                score_multiplier: {
                    name: 'مضاعف النقاط',
                    description: 'زيادة دائمة في النقاط بنسبة 25%',
                    icon: '🏆',
                    price: 2500,
                    type: 'upgrade',
                    effect: 'score_multiplier',
                    value: 1.25
                },
                starting_boost: {
                    name: 'دفعة البداية',
                    description: 'ابدأ كل جولة بتسارع فائق',
                    icon: '🚀',
                    price: 1800,
                    type: 'upgrade',
                    effect: 'starting_boost'
                },
                extra_life: {
                    name: 'حياة إضافية',
                    description: 'فرصة ثانية عند التصادم',
                    icon: '❤️',
                    price: 3000,
                    type: 'upgrade',
                    effect: 'extra_life'
                }
            }
        }
    },
    
    // شراء عنصر
    buyItem(itemId, categoryId) {
        const category = this.categories[categoryId];
        const item = category.items[itemId];
        
        if (!item) return { success: false, message: 'العنصر غير موجود' };
        
        // فحص العملات
        if (gameData.totalCoins < item.price) {
            return { success: false, message: 'عملات غير كافية' };
        }
        
        // فحص إذا كان العنصر مشترى مسبقاً
        if (gameData.purchasedItems.includes(itemId)) {
            return { success: false, message: 'تم شراء هذا العنصر مسبقاً' };
        }
        
        // إجراء الشراء
        gameData.totalCoins -= item.price;
        gameData.purchasedItems.push(itemId);
        
        // تطبيق تأثير العنصر
        this.applyItemEffect(item, itemId);
        
        // حفظ البيانات
        saveAdvancedGameData();
        
        return { success: true, message: `تم شراء ${item.name} بنجاح!` };
    },
    
    // تطبيق تأثير العنصر
    applyItemEffect(item, itemId) {
        switch(item.type) {
            case 'character':
                gameData.unlockedCharacters.push(itemId);
                break;
            case 'theme':
                gameData.unlockedThemes = gameData.unlockedThemes || [];
                gameData.unlockedThemes.push(itemId);
                break;
            case 'upgrade':
                gameData.upgrades = gameData.upgrades || {};
                gameData.upgrades[itemId] = true;
                break;
            case 'consumable':
                gameData.inventory = gameData.inventory || {};
                gameData.inventory[itemId] = (gameData.inventory[itemId] || 0) + 1;
                break;
        }
    },
    
    // استخدام عنصر استهلاكي
    useConsumable(itemId) {
        if (!gameData.inventory || !gameData.inventory[itemId] || gameData.inventory[itemId] <= 0) {
            return false;
        }
        
        const item = this.findItem(itemId);
        if (!item || item.type !== 'consumable') return false;
        
        // تقليل الكمية
        gameData.inventory[itemId]--;
        
        // تفعيل التأثير
        powerUpSystem.activate(item.effect, item.duration);
        
        saveAdvancedGameData();
        return true;
    },
    
    // البحث عن عنصر
    findItem(itemId) {
        for (const category of Object.values(this.categories)) {
            if (category.items[itemId]) {
                return category.items[itemId];
            }
        }
        return null;
    },
    
    // الحصول على العناصر المتاحة للشراء
    getAvailableItems(categoryId) {
        const category = this.categories[categoryId];
        if (!category) return [];
        
        return Object.entries(category.items).map(([id, item]) => ({
            id,
            ...item,
            owned: gameData.purchasedItems.includes(id),
            canAfford: gameData.totalCoins >= item.price
        }));
    }
};

// نظام الخلفيات
const themeSystem = {
    currentTheme: 'default',
    themes: {
        default: {
            name: 'افتراضي',
            colors: {
                sky: ['#87CEEB', '#98FB98'],
                ground: '#8B4513',
                buildings: '#696969'
            }
        },
        ...shopSystem.categories.themes.items
    },
    
    // تطبيق خلفية
    applyTheme(themeId) {
        if (!this.themes[themeId]) return false;
        
        this.currentTheme = themeId;
        gameData.currentTheme = themeId;
        saveAdvancedGameData();
        
        showNotification(`تم تطبيق خلفية ${this.themes[themeId].name}! 🎨`, 'success');
        return true;
    },
    
    // الحصول على ألوان الخلفية الحالية
    getCurrentColors() {
        return this.themes[this.currentTheme].colors;
    }
};

// نظام المخزون
const inventorySystem = {
    // عرض المخزون
    showInventory() {
        const inventoryDiv = document.getElementById('inventory');
        if (!inventoryDiv) return;
        
        inventoryDiv.innerHTML = '';
        
        if (!gameData.inventory) {
            inventoryDiv.innerHTML = '<p>المخزون فارغ</p>';
            return;
        }
        
        for (const [itemId, quantity] of Object.entries(gameData.inventory)) {
            if (quantity > 0) {
                const item = shopSystem.findItem(itemId);
                if (item) {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'inventory-item';
                    itemDiv.innerHTML = `
                        <div class="item-icon">${item.icon}</div>
                        <div class="item-info">
                            <h4>${item.name}</h4>
                            <p>الكمية: ${quantity}</p>
                        </div>
                        <button class="use-btn" onclick="useInventoryItem('${itemId}')">استخدام</button>
                    `;
                    inventoryDiv.appendChild(itemDiv);
                }
            }
        }
    },
    
    // استخدام عنصر من المخزون
    useItem(itemId) {
        return shopSystem.useConsumable(itemId);
    }
};

// نظام التحسينات
const upgradeSystem = {
    // فحص إذا كان التحسين مفعل
    hasUpgrade(upgradeId) {
        return gameData.upgrades && gameData.upgrades[upgradeId];
    },
    
    // تطبيق التحسينات على اللعبة
    applyUpgrades() {
        if (this.hasUpgrade('starting_boost')) {
            powerUpSystem.activate('speed', 5000);
        }
        
        if (this.hasUpgrade('extra_life')) {
            player.hasExtraLife = true;
        }
    },
    
    // حساب مضاعف العملات
    getCoinMultiplier() {
        let multiplier = 1.0;
        
        if (this.hasUpgrade('coin_multiplier')) {
            multiplier *= 1.2;
        }
        
        return multiplier;
    },
    
    // حساب مضاعف النقاط
    getScoreMultiplier() {
        let multiplier = 1.0;
        
        if (this.hasUpgrade('score_multiplier')) {
            multiplier *= 1.25;
        }
        
        return multiplier;
    }
};

// تحديث نظام المتجر في الواجهة
function updateShopInterface() {
    const shopContainer = document.querySelector('.shop-items');
    if (!shopContainer) return;
    
    // مسح المحتوى الحالي
    shopContainer.innerHTML = '';
    
    // إنشاء فئات المتجر
    for (const [categoryId, category] of Object.entries(shopSystem.categories)) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = `shop-category ${categoryId === 'characters' ? '' : 'hidden'}`;
        categoryDiv.id = `${categoryId}-shop`;
        
        const items = shopSystem.getAvailableItems(categoryId);
        
        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            
            const statusText = item.owned ? 'مملوك' : 
                              !item.canAfford ? 'عملات غير كافية' : 'شراء';
            const buttonDisabled = item.owned || !item.canAfford;
            
            itemDiv.innerHTML = `
                <div class="item-icon">${item.icon}</div>
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <p>${item.description}</p>
                    ${item.stats ? generateStatsHTML(item.stats) : ''}
                    <span class="price">${item.price} عملة</span>
                </div>
                <button class="buy-btn" 
                        onclick="purchaseItem('${item.id}', '${categoryId}')"
                        ${buttonDisabled ? 'disabled' : ''}>
                    ${statusText}
                </button>
            `;
            
            categoryDiv.appendChild(itemDiv);
        });
        
        shopContainer.appendChild(categoryDiv);
    }
}

// إنشاء HTML للإحصائيات
function generateStatsHTML(stats) {
    return `
        <div class="character-stats">
            <div class="stat">السرعة: ${Math.round(stats.speed * 100)}%</div>
            <div class="stat">القفز: ${Math.round(stats.jumpHeight * 100)}%</div>
            <div class="stat">المغناطيس: ${Math.round(stats.coinMagnet * 100)}%</div>
        </div>
    `;
}

// شراء عنصر من الواجهة
function purchaseItem(itemId, categoryId) {
    const result = shopSystem.buyItem(itemId, categoryId);
    
    if (result.success) {
        showNotification(result.message, 'success');
        updateShopInterface();
        updateUI();
        updateCharacterSelection();
    } else {
        showNotification(result.message, 'error');
    }
}

// استخدام عنصر من المخزون
function useInventoryItem(itemId) {
    if (inventorySystem.useItem(itemId)) {
        showNotification('تم استخدام العنصر بنجاح!', 'success');
        inventorySystem.showInventory();
    } else {
        showNotification('لا يمكن استخدام هذا العنصر الآن', 'error');
    }
}

// نظام الحفظ المتقدم
const saveSystem = {
    // حفظ جميع البيانات
    saveAll() {
        const gameState = {
            version: '1.0',
            timestamp: Date.now(),
            gameData: gameData,
            playerStats: playerStats,
            levelSystem: {
                currentLevel: levelSystem.currentLevel,
                experience: levelSystem.experience,
                experienceToNext: levelSystem.experienceToNext
            },
            achievements: achievementSystem.achievements,
            settings: {
                soundEnabled: true,
                musicEnabled: true,
                vibrationEnabled: true
            }
        };
        
        try {
            localStorage.setItem('subwayGameComplete', JSON.stringify(gameState));
            return true;
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
            return false;
        }
    },
    
    // تحميل جميع البيانات
    loadAll() {
        try {
            const saved = localStorage.getItem('subwayGameComplete');
            if (!saved) return false;
            
            const gameState = JSON.parse(saved);
            
            // تحميل البيانات الأساسية
            if (gameState.gameData) {
                gameData = { ...gameData, ...gameState.gameData };
            }
            
            // تحميل الإحصائيات
            if (gameState.playerStats) {
                playerStats = { ...playerStats, ...gameState.playerStats };
            }
            
            // تحميل نظام المستويات
            if (gameState.levelSystem) {
                levelSystem.currentLevel = gameState.levelSystem.currentLevel || 1;
                levelSystem.experience = gameState.levelSystem.experience || 0;
                levelSystem.experienceToNext = gameState.levelSystem.experienceToNext || 100;
            }
            
            // تحميل الإنجازات
            if (gameState.achievements) {
                for (const [key, achievement] of Object.entries(gameState.achievements)) {
                    if (achievementSystem.achievements[key]) {
                        achievementSystem.achievements[key].unlocked = achievement.unlocked;
                    }
                }
            }
            
            // تطبيق الخلفية المحفوظة
            if (gameData.currentTheme) {
                themeSystem.applyTheme(gameData.currentTheme);
            }
            
            return true;
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            return false;
        }
    },
    
    // إعادة تعيين البيانات
    reset() {
        if (confirm('هل أنت متأكد من إعادة تعيين جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) {
            localStorage.removeItem('subwayGameComplete');
            localStorage.removeItem('subwayGameAdvanced');
            localStorage.removeItem('subwayGameData');
            location.reload();
        }
    },
    
    // تصدير البيانات
    export() {
        const gameState = JSON.parse(localStorage.getItem('subwayGameComplete') || '{}');
        const dataStr = JSON.stringify(gameState, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `subway_game_save_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    },
    
    // استيراد البيانات
    import(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const gameState = JSON.parse(e.target.result);
                localStorage.setItem('subwayGameComplete', JSON.stringify(gameState));
                showNotification('تم استيراد البيانات بنجاح!', 'success');
                setTimeout(() => location.reload(), 1000);
            } catch (error) {
                showNotification('خطأ في استيراد البيانات!', 'error');
            }
        };
        reader.readAsText(file);
    }
};

// تحديث الدوال الأساسية لاستخدام النظام الجديد
function saveGameData() {
    saveSystem.saveAll();
}

function loadGameData() {
    saveSystem.loadAll();
}

// إضافة أحداث جديدة للمتجر
document.addEventListener('DOMContentLoaded', function() {
    // تحديث واجهة المتجر عند فتحها
    const shopBtn = document.getElementById('shopBtn');
    if (shopBtn) {
        shopBtn.addEventListener('click', function() {
            updateShopInterface();
            inventorySystem.showInventory();
        });
    }
    
    // إضافة زر إعادة التعيين
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'إعادة تعيين البيانات';
    resetBtn.className = 'btn btn-danger';
    resetBtn.onclick = () => saveSystem.reset();
    
    // إضافة أزرار التصدير والاستيراد
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'تصدير البيانات';
    exportBtn.className = 'btn btn-secondary';
    exportBtn.onclick = () => saveSystem.export();
    
    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = '.json';
    importInput.style.display = 'none';
    importInput.onchange = (e) => {
        if (e.target.files[0]) {
            saveSystem.import(e.target.files[0]);
        }
    };
    
    const importBtn = document.createElement('button');
    importBtn.textContent = 'استيراد البيانات';
    importBtn.className = 'btn btn-secondary';
    importBtn.onclick = () => importInput.click();
    
    // إضافة الأزرار للواجهة
    const settingsDiv = document.createElement('div');
    settingsDiv.className = 'settings-buttons';
    settingsDiv.style.cssText = 'position: fixed; bottom: 10px; right: 10px; display: flex; gap: 10px; flex-direction: column;';
    
    settingsDiv.appendChild(exportBtn);
    settingsDiv.appendChild(importBtn);
    settingsDiv.appendChild(importInput);
    settingsDiv.appendChild(resetBtn);
    
    document.body.appendChild(settingsDiv);
});


// نظام الثيمات المتقدم
const themeManager = {
    currentTheme: 'default',
    themes: {
        default: {
            name: 'افتراضي',
            colors: {
                '--primary-color': '#4CAF50',
                '--secondary-color': '#2196F3',
                '--accent-color': '#FFD700',
                '--background-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '--card-background': 'rgba(255, 255, 255, 0.1)',
                '--text-primary': '#ffffff',
                '--text-secondary': 'rgba(255, 255, 255, 0.8)'
            }
        },
        dark: {
            name: 'مظلم',
            colors: {
                '--primary-color': '#BB86FC',
                '--secondary-color': '#03DAC6',
                '--accent-color': '#CF6679',
                '--background-gradient': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                '--card-background': 'rgba(255, 255, 255, 0.05)',
                '--text-primary': '#ffffff',
                '--text-secondary': 'rgba(255, 255, 255, 0.7)'
            }
        },
        light: {
            name: 'فاتح',
            colors: {
                '--primary-color': '#1976D2',
                '--secondary-color': '#388E3C',
                '--accent-color': '#F57C00',
                '--background-gradient': 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
                '--card-background': 'rgba(255, 255, 255, 0.9)',
                '--text-primary': '#2d3436',
                '--text-secondary': 'rgba(45, 52, 54, 0.8)'
            }
        }
    },
    
    // تطبيق ثيم
    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return false;
        
        const root = document.documentElement;
        
        // تطبيق متغيرات CSS
        for (const [property, value] of Object.entries(theme.colors)) {
            root.style.setProperty(property, value);
        }
        
        // تحديث الثيم الحالي
        this.currentTheme = themeName;
        
        // حفظ التفضيل
        localStorage.setItem('selectedTheme', themeName);
        
        // تحديث الأزرار
        this.updateThemeButtons();
        
        // إضافة تأثير انتقال
        document.body.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
        
        showNotification(`تم تطبيق الثيم ${theme.name}! 🎨`, 'success');
        return true;
    },
    
    // تحديث أزرار الثيمات
    updateThemeButtons() {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === this.currentTheme) {
                btn.classList.add('active');
            }
        });
    },
    
    // تحميل الثيم المحفوظ
    loadSavedTheme() {
        const savedTheme = localStorage.getItem('selectedTheme');
        if (savedTheme && this.themes[savedTheme]) {
            this.applyTheme(savedTheme);
        } else {
            this.updateThemeButtons();
        }
    }
};

// نظام إدارة الواجهة المتقدم
const uiManager = {
    // إظهار/إخفاء العناصر
    showElement(elementId, animation = 'fadeIn') {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('hidden');
            element.classList.add(animation);
        }
    },
    
    hideElement(elementId, animation = 'fadeOut') {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('hidden');
            element.classList.remove(animation);
        }
    },
    
    // تحديث شريط الخبرة
    updateExperienceBar() {
        const progressBar = document.getElementById('experienceBar');
        const levelDisplay = document.getElementById('currentLevel');
        const container = document.getElementById('experienceBarContainer');
        
        if (progressBar && levelDisplay) {
            const progress = levelSystem.getProgress();
            progressBar.style.width = progress + '%';
            levelDisplay.textContent = levelSystem.currentLevel;
            
            if (gameState === 'playing') {
                container.classList.remove('hidden');
            } else {
                container.classList.add('hidden');
            }
        }
    },
    
    // تحديث عرض الكومبو
    updateComboDisplay() {
        const comboDisplay = document.getElementById('comboDisplay');
        if (comboDisplay) {
            if (scoreSystem.currentCombo > 0 && gameState === 'playing') {
                comboDisplay.textContent = `كومبو: ${scoreSystem.currentCombo}x`;
                comboDisplay.classList.remove('hidden');
                comboDisplay.classList.add('show');
            } else {
                comboDisplay.classList.add('hidden');
                comboDisplay.classList.remove('show');
            }
        }
    },
    
    // تحديث القوى النشطة
    updateActivePowerUps() {
        const container = document.getElementById('activePowerUps');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (gameState !== 'playing') return;
        
        for (const [type, powerUp] of powerUpSystem.activePowerUps) {
            const remaining = Math.max(0, powerUp.duration - (Date.now() - powerUp.startTime));
            const seconds = Math.ceil(remaining / 1000);
            
            const powerUpElement = document.createElement('div');
            powerUpElement.className = 'active-powerup';
            powerUpElement.innerHTML = `
                <span class="powerup-icon">${getPowerUpIcon(type)}</span>
                <span class="powerup-timer">${seconds}s</span>
            `;
            
            container.appendChild(powerUpElement);
        }
    },
    
    // إنشاء نص عائم
    createFloatingText(x, y, text, color = '#FFD700', size = '16px') {
        const textElement = document.createElement('div');
        textElement.className = 'floating-text';
        textElement.textContent = text;
        textElement.style.cssText = `
            left: ${x}px;
            top: ${y}px;
            color: ${color};
            font-size: ${size};
        `;
        
        document.body.appendChild(textElement);
        
        // إزالة النص بعد انتهاء الحركة
        setTimeout(() => {
            if (textElement.parentNode) {
                textElement.parentNode.removeChild(textElement);
            }
        }, 2000);
    },
    
    // تحديث المخزون
    updateInventoryDisplay() {
        const inventoryDiv = document.getElementById('inventory');
        if (!inventoryDiv) return;
        
        inventoryDiv.innerHTML = '';
        
        if (!gameData.inventory || Object.keys(gameData.inventory).length === 0) {
            inventoryDiv.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">المخزون فارغ</p>';
            return;
        }
        
        let hasItems = false;
        for (const [itemId, quantity] of Object.entries(gameData.inventory)) {
            if (quantity > 0) {
                hasItems = true;
                const item = shopSystem.findItem(itemId);
                if (item) {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'inventory-item bounce-in';
                    itemDiv.innerHTML = `
                        <div class="item-icon">${item.icon}</div>
                        <div class="item-info">
                            <h4>${item.name}</h4>
                            <p>${item.description}</p>
                            <span class="quantity">الكمية: ${quantity}</span>
                        </div>
                        <button class="use-btn interactive-btn" onclick="useInventoryItem('${itemId}')">
                            استخدام
                        </button>
                    `;
                    inventoryDiv.appendChild(itemDiv);
                }
            }
        }
        
        if (!hasItems) {
            inventoryDiv.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">المخزون فارغ</p>';
        }
    }
};

// نظام الصوت (اختياري)
const soundManager = {
    enabled: true,
    sounds: {},
    
    // تشغيل صوت
    play(soundName, volume = 0.5) {
        if (!this.enabled) return;
        
        // يمكن إضافة ملفات صوتية هنا
        // هذا مثال بسيط للتنبيه
        if (soundName === 'coin') {
            this.playBeep(800, 100);
        } else if (soundName === 'jump') {
            this.playBeep(400, 150);
        } else if (soundName === 'powerup') {
            this.playBeep(1000, 200);
        }
    },
    
    // تشغيل نغمة بسيطة
    playBeep(frequency, duration) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (error) {
            // تجاهل أخطاء الصوت
        }
    },
    
    // تبديل الصوت
    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('soundEnabled', this.enabled);
        showNotification(this.enabled ? 'تم تشغيل الصوت 🔊' : 'تم إيقاف الصوت 🔇', 'info');
    }
};

// تحديث الدوال الموجودة لاستخدام النظام الجديد
function updateAdvancedUI() {
    uiManager.updateExperienceBar();
    uiManager.updateComboDisplay();
    uiManager.updateActivePowerUps();
}

function collectCoin(coin) {
    const character = characterStats[gameData.selectedCharacter];
    let coinValue = coin.value;
    
    // تطبيق مضاعف الشخصية
    coinValue = Math.floor(coinValue * character.coinMagnet);
    
    // تطبيق مضاعف العملات المضاعفة
    if (player.doubleCoins) {
        coinValue *= 2;
    }
    
    // تطبيق مضاعف التحسينات
    coinValue = Math.floor(coinValue * upgradeSystem.getCoinMultiplier());
    
    gameData.coins += coinValue;
    gameData.totalCoins += coinValue;
    updatePlayerStats('coin', coinValue);
    
    // إضافة خبرة
    levelSystem.addExperience(2);
    
    // إضافة نقاط
    const score = scoreSystem.calculateScore('coin');
    gameData.score += Math.floor(score * upgradeSystem.getScoreMultiplier());
    
    // تأثيرات بصرية وصوتية
    createCoinEffect(coin.x, coin.y, coinValue);
    soundManager.play('coin');
    
    // نص عائم
    uiManager.createFloatingText(coin.x, coin.y, `+${coinValue}`, '#FFD700', '18px');
}

// تحديث دالة القفز
function jump() {
    if (!player.isJumping && !player.isSliding) {
        player.isJumping = true;
        player.jumpSpeed = 15;
        updatePlayerStats('jump');
        createParticles(player.x + player.width/2, player.y + player.height, '#FFFFFF', 5);
        soundManager.play('jump');
    }
}

// تحديث دالة تفعيل القوة الخاصة
function activatePowerUp(type) {
    powerUpSystem.activate(type);
    soundManager.play('powerup');
    updatePlayerStats('powerup');
}

// إعداد أحداث العناصر الجديدة
function setupAdvancedEventListeners() {
    // أزرار الثيمات
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            themeManager.applyTheme(this.dataset.theme);
        });
    });
    
    // زر المخزون
    const inventoryBtn = document.getElementById('inventoryBtn');
    if (inventoryBtn) {
        inventoryBtn.addEventListener('click', function() {
            uiManager.updateInventoryDisplay();
            showScreen('inventoryModal');
        });
    }
    
    // زر إغلاق المخزون
    const closeInventoryBtn = document.getElementById('closeInventoryBtn');
    if (closeInventoryBtn) {
        closeInventoryBtn.addEventListener('click', function() {
            backToMenu();
        });
    }
    
    // إضافة زر الصوت
    const soundBtn = document.createElement('button');
    soundBtn.innerHTML = '🔊';
    soundBtn.className = 'theme-btn';
    soundBtn.title = 'تبديل الصوت';
    soundBtn.onclick = () => soundManager.toggle();
    
    const themeSelector = document.getElementById('themeSelector');
    if (themeSelector) {
        themeSelector.appendChild(soundBtn);
    }
}

// تحديث دالة التهيئة
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // تحميل البيانات المحفوظة
    loadGameData();
    
    // تحميل الثيم المحفوظ
    themeManager.loadSavedTheme();
    
    // تحميل إعدادات الصوت
    const soundEnabled = localStorage.getItem('soundEnabled');
    if (soundEnabled !== null) {
        soundManager.enabled = soundEnabled === 'true';
    }
    
    updateUI();
    
    // إعداد أحداث الأزرار
    setupEventListeners();
    setupAdvancedEventListeners();
    
    // بدء حلقة اللعبة
    gameLoop();
}

// تحديث دالة بدء اللعبة
function startGame() {
    gameState = 'playing';
    resetGameVariables();
    updatePlayerStats('gameStart');
    
    // تطبيق التحسينات
    upgradeSystem.applyUpgrades();
    
    showScreen('gameScreen');
    uiManager.showElement('experienceBarContainer');
    generateInitialElements();
}

// تحديث دالة انتهاء اللعبة
function gameOver() {
    gameState = 'gameOver';
    
    // تحديث الإحصائيات
    updatePlayerStats('gameEnd');
    
    // فحص الإنجازات
    const newAchievements = achievementSystem.checkAchievements(playerStats);
    
    // تحديث أفضل نتيجة
    if (gameData.score > gameData.bestScore) {
        gameData.bestScore = gameData.score;
        uiManager.createFloatingText(400, 300, 'رقم قياسي جديد! 🏆', '#FFD700', '24px');
    }
    
    // حفظ البيانات
    saveGameData();
    
    // عرض شاشة انتهاء اللعبة
    showGameOverScreen();
    
    // إخفاء عناصر اللعبة
    uiManager.hideElement('experienceBarContainer');
    uiManager.hideElement('comboDisplay');
    
    // عرض الإنجازات الجديدة
    if (newAchievements.length > 0) {
        setTimeout(() => {
            newAchievements.forEach((achievement, index) => {
                setTimeout(() => {
                    showNotification(`إنجاز جديد: ${achievement.name} ${achievement.icon}`, 'success');
                }, index * 1000);
            });
        }, 1000);
    }
}

// تحديث حلقة اللعبة
function updateGame() {
    if (gameState !== 'playing') return;
    
    // تحديث اللاعب
    updatePlayer();
    
    // تحديث العوائق
    updateObstacles();
    
    // تحديث العملات مع المغناطيس
    updateCoinMagnet();
    updateCoins();
    
    // تحديث القوى الخاصة
    updatePowerUps();
    powerUpSystem.update();
    
    // تحديث الجسيمات
    updateParticles();
    
    // إنشاء عناصر جديدة
    spawnNewElements();
    
    // تحديث النقاط والمسافة
    updateScore();
    updatePlayerStats('distance', gameData.distance);
    
    // زيادة السرعة تدريجياً
    gameSpeed += 0.001;
    
    // تحديث واجهة المستخدم
    updateGameUI();
    updateAdvancedUI();
}

// تحديث دالة رسم اللعبة لاستخدام الثيمات
function drawBackground() {
    const colors = themeSystem.getCurrentColors ? themeSystem.getCurrentColors() : {
        sky: ['#87CEEB', '#98FB98'],
        ground: '#8B4513',
        buildings: '#696969'
    };
    
    // رسم السماء
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, colors.sky[0]);
    gradient.addColorStop(1, colors.sky[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // رسم الغيوم
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 5; i++) {
        const x = (i * 200 - gameData.distance * 0.1) % (canvas.width + 100);
        const y = 50 + i * 30;
        drawCloud(x, y);
    }
    
    // رسم المباني
    ctx.fillStyle = colors.buildings || '#696969';
    for (let i = 0; i < 10; i++) {
        const x = (i * 150 - gameData.distance * 0.2) % (canvas.width + 200);
        const height = 100 + Math.sin(i) * 50;
        ctx.fillRect(x, canvas.height - height - 100, 80, height);
    }
}

// تحديث دالة تحميل البيانات
function loadGameData() {
    saveSystem.loadAll();
}

