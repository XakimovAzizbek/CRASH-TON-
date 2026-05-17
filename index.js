// Telegram Web App init
const tg = window.Telegram.WebApp;
tg.expand();

// Adsgram Init (O'z blockId-ingizni kiriting)
const AdController = window.Adsgram.init({ blockId: "int-30438" });

// ─── O'YIN O'ZGARUVCHILARI ───
let balance     = parseFloat(localStorage.getItem('ton_balance')) || 0;
let currentMultiplier = 1.00;
let crashPoint  = 1.00;
let gameInterval = null;
let gameState   = 'START'; // START | PLAYING | CASHOUT_DONE | CRASHED
let roundCount  = parseInt(localStorage.getItem('round_count')) || 0;
let bestMult    = parseFloat(localStorage.getItem('best_mult'))  || 0;
let totalWon    = parseFloat(localStorage.getItem('total_won'))  || 0;

const BASE_REWARD = 0.00001;

// ─── DOM ───
const balanceDisplay  = document.getElementById('balance');
const multiplierEl    = document.getElementById('multiplier');
const gameStatus      = document.getElementById('game-status');
const actionBtn       = document.getElementById('action-btn');
const withdrawBtn     = document.getElementById('withdraw-btn');
const gameArea        = document.getElementById('game-area');
const multiplierRing  = document.getElementById('multiplier-ring');
const winToast        = document.getElementById('win-toast');
const rocket          = document.getElementById('rocket');
const roundCountEl    = document.getElementById('round-count');
const bestMultEl      = document.getElementById('best-mult');
const totalWonEl      = document.getElementById('total-won');

// ─── BOSHLANG'ICH ───
balanceDisplay.textContent = balance.toFixed(6);
updateStats();

function updateStats() {
    roundCountEl.textContent = roundCount;
    bestMultEl.textContent   = bestMult > 0 ? bestMult.toFixed(2) + 'x' : '—';
    totalWonEl.textContent   = totalWon.toFixed(4);
}

// Tasodifiy crash nuqtasi
function generateCrashPoint() {
    const rand = Math.random();
    if (rand < 0.10) return 1.00;                                      // 10% — darhol 1x
    if (rand < 0.50) return parseFloat((1 + Math.random() * 2).toFixed(2));  // 1x–3x
    if (rand < 0.80) return parseFloat((3 + Math.random() * 4).toFixed(2));  // 3x–7x
    return parseFloat((7 + Math.random() * 15).toFixed(2));             // 7x–22x (kam)
}

// ─── TUGMA ───
actionBtn.addEventListener('click', () => {
    if (gameState === 'START' || gameState === 'CRASHED' || gameState === 'CASHOUT_DONE') {
        AdController.show()
            .then(() => startGame())
            .catch(err => {
                console.log("Reklama ko'rsatilmadi:", err);
                startGame();
            });
    } else if (gameState === 'PLAYING') {
        cashOut();
    }
});

// ─── O'YIN BOSHLASH ───
function startGame() {
    gameState = 'PLAYING';
    currentMultiplier = 1.01;
    crashPoint = generateCrashPoint();

    // Holat tozalash
    gameArea.classList.remove('state-crashed');
    gameArea.classList.add('state-playing');
    multiplierRing.classList.add('growing');
    multiplierRing.style.boxShadow = '';

    multiplierEl.textContent = '1.01x';
    gameStatus.textContent   = '🚀 Raketa uchmoqda...';

    actionBtn.textContent = '💰 CASHOUT';
    actionBtn.classList.add('cashout-mode');

    rocket.style.opacity = '1';
    rocket.style.bottom  = '22%';

    gameInterval = setInterval(() => {
        currentMultiplier += 0.01 + (currentMultiplier * 0.005);
        multiplierEl.textContent = currentMultiplier.toFixed(2) + 'x';

        // Ring porlash kuchi multiplierga qarab oshadi
        const glow = Math.min(currentMultiplier * 8, 70);
        const alpha = Math.min(0.1 + currentMultiplier * 0.04, 0.55);
        multiplierRing.style.boxShadow =
            `0 0 ${glow}px rgba(0,255,136,${alpha}), inset 0 0 30px rgba(0,0,0,0.3)`;

        // Raketa asta-sekin yuqoriga ko'tariladi
        const risePercent = Math.min(22 + (currentMultiplier - 1) * 5, 72);
        rocket.style.bottom = risePercent + '%';

        if (currentMultiplier >= crashPoint) {
            triggerCrash();
        }
    }, 80);
}

// ─── CASHOUT ───
function cashOut() {
    clearInterval(gameInterval);
    gameState = 'CASHOUT_DONE';

    const wonAmount = BASE_REWARD * currentMultiplier;
    balance   += wonAmount;
    totalWon  += wonAmount;

    if (currentMultiplier > bestMult) {
        bestMult = parseFloat(currentMultiplier.toFixed(2));
        localStorage.setItem('best_mult', bestMult);
    }

    localStorage.setItem('ton_balance', balance);
    localStorage.setItem('total_won', totalWon);

    // Balans yangilash
    balanceDisplay.textContent = balance.toFixed(6);
    balanceDisplay.classList.remove('balance-flash');
    void balanceDisplay.offsetWidth; // reflow
    balanceDisplay.classList.add('balance-flash');

    // Win toast
    winToast.textContent = `🎉 +${wonAmount.toFixed(6)} TON`;
    winToast.classList.add('show');
    setTimeout(() => winToast.classList.remove('show'), 2800);

    gameStatus.textContent = `✅ ${currentMultiplier.toFixed(2)}x da chiqdingiz! +${wonAmount.toFixed(6)} TON`;

    roundCount++;
    localStorage.setItem('round_count', roundCount);
    updateStats();

    resetControls();
}

// ─── CRASH ───
function triggerCrash() {
    clearInterval(gameInterval);
    gameState = 'CRASHED';

    gameArea.classList.remove('state-playing');
    gameArea.classList.add('state-crashed');
    multiplierRing.classList.remove('growing');
    multiplierRing.style.boxShadow = '0 0 60px rgba(255,45,85,0.45), inset 0 0 30px rgba(0,0,0,0.3)';

    multiplierEl.textContent = '💥 CRASH';
    gameStatus.textContent   = `${crashPoint.toFixed(2)}x da portladi! Keyingi safar omad! 🍀`;

    rocket.style.opacity = '0.25';

    roundCount++;
    localStorage.setItem('round_count', roundCount);
    updateStats();

    resetControls();
}

// ─── RESET ───
function resetControls() {
    setTimeout(() => {
        actionBtn.textContent = "▶ YANA O'YNASH (Reklama)";
        actionBtn.classList.remove('cashout-mode');
        rocket.style.opacity = '1';
        rocket.style.bottom  = '22%';
    }, 600);
}

// ─── WITHDRAW ───
withdrawBtn.addEventListener('click', () => {
    window.location.href = 'withdraw.html';
});