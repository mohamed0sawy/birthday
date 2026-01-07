document.addEventListener('DOMContentLoaded', () => {
    
    // --- Elements ---
    const startBtn = document.getElementById('start-btn');
    const welcomeSection = document.getElementById('welcome-section');
    const transitionMsg = document.getElementById('transition-message');
    const gameSection = document.getElementById('game-section'); // Initially hidden logic handled via scroll
    const gameGrid = document.getElementById('game-grid');
    const snakePath = document.getElementById('snake-path');
    const journeySection = document.getElementById('scroll-journey');
    const journeyTexts = document.querySelectorAll('.journey-text');
    const videoSection = document.getElementById('video-section');
    const birthdayVideo = document.getElementById('birthday-video');

    // --- Audio Setup ---
    const song1 = new Audio('audio/song1.mp3');
    const song2 = new Audio('audio/song2.mp3');
    song2.loop = true;
    let musicStarted = false;

    // --- 1. Start Journey ---
    startBtn.addEventListener('click', () => {

        song1.play()
                .then(() => {
                    console.log("Playback started successfully");
                })
                .catch(e => {
                    console.log("Playback blocked or failed:", e);
                });

            // Chain the second song
            song1.onended = () => {
                song2.play();
            };

        // UI Transition
        welcomeSection.style.display = 'none'; // Remove hero
        transitionMsg.classList.remove('hidden');
        
        // Scroll slightly to indicate movement
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Init Game
        initGame();
    });

    // --- 2. Memory Game Logic ---
    const icons = ['🎂', '🎁', '🎈', '✨', '🕯️', '🎉', '🎩', '🍰'];
    let cardsArray = [...icons, ...icons]; // Duplicate for pairs
    let flippedCards = [];
    let matchedPairs = 0;
    let lockBoard = false;

    function initGame() {
        // Shuffle
        cardsArray.sort(() => 0.5 - Math.random());
        
        // Create Grid
        gameGrid.innerHTML = '';
        cardsArray.forEach((icon) => {
            const card = document.createElement('div');
            card.classList.add('card');
            // Initially show content for 3 seconds
            card.innerHTML = `<span class="card-content">${icon}</span>`;
            card.classList.add('flipped'); 
            
            card.addEventListener('click', () => flipCard(card, icon));
            gameGrid.appendChild(card);
        });

        // Hide cards after 3 seconds
        setTimeout(() => {
            document.querySelectorAll('.card').forEach(c => {
                c.classList.remove('flipped');
            });
        }, 3000);
    }

    function flipCard(card, icon) {
        if (lockBoard || card.classList.contains('flipped') || card.classList.contains('matched')) return;

        card.classList.add('flipped');
        flippedCards.push({ card, icon });

        if (flippedCards.length === 2) {
            checkForMatch();
        }
    }

    function checkForMatch() {
        lockBoard = true;
        const [first, second] = flippedCards;

        if (first.icon === second.icon) {
            first.card.classList.add('matched');
            second.card.classList.add('matched');
            matchedPairs++;
            flippedCards = [];
            lockBoard = false;

            if (matchedPairs === icons.length) {
                gameWon();
            }
        } else {
            setTimeout(() => {
                first.card.classList.remove('flipped');
                second.card.classList.remove('flipped');
                flippedCards = [];
                lockBoard = false;
            }, 1000);
        }
    }


//    function gameWon() {
//        // Show the big popup
//        const popup = document.getElementById('game-message');
//        popup.classList.remove('hidden');
//
//        launchConfetti();
//
//        // Reveal the scroll section behind the scenes
//        journeySection.classList.remove('hidden');
//
//        // Handle the "Continue" button click
//        document.getElementById('continue-btn').onclick = function() {
//            // Fade out popup
//            popup.style.opacity = '0';
//            popup.style.transition = 'opacity 0.5s';
//
//            setTimeout(() => {
//                popup.classList.add('hidden'); // Remove it completely after fade
//                // Optional: Smooth scroll to the journey start
//                journeySection.scrollIntoView({ behavior: 'smooth' });
//            }, 500);
//        };
//    }

    function gameWon() {
        // 1. Show the Big Celebration Popup
        const popup = document.getElementById('game-message');
        popup.classList.remove('hidden');
        launchConfetti();

        // 2. UNLOCK the rest of the page
        // We remove 'hidden' from Journey, Video, and Closing sections
        document.getElementById('scroll-journey').classList.remove('hidden');
        document.getElementById('video-section').classList.remove('hidden');
        document.getElementById('closing-section').classList.remove('hidden');

        // 3. Handle "Continue" click
        document.getElementById('continue-btn').onclick = function() {
            popup.style.opacity = '0';
            setTimeout(() => {
                popup.classList.add('hidden');
                // Scroll to the start of the journey
                document.getElementById('scroll-journey').scrollIntoView({ behavior: 'smooth' });
            }, 500);
        };
    }

    // --- 3. Snake Scroll Animation ---
    // Get total length of the path
    const pathLength = snakePath.getTotalLength();
    
    // Set up initial dash properties to hide the line
    snakePath.style.strokeDasharray = pathLength;
    snakePath.style.strokeDashoffset = pathLength;

    window.addEventListener('scroll', () => {
        // Calculate scroll percentage relative to the journey section
        const sectionTop = journeySection.offsetTop;
        const sectionHeight = journeySection.offsetHeight;
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;

        // Start animating when section enters view
        if (scrollY > sectionTop - windowHeight) {
            // Calculate how far we've scrolled into the section
            let percentage = (scrollY - (sectionTop - windowHeight / 2)) / (sectionHeight - windowHeight / 2);
            
            // Clamp percentage between 0 and 1
            percentage = Math.max(0, Math.min(1, percentage));

            // Draw the line based on percentage
            const drawLength = pathLength * percentage;
            snakePath.style.strokeDashoffset = pathLength - drawLength;

            // Fade in text blocks based on percentage
            journeyTexts.forEach((text, index) => {
                // Determine threshold for each text block (e.g., 0.2, 0.4, etc.)
                const threshold = (index + 1) / (journeyTexts.length + 1);
                if (percentage > threshold) {
                    text.classList.add('visible');
                }
            });
        }
    });

    // --- 4. Video Auto-Play & Audio Stop ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Stop background music
                song1.pause();
                song2.pause();
                
                // Play video
                birthdayVideo.play();
            }
        });
    }, { threshold: 0.5 }); // Trigger when 50% visible

    observer.observe(videoSection);

    // --- 5. Simple Confetti Logic (No external libraries) ---
    function launchConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#d4af37', '#fdfbf7', '#e0c060', '#333'];

        for (let i = 0; i < 100; i++) {
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
                p.angle += 0.1;

                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                if (p.y > canvas.height) particles[i].y = -10;
            });
            requestAnimationFrame(draw);
        }
        
        draw();
        
        // Stop confetti after 5 seconds to save battery
        setTimeout(() => {
            canvas.style.display = 'none';
        }, 9000);
    }
});