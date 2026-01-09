document.addEventListener('DOMContentLoaded', () => {
    
    // --- Elements ---
    const startBtn = document.getElementById('start-btn');
    const welcomeSection = document.getElementById('welcome-section');
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
        launchConfetti(50);

        // Unlock Next Section
        const puzzleSection = document.getElementById('puzzle-section');
        puzzleSection.classList.remove('hidden');

        setTimeout(() => {
            puzzleSection.scrollIntoView({ behavior: 'smooth' });
            initPuzzleGame();
        }, 1500);
    }

    // ==========================================
    // GAME 2: PUZZLE (Fixed Grid - No Moving Pieces)
    // ==========================================
    let selectedPiece = null;

    function initPuzzleGame() {
        const puzzleBank = document.getElementById('puzzle-source');
        const puzzleTarget = document.getElementById('puzzle-target');

        // 1. Create 9 Empty Slots with position numbers
        puzzleTarget.innerHTML = '';
        for(let i = 0; i < 9; i++) {
            const slot = document.createElement('div');
            slot.classList.add('puzzle-slot');
            slot.dataset.slotIndex = i;
            slot.dataset.position = i + 1; // For visual numbering
            slot.addEventListener('click', () => handleSlotClick(slot));
            puzzleTarget.appendChild(slot);
        }

        // 2. Create 9 Pieces in FIXED GRID (no rearranging)
        puzzleBank.innerHTML = '';
        let pieceIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        pieceIndices.sort(() => 0.5 - Math.random()); // Shuffle order

        pieceIndices.forEach(index => {
            const piece = document.createElement('div');
            piece.classList.add('puzzle-piece');
            piece.dataset.id = index; // Correct position ID

            // Visual background position
            const row = Math.floor(index / 3);
            const col = index % 3;
            piece.style.backgroundPosition = `-${col * 100}px -${row * 100}px`;

            piece.addEventListener('click', (e) => handlePieceClick(e, piece));
            puzzleBank.appendChild(piece);
        });
    }

    function handlePieceClick(e, piece) {
        e.stopPropagation();

        // If clicking same piece, deselect
        if (selectedPiece === piece) {
            deselectAll();
            return;
        }

        // If we have a selected piece and click another piece, SWAP them
        if (selectedPiece && selectedPiece !== piece) {
            swapPieces(selectedPiece, piece);
            deselectAll();
            checkPuzzleWin();
            return;
        }

        // Select this piece
        deselectAll();
        piece.classList.add('selected');
        selectedPiece = piece;
    }

    function handleSlotClick(slot) {
        // Only act if we have a selected piece
        if (!selectedPiece) return;

        // Case 1: Slot is empty -> Move piece there
        if (slot.children.length === 0) {
            slot.appendChild(selectedPiece);
            deselectAll();
            checkPuzzleWin();
        }
        // Case 2: Slot has a piece -> Swap selected with slot's piece
        else {
            const pieceInSlot = slot.children[0];
            swapPieces(selectedPiece, pieceInSlot);
            deselectAll();
            checkPuzzleWin();
        }
    }

    function swapPieces(piece1, piece2) {
        const parent1 = piece1.parentNode;
        const parent2 = piece2.parentNode;

        const placeholder1 = document.createElement('div');
        const placeholder2 = document.createElement('div');

        parent1.insertBefore(placeholder1, piece1);
        parent2.insertBefore(placeholder2, piece2);

        parent1.replaceChild(piece2, placeholder1);
        parent2.replaceChild(piece1, placeholder2);
    }

    function deselectAll() {
        document.querySelectorAll('.puzzle-piece').forEach(p => p.classList.remove('selected'));
        selectedPiece = null;
    }

    function checkPuzzleWin() {
        const slots = document.querySelectorAll('.puzzle-slot');
        let correct = 0;

        slots.forEach((slot, index) => {
            if (slot.children.length > 0) {
                const piece = slot.children[0];
                const pieceId = parseInt(piece.dataset.id);
                if (pieceId === index) {
                    correct++;
                }
            }
        });

        // Win condition: All 9 pieces in correct positions
        if (correct === 9) {
            puzzleGameWon();
        }
    }

    function puzzleGameWon() {
        // Big confetti for puzzle win
        launchConfetti(150);

        // Show candle section after delay
        setTimeout(() => {
            const candleSection = document.getElementById('candle-section');
            candleSection.classList.remove('hidden');
            candleSection.scrollIntoView({ behavior: 'smooth' });
            initCandle();
        }, 2000);
    }

    // ==========================================
    // INTERACTION 3: CAKE & CANDLES (Individual Tap)
    // ==========================================
    function initCandle() {
        const candles = document.querySelectorAll('.candle');
        const wishMessage = document.querySelector('.wish-message');
        let candlesBlown = 0;

        candles.forEach(candle => {
            candle.addEventListener('click', (e) => {
                e.stopPropagation();

                const flame = candle.querySelector('.flame');
                const smoke = candle.querySelector('.smoke');

                // Only blow out if not already blown
                if (!flame.classList.contains('out')) {
                    // Blow out flame
                    flame.classList.add('out');

                    // Show smoke
                    setTimeout(() => {
                        smoke.classList.add('puff');
                    }, 100);

                    candlesBlown++;

                    // When all 3 candles blown
                    if (candlesBlown === 3) {
                        setTimeout(() => {
                            // Show wish message
                            wishMessage.classList.add('show');

                            // Show journey sections after message appears
                            setTimeout(() => {
                                const journey = document.getElementById('scroll-journey');
                                const videoSec = document.getElementById('video-section');
                                const closing = document.getElementById('closing-section');

                                journey.classList.remove('hidden');
                                videoSec.classList.remove('hidden');
                                closing.classList.remove('hidden');

                                journey.scrollIntoView({ behavior: 'smooth' });
                            }, 2000);
                        }, 500);
                    }
                }
            });
        });
    }

    // ==========================================
    // UTILS: CONFETTI & SNAKE
    // ==========================================

    // Snake Scroll Logic
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
        const colors = ['#d4af37', '#fdfbf7', '#e0c060', '#c9a96e', '#a88b5f'];

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

    // Video Autoplay
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