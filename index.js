// Telegram Web App init
const tg = window.Telegram.WebApp;
tg.expand();

// Adsgram Init
const AdController = window.Adsgram.init({ blockId: "int-30438" });

// O'yin o'zgaruvchilari
let balance = parseFloat(localStorage.getItem('ton_balance')) || 0;
let currentMultiplier = 1.00;
let crashPoint = 1.00;
let gameInterval = null;
let gameState = 'START';
let roundCount = parseInt(localStorage.getItem('round_count')) || 0;
let bestMult = parseFloat(localStorage.getItem('best_mult')) || 0;
let totalWon = parseFloat(localStorage.getItem('total_won')) || 0;
const BASE_REWARD = 0.00001;

// DOM
const balanceDisplay = document.getElementById('balance');
const multiplierDisplay = document.getElementById('multiplier');
const gameStatus = document.getElementById('game-status');
const actionBtn = document.getElementById('action-btn');
const withdrawBtn = document.getElementById('withdraw-btn');
const rocketLine = document.getElementById('rocket-line');
const gameArea = document.getElementById('game-area');
const multiplierRing = document.getElementById('multiplier-ring');
const winToast = document.getElementById('win-toast');
const roundCountEl = document.getElementById('round-count');
const bestMultEl = document.getElementById('best-mult');
const totalWonEl = document.getElementById('total-won');
const rocket = document.getElementById('rocket');

// Init
updateStats();
balanceDisplay.textContent = balance.toFixed(6);

function updateStats() {
    roundCountEl.textContent = roundCount;
    bestMultEl.textContent = bestMult > 0 ? bestMult.toFixed(2) + 'x' : '—';
    totalWonEl.textContent = totalWon.toFixed(4);
}

function generateCrashPoint() {
    const rand = Math.random();
    if (rand < 0.1) return 1.00;
    if (rand < 0.5) return parseFloat((1 + Math.random() * 2).toFixed(2));
    if (rand < 0.8) return parseFloat((3 + Math.random() * 4).toFixed(2));
    return parseFloat((7 + Math.random() * 15).toFixed(2));
}

actionBtn.addEventListener('click', () => {
    if (gameState === 'START' || gameState === 'CRASHED' || gameState === 'CASHOUT_DONE') {
        AdController.show().then(() => {
            startGame();
        }).catch((result) => {
            console.log("Reklama ko'rsatilmadi:", result);
            startGame();
        });
    } else if (gameState === 'PLAYING') {
        cashOut();
    }
});

function startGame() {
    gameState = 'PLAYING';
    currentMultiplier = 1.01;
    crashPoint = generateCrashPoint();

    gameArea.classList.remove('crashed');
    multiplierDisplay.parentElement.className = '';

    multiplierDisplay.style.color = '';
    multiplierRing.classList.add('growing');
    gameStatus.textContent = '🚀 Raketa uchmoqda...';

    actionBtn.textContent = '💰 CASHOUT';
    actionBtn.classList.add('cashout-mode');

    rocketLine.style.width = '0%';
    rocket.style.opacity = '1';

    gameInterval = setInterval(() => {
        currentMultiplier += 0.01 + (currentMultiplier * 0.005);
        multiplierDisplay.textContent = currentMultiplier.toFixed(2) + 'x';

        // Ring glow intensity
        const glowSize = Math.min(currentMultiplier * 10, 80);
        multiplierRing.style.boxShadow = `0 0 ${glowSize}px rgba(0,255,136,${Math.min(currentMultiplier * 0.05, 0.5)})`;

        let progress = (currentMultiplier / crashPoint) * 100;
        rocketLine.style.width = Math.min(progress, 100) + '%';

        // Move rocket up
        const rocketY = Math.min((currentMultiplier - 1) * 8, 60);
        rocket.style.bottom = `${45 + rocketY}%`;

        if (currentMultiplier >= crashPoint) {
            triggerCrash();
        }
    }, 80);
}

function cashOut() {
    clearInterval(gameInterval);
    gameState = 'CASHOUT_DONE';

    const wonAmount = BASE_REWARD * currentMultiplier;
    balance += wonAmount;
    totalWon += wonAmount;

    if (currentMultiplier > bestMult) {
        bestMult = currentMultiplier;
        localStorage.setItem('best_mult', bestMult);
    }

    localStorage.setItem('ton_balance', balance);
    localStorage.setItem('total_won', totalWon);

    // Balance update
    balanceDisplay.textContent = balance.toFixed(6);
    balanceDisplay.classList.remove('balance-flash');
    void balanceDisplay.offsetWidth;
    balanceDisplay.classList.add('balance-flash');

    // Win toast
    winToast.textContent = `🎉 +${wonAmount.toFixed(6)} TON`;
    winToast.classList.add('show');
    setTimeout(() => winToast.classList.remove('show'), 2500);

    gameStatus.textContent = `✅ ${currentMultiplier.toFixed(2)}x da chiqdingiz! +${wonAmount.toFixed(6)} TON`;
    multiplierRing.classList.remove('growing');
    multiplierRing.style.boxShadow = '';

    roundCount++;
    localStorage.setItem('round_count', roundCount);
    updateStats();

    resetControls();
}

function triggerCrash() {
    clearInterval(gameInterval);
    gameState = 'CRASHED';

    gameArea.classList.add('crashed');
    multiplierRing.classList.remove('growing');
    multiplierRing.style.boxShadow = '0 0 60px rgba(255,45,85,0.4)';

    multiplierDisplay.textContent = '💥 CRASH';
    multiplierDisplay.style.fontSize = '32px';

    gameStatus.textContent = `${crashPoint.toFixed(2)}x da portladi! Keyingi safar omad!`;

    rocket.style.opacity = '0.3';

    roundCount++;
    localStorage.setItem('round_count', roundCount);
    updateStats();

    setTimeout(() => {
        multiplierDisplay.style.fontSize = '';
    }, 1500);

    resetControls();
}

function resetControls() {
    setTimeout(() => {
        actionBtn.textContent = '▶ YANA O\'YNASH (Reklama)';
        actionBtn.classList.remove('cashout-mode');
        rocketLine.style.width = '0%';
        rocket.style.opacity = '1';
        rocket.style.bottom = '45%';
    }, 500);
}

withdrawBtn.addEventListener('click', () => {
    window.location.href = 'withdraw.html';
});