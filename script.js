document.addEventListener('DOMContentLoaded', () => {
    
    // --- Elements ---
    const startBtn = document.getElementById('start-btn');
    const welcomeSection = document.getElementById('welcome-section');
    const gameSection = document.getElementById('game-section');
    const transitionMsg = document.getElementById('transition-message');

    // Audio
    const song1 = new Audio('audio/song1.mp3');
    const song2 = new Audio('audio/song2.mp3');
    song2.loop = true;

    // --- 1. START JOURNEY ---
    startBtn.addEventListener('click', () => {
        song1.play().catch(e => console.log("Audio blocked:", e));
        song1.onended = () => song2.play();

        welcomeSection.style.display = 'none';
        gameSection.classList.remove('hidden');
        transitionMsg.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        initCardGame(); // Start first game
    });

    // ==========================================
    // GAME 1: MEMORY CARDS
    // ==========================================
    const gameGrid = document.getElementById('game-grid');
    const icons = ['🎂', '🎁', '🎈', '✨', '🕯️', '🎉', '🎩', '🍰'];
    let cardsArray = [...icons, ...icons];
    let flippedCards = [];
    let matchedPairs = 0;
    let isBoardLocked = false;

    function initCardGame() {
        cardsArray.sort(() => 0.5 - Math.random());
        gameGrid.innerHTML = '';
        cardsArray.forEach((icon) => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `<span class="card-content">${icon}</span>`;
            card.classList.add('flipped');
            card.addEventListener('click', () => flipCard(card, icon));
            gameGrid.appendChild(card);
        });

        setTimeout(() => {
            document.querySelectorAll('.card').forEach(c => c.classList.remove('flipped'));
        }, 3000);
    }

    function flipCard(card, icon) {
        if (isBoardLocked || card.classList.contains('flipped') || card.classList.contains('matched')) return;
        card.classList.add('flipped');
        flippedCards.push({ card, icon });

        if (flippedCards.length === 2) {
            isBoardLocked = true;
            const [first, second] = flippedCards;
            if (first.icon === second.icon) {
                first.card.classList.add('matched');
                second.card.classList.add('matched');
                matchedPairs++;
                flippedCards = [];
                isBoardLocked = false;
                if (matchedPairs === icons.length) cardGameWon();
            } else {
                setTimeout(() => {
                    first.card.classList.remove('flipped');
                    second.card.classList.remove('flipped');
                    flippedCards = [];
                    isBoardLocked = false;
                }, 1000);
            }
        }
    }

    function cardGameWon() {
        // Small confetti for small win
        launchConfetti(50); // 50 particles

        // Unlock Next Section
        const puzzleSection = document.getElementById('puzzle-section');
        puzzleSection.classList.remove('hidden');

        setTimeout(() => {
            puzzleSection.scrollIntoView({ behavior: 'smooth' });
            initPuzzleGame(); // Initialize the puzzle now
        }, 1500);
    }

    // ==========================================
    // GAME 2: PUZZLE (Smart Swap Logic)
    // ==========================================
    let selectedPiece = null; // The DOM element currently selected

    function initPuzzleGame() {
        const puzzleBank = document.getElementById('puzzle-source');
        const puzzleTarget = document.getElementById('puzzle-target');

        // 1. Create 9 Empty Slots
        puzzleTarget.innerHTML = '';
        for(let i=0; i<9; i++) {
            const slot = document.createElement('div');
            slot.classList.add('puzzle-slot');
            slot.dataset.slotIndex = i;
            // Clicking a slot handles moving/swapping
            slot.addEventListener('click', () => handleSlotClick(slot));
            puzzleTarget.appendChild(slot);
        }

        // 2. Create 9 Pieces
        puzzleBank.innerHTML = '';
        let pieceIndices = [0,1,2,3,4,5,6,7,8];
        pieceIndices.sort(() => 0.5 - Math.random()); // Shuffle

        pieceIndices.forEach(index => {
            const piece = document.createElement('div');
            piece.classList.add('puzzle-piece');
            piece.dataset.id = index; // Correct position ID

            // Visuals
            const row = Math.floor(index / 3);
            const col = index % 3;
            piece.style.backgroundPosition = `-${col * 100}px -${row * 100}px`;

            // Clicking a piece selects it
            piece.addEventListener('click', (e) => handlePieceClick(e, piece));
            puzzleBank.appendChild(piece);
        });
    }

    function handlePieceClick(e, piece) {
        e.stopPropagation(); // Don't trigger slot click if piece is inside slot

        // If we already have a selected piece, and we click a DIFFERENT piece
        if (selectedPiece && selectedPiece !== piece) {
            // Swap the two pieces (whether in bank or board)
            swapPieces(selectedPiece, piece);
            updateAllSlots();
            deselectAll();
            checkPuzzleWin();
            return;
        }

        // Toggle Selection
        if (piece.classList.contains('selected')) {
            deselectAll();
        } else {
            deselectAll();
            piece.classList.add('selected');
            selectedPiece = piece;
        }
    }

    function handleSlotClick(slot) {
        if (!selectedPiece) return;

        // If slot is empty → move piece
        if (slot.children.length === 0) {
            slot.appendChild(selectedPiece);

            updateSlotState(slot);
            updateAllSlots();

            deselectAll();
            checkPuzzleWin();
        }
        // If slot has a piece → swap
        else {
            const pieceInSlot = slot.children[0];
            swapPieces(selectedPiece, pieceInSlot);

            updateAllSlots();

            deselectAll();
            checkPuzzleWin();
        }
    }


    function swapPieces(piece1, piece2) {
        const parent1 = piece1.parentNode;
        const sibling1 = piece1.nextSibling === piece2 ? piece1 : piece1.nextSibling;

        // Swap logic for DOM nodes
        piece2.parentNode.insertBefore(piece1, piece2);
        parent1.insertBefore(piece2, sibling1);
    }

    function deselectAll() {
        document.querySelectorAll('.puzzle-piece').forEach(p => p.classList.remove('selected'));
        selectedPiece = null;
    }

    function updateSlotState(slot) {
        if (slot.children.length > 0) {
            slot.classList.add("filled");
        } else {
            slot.classList.remove("filled");
        }
    }

    function updateAllSlots() {
        document.querySelectorAll(".puzzle-slot").forEach(updateSlotState);
    }


    function checkPuzzleWin() {
        const slots = document.querySelectorAll('.puzzle-slot');
        let correctCount = 0;

        slots.forEach(slot => {
            if (slot.children.length > 0) {
                const pieceIndex = parseInt(slot.children[0].dataset.id);
                const slotIndex = parseInt(slot.dataset.slotIndex);
                if (pieceIndex === slotIndex) correctCount++;
            }
        });

        if (correctCount === 9) {
            puzzleGameWon();
        }
    }

    function puzzleGameWon() {
        // Show Big Popup
        const popup = document.getElementById('game-message');
        popup.classList.remove('hidden');
        launchConfetti(150); // Big Confetti

        // Handle "Continue" Button
        document.getElementById('continue-btn').onclick = function() {
            popup.style.opacity = '0';
            setTimeout(() => {
                popup.classList.add('hidden');

                // Unlock Candle Section
                const candleSection = document.getElementById('candle-section');
                candleSection.classList.remove('hidden');
                candleSection.scrollIntoView({ behavior: 'smooth' });
                initCandle();
            }, 500);
        };
    }

    // ==========================================
    // INTERACTION 3: CAKE & CANDLES
    // ==========================================
    function initCandle() {
        const candles = document.querySelectorAll('.candle');
        const journey = document.getElementById('scroll-journey');
        const videoSec = document.getElementById('video-section');
        const closing = document.getElementById('closing-section');

        let blownCount = 0; // Track how many are out

        candles.forEach(candle => {
            candle.addEventListener('click', (e) => {
                e.stopPropagation(); // Stop click from bubbling up

                const flame = candle.querySelector('.flame');
                const smoke = candle.querySelector('.smoke');

                // If already out, do nothing
                if (flame.classList.contains('out')) return;

                // 1. Blow out THIS specific candle
                flame.classList.add('out');

                // 2. Trigger smoke for THIS specific candle
                // Reset animation in case she clicks fast
                smoke.classList.remove('puff');
                void smoke.offsetWidth; // Trigger reflow
                smoke.classList.add('puff');

                // 3. Increment counter
                blownCount++;

                // 4. Check if ALL 3 are out
                if (blownCount === 3) {
                    // Wait a moment after the last candle, then reveal the journey
                    setTimeout(() => {
                        journey.classList.remove('hidden');
                        videoSec.classList.remove('hidden');
                        closing.classList.remove('hidden');
                        journey.scrollIntoView({ behavior: 'smooth' });
                    }, 2000);
                }
            });
        });
    }

    // ==========================================
    // UTILS: CONFETTI & SNAKE
    // ==========================================

    // Snake Scroll Logic (Keep your existing one)
    const snakePath = document.getElementById('snake-path');
    const journeySection = document.getElementById('scroll-journey');
    const pathLength = snakePath.getTotalLength();
    snakePath.style.strokeDasharray = pathLength;
    snakePath.style.strokeDashoffset = pathLength;

    window.addEventListener('scroll', () => {
        if(journeySection.classList.contains('hidden')) return;

        const sectionTop = journeySection.offsetTop;
        const sectionHeight = journeySection.offsetHeight;
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;

        if (scrollY > sectionTop - windowHeight) {
            let percentage = (scrollY - (sectionTop - windowHeight / 2)) / (sectionHeight - windowHeight / 2);
            percentage = Math.max(0, Math.min(1, percentage));
            const drawLength = pathLength * percentage;
            snakePath.style.strokeDashoffset = pathLength - drawLength;

            document.querySelectorAll('.journey-text').forEach((text, index) => {
                 if (percentage > (index + 1) / 5) text.classList.add('visible');
            });
        }
    });

    // Confetti
    function launchConfetti(amount = 100) {
        const canvas = document.getElementById('confetti-canvas');
        canvas.style.display = 'block';
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#d4af37', '#fdfbf7', '#e0c060', '#333'];

        for (let i = 0; i < amount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 10 + 5,
                speed: Math.random() * 3 + 2,
                angle: Math.random() * 6.2
            });
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, i) => {
                p.y += p.speed;
                p.x += Math.sin(p.angle) * 2;
                if (p.y > canvas.height) particles[i].y = -10;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            if(canvas.style.display !== 'none') requestAnimationFrame(draw);
        }
        draw();

        setTimeout(() => { canvas.style.display = 'none'; }, 5000);
    }

    // Video Autoplay (Keep existing)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                song1.pause();
                song2.pause();
                document.getElementById('birthday-video').play();
            }
        });
    }, { threshold: 0.5 });
    observer.observe(document.getElementById('video-section'));
});