// ==================== Audio Elements ====================
const song1 = document.getElementById('song1');
const song2 = document.getElementById('song2');
const video = document.getElementById('birthday-video');

// ==================== Section Elements ====================
const welcomeSection = document.getElementById('welcome');
const journeyStartSection = document.getElementById('journey-start');
const gameSection = document.getElementById('game-section');
const scrollJourneySection = document.getElementById('scroll-journey');
const videoSection = document.getElementById('video-section');
const closingSection = document.getElementById('closing');

// ==================== Start Button Handler ====================
document.getElementById('startBtn').addEventListener('click', () => {
    // Hide welcome, show journey start
    welcomeSection.classList.add('hidden');
    journeyStartSection.classList.remove('hidden');

    // Play first song
    song1.play().catch(err => console.log('Audio play failed:', err));

    // When song1 ends, play song2 in loop
    song1.addEventListener('ended', () => {
        song2.play().catch(err => console.log('Audio play failed:', err));
    });

    // After 3 seconds, show game section
    setTimeout(() => {
        journeyStartSection.classList.add('hidden');
        gameSection.classList.remove('hidden');
        initGame();
    }, 3000);
});

// ==================== Memory Card Game ====================
const cardIcons = ['🎂', '🎁', '🎈', '🎉', '🎊', '🌟', '✨', '🎵'];
const cards = [...cardIcons, ...cardIcons]; // Duplicate for matching pairs
let flippedCards = [];
let matchedPairs = 0;
let canFlip = false;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function initGame() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';

    const shuffledCards = shuffleArray([...cards]);

    // Create card elements
    shuffledCards.forEach((icon, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.icon = icon;
        card.dataset.index = index;
        card.innerHTML = `
            <div class="card-back">❓</div>
            <div class="card-front">${icon}</div>
        `;
        gameBoard.appendChild(card);
    });

    // Show all cards for 3 seconds
    const allCards = document.querySelectorAll('.card');
    allCards.forEach(card => card.classList.add('flipped'));

    setTimeout(() => {
        allCards.forEach(card => card.classList.remove('flipped'));
        canFlip = true;

        // Add click listeners
        allCards.forEach(card => {
            card.addEventListener('click', handleCardClick);
        });
    }, 3000);
}

function handleCardClick(e) {
    if (!canFlip) return;

    const card = e.currentTarget;

    // Ignore if already flipped or matched
    if (card.classList.contains('flipped') || card.classList.contains('matched')) {
        return;
    }

    // Flip the card
    card.classList.add('flipped');
    flippedCards.push(card);

    // Check for match when 2 cards are flipped
    if (flippedCards.length === 2) {
        canFlip = false;
        checkMatch();
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    const icon1 = card1.dataset.icon;
    const icon2 = card2.dataset.icon;

    if (icon1 === icon2) {
        // Match found
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;

        flippedCards = [];
        canFlip = true;

        // Check if game is complete
        if (matchedPairs === cardIcons.length) {
            setTimeout(() => {
                showCompletionMessage();
            }, 500);
        }
    } else {
        // No match - flip back after delay
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
            canFlip = true;
        }, 1000);
    }
}

function showCompletionMessage() {
    const completionMessage = document.getElementById('completion-message');
    completionMessage.classList.remove('hidden');

    // Create confetti
    createConfetti();

    // After 3 seconds, show scroll journey section
    setTimeout(() => {
        gameSection.classList.add('hidden');
        scrollJourneySection.classList.remove('hidden');
        initScrollJourney();
    }, 3000);
}

function createConfetti() {
    const colors = ['#c9a96e', '#a88b5f', '#8b6f47', '#d4c4ab'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 5000);
    }
}

// ==================== Scroll Journey Section ====================
function initScrollJourney() {
    const phrases = document.querySelectorAll('.scroll-phrase');
    const arrowPath = document.getElementById('arrowPath');
    const scrollJourney = document.getElementById('scroll-journey');

    // Scroll observer for phrases
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.5
    });

    phrases.forEach(phrase => observer.observe(phrase));

    // Animate arrow on scroll
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollJourneyRect = scrollJourney.getBoundingClientRect();

        // Only animate when scroll journey is visible
        if (scrollJourneyRect.top < window.innerHeight && scrollJourneyRect.bottom > 0) {
            const scrollProgress = Math.min(1, Math.max(0,
                (window.innerHeight - scrollJourneyRect.top) / (scrollJourney.offsetHeight)
            ));

            // Expand arrow based on scroll progress
            const maxHeight = 800;
            const currentHeight = 100 + (scrollProgress * (maxHeight - 100));

            arrowPath.setAttribute('d',
                `M 50 0 L 50 ${currentHeight - 100} L 35 ${currentHeight - 115} M 50 ${currentHeight - 100} L 65 ${currentHeight - 115}`
            );
        }

        lastScrollTop = window.pageYOffset;
    });

    // Show video section when scroll journey is nearly complete
    window.addEventListener('scroll', checkVideoSection);
}

// ==================== Video Section Handler ====================
function checkVideoSection() {
    const scrollJourneyRect = scrollJourneySection.getBoundingClientRect();

    // When scroll journey is mostly scrolled past
    if (scrollJourneyRect.bottom < window.innerHeight / 2 && videoSection.classList.contains('hidden')) {
        scrollJourneySection.classList.add('hidden');
        videoSection.classList.remove('hidden');

        // Stop background music and play video
        song2.pause();

        // Play video when it enters viewport
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    video.play().catch(err => console.log('Video play failed:', err));
                }
            });
        }, { threshold: 0.5 });

        videoObserver.observe(video);

        // When video ends, show closing section
        video.addEventListener('ended', () => {
            videoSection.classList.add('hidden');
            closingSection.classList.remove('hidden');
        });

        // Remove scroll listener
        window.removeEventListener('scroll', checkVideoSection);
    }
}