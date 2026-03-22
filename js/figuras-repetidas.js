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

let iconNames = [...allIcons];

const fruits = document.getElementById('fruits');
const fruitsCounter = document.getElementById('fruits_counter');

let clicksCounter = 0;
let playWithN = 12;
let howManyDifferent = 4;

const pickFruitsToPlay = () => {
    howManyDifferent += 1;
    if (howManyDifferent > allIcons.length) howManyDifferent = allIcons.length;
    
    iconNames = [];
    for (let i = 0; i < howManyDifferent; i++) {
        let name = null;
        while (name == null || iconNames.includes(name)){
            name = allIcons[Math.floor(Math.random() * allIcons.length)];
        }
        iconNames.push(name);
    }
    draw();
}

const checkClick = (event) => {
    const player = event.currentTarget;
    const src = player.getAttribute('src');
    clicksCounter += 1;
    let count = 0;
    
    for(let i = 0; i < fruits.children.length; i++){
        let container = fruits.children[i];
        container.style.border = "none";
        container.style.boxShadow = "none";
        container.style.padding = "0";
        
        let innerPlayer = container.querySelector('lottie-player');
        if (innerPlayer && src === innerPlayer.getAttribute('src')) {
            count++;
        }
    }
    
    if (count === 1) {
        // Success: Found the unique icon!
        playWithN = fruits.children.length + 4;
        pickFruitsToPlay();
    } else {
        // Mistake: Clicked a repeated icon
        for(let i = 0; i < fruits.children.length; i++){
            let container = fruits.children[i];
            let innerPlayer = container.querySelector('lottie-player');
            if (innerPlayer && src === innerPlayer.getAttribute('src')) {
                container.style.border = "2px dotted var(--primary-light-blue)";
                container.style.borderRadius = "8px";
                container.style.padding = "4px";
            }
        }
    }
}

const createIcon = (name) => {
    const container = document.createElement("div");
    container.className = "icon-item";
    
    const player = document.createElement("lottie-player");
    player.setAttribute("src", name);
    player.setAttribute("background", "transparent");
    player.setAttribute("speed", "1");
    player.setAttribute("loop", "");
    player.setAttribute("autoplay", "");
    player.setAttribute("hover", "");
    player.style.cursor = "pointer";
    player.style.pointerEvents = "auto";
    player.onclick = checkClick;
    
    // Start with a small size, will be grown by resizeAll
    player.style.width = "40px";
    player.style.height = "40px";
    
    container.appendChild(player);
    return container;
}

const randomIconPosition = () => {
  return Math.floor(Math.random() * iconNames.length);
}

const randomIconLess = (iconInt) => {
    let random = null;
    while (random == null || iconInt === random) {
        random = randomIconPosition();
    }
    return random;
}


const resizeAll = (height = 40) => {
    // Apply new size to all icons
    for(let i = 0; i < fruits.children.length; i++){
        let player = fruits.children[i].querySelector('lottie-player');
        if(player) {
            player.style.width = height + "px";
            player.style.height = height + "px";
        }
    }

    fruitsCounter.innerHTML = `items: ${fruits.children.length} clicks: ${clicksCounter}`;
    
    const grow = () => {
        if (!fruits.children.length) return;
        const lastChild = fruits.children[fruits.children.length - 1];
        const bottom = lastChild.getBoundingClientRect().bottom;
        // Increase size until it reasonably fills the viewport height
        if (bottom + height < window.innerHeight - 60 && height < 180) {
            resizeAll(height + 4);
        }
    };

    // Delay slight growth to allow DOM paint
    setTimeout(grow, 10);
}

const addIcon = (iconPosition) => {
    fruits.appendChild(createIcon(iconNames[iconPosition]));
}

const draw = () => {
    fruits.innerHTML = "";
    
    let uniqueIcon = randomIconPosition();
    let randomMoment = Math.floor(Math.random() * (playWithN - 1));
    
    for (let i = 0; i < playWithN - 1; i++) {
        addIcon(randomIconLess(uniqueIcon));
        if (i === randomMoment) {
            addIcon(uniqueIcon);
        }
    }
    
    resizeAll(40);
}

// Optional window resize listener to restart growth if window enlarges
window.addEventListener('resize', () => {
    resizeAll(40);
});

pickFruitsToPlay();
