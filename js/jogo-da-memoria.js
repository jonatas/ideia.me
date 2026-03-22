const allIcons = [
  "/images/icons/general/barrier.json",
  "/images/icons/general/confidence.json",
  "/images/icons/general/connection.json",
  "/images/icons/general/folders.json",
  "/images/icons/general/goal.json",
  "/images/icons/general/growth.json",
  "/images/icons/general/idea.json",
  "/images/icons/general/love.json",
  "/images/icons/general/mentoring.json",
  "/images/icons/general/notebook.json",
  "/images/icons/general/options.json",
  "/images/icons/general/puzzle.json",
  "/images/icons/general/share.json",
  "/images/icons/general/support.json",
  "/images/icons/general/truck.json",
  "/images/icons/general/warehouse.json"
];

let iconNames = [];
let howManyDifferent = 4;
let level = 1;

const board = document.getElementById('board');
const statusText = document.getElementById('game_status');

const pickIconsToPlay = () => {
    iconNames = [];
    if (howManyDifferent > allIcons.length) howManyDifferent = allIcons.length;
    
    for (let i = 0; i < howManyDifferent; i++) {
        let name = null;
        while (name == null || iconNames.includes(name)) {
            name = allIcons[Math.floor(Math.random() * allIcons.length)];
        }
        iconNames.push(name);
    }
    return iconNames;
}

const pickRandom = (array) => {
    let index = Math.floor(array.length * Math.random());
    return array.splice(index, 1)[0];
}

const getFlippedUnsolved = () => {
    const flipped = [];
    for(let i = 0; i < board.children.length; i++) {
        let card = board.children[i];
        if (card.classList.contains('flipped') && !card.classList.contains('solved')) {
            flipped.push(card);
        }
    }
    return flipped;
}

const isGameFinished = () => {
    for(let i = 0; i < board.children.length; i++) {
        if (!board.children[i].classList.contains('solved')) return false;
    }
    return true;
}

const resetUnsolved = () => {
    const flipped = getFlippedUnsolved();
    flipped.forEach(card => {
        card.classList.remove('flipped');
    });
}

const toggleCard = (e) => {
    const currentCard = e.currentTarget;
    
    // Ignore clicks on already solved or flipped cards
    if (currentCard.classList.contains('solved') || currentCard.classList.contains('flipped')) {
        return;
    }

    const currentlyFlipped = getFlippedUnsolved();
    
    // If we already have 2 flipped and are waiting for reset, ignore new clicks
    if (currentlyFlipped.length >= 2) {
        return;
    }

    currentCard.classList.add('flipped');
    currentlyFlipped.push(currentCard);

    if (currentlyFlipped.length === 2) {
        const icon1 = currentlyFlipped[0].dataset.icon;
        const icon2 = currentlyFlipped[1].dataset.icon;

        if (icon1 === icon2) {
            // Match!
            currentlyFlipped[0].classList.add('solved');
            currentlyFlipped[1].classList.add('solved');
            
            if (isGameFinished()) {
                setTimeout(() => {
                    howManyDifferent += 2;
                    level++;
                    if (howManyDifferent > allIcons.length) {
                        statusText.innerHTML = "You beat all levels! 🎉";
                        howManyDifferent = 4; // Reset to loop or cap
                        level = 1;
                        setTimeout(play, 3000);
                    } else {
                        board.innerHTML = "";
                        statusText.innerHTML = `Level ${level} - Find ${howManyDifferent} pairs`;
                        play();
                    }
                }, 1000);
            }
        } else {
            // No match
            setTimeout(resetUnsolved, 1000);
        }
    }
}

const createCard = (iconName) => {
    const card = document.createElement('div');
    card.className = 'memory-card lorenzo-game-container';
    card.dataset.icon = iconName;
    card.onclick = toggleCard;

    const back = document.createElement('div');
    back.className = 'memory-card-face memory-card-back';
    
    const front = document.createElement('div');
    front.className = 'memory-card-face memory-card-front';

    const player = document.createElement("lottie-player");
    player.setAttribute("src", iconName);
    player.setAttribute("background", "transparent");
    player.setAttribute("speed", "1");
    player.setAttribute("loop", "");
    player.setAttribute("autoplay", "");
    // size matching
    player.style.width = "80%";
    player.style.height = "80%";
    
    front.appendChild(player);

    card.appendChild(back);
    card.appendChild(front);

    return card;
}

const play = () => {
    pickIconsToPlay();
    statusText.innerHTML = `Level ${level} - Find ${howManyDifferent} pairs`;
    
    let duplicatedIcons = iconNames.concat(iconNames);
    board.innerHTML = "";

    while (duplicatedIcons.length > 0) {
        let iconToAdd = pickRandom(duplicatedIcons);
        board.appendChild(createCard(iconToAdd));
    }
}

play();
