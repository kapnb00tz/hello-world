// Game State
let deck = [];
let playerHand = [];
let dealerHand = [];
let balance = 1000;
let currentBet = 0;
let wins = 0;
let losses = 0;
let gameInProgress = false;
let dealerHiddenCard = null;

// Card suits and values
const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Initialize game
function init() {
    updateStats();
}

// Create and shuffle deck (4-deck shoe)
function createDeck() {
    deck = [];
    // Create 4 decks (208 cards total)
    for (let deckNum = 0; deckNum < 4; deckNum++) {
        for (let suit of suits) {
            for (let value of values) {
                deck.push({
                    suit: suit,
                    value: value,
                    numValue: getCardValue(value)
                });
            }
        }
    }
    shuffleDeck();
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function getCardValue(value) {
    if (value === 'A') return 11;
    if (['J', 'Q', 'K'].includes(value)) return 10;
    return parseInt(value);
}

// Calculate hand value
function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;

    for (let card of hand) {
        value += card.numValue;
        if (card.value === 'A') aces++;
    }

    // Adjust for aces
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }

    return value;
}

// Betting functions
function setBet(amount) {
    if (amount > balance) {
        showMessage('Insufficient funds!', 'lose');
        return;
    }
    currentBet = amount;
    document.getElementById('current-bet').textContent = currentBet;
    showMessage(`Bet set to $${currentBet}`, '');
}

function setCustomBet() {
    const customAmount = parseInt(document.getElementById('custom-bet').value);
    if (isNaN(customAmount) || customAmount <= 0) {
        showMessage('Please enter a valid bet amount', 'lose');
        return;
    }
    if (customAmount > balance) {
        showMessage('Insufficient funds!', 'lose');
        return;
    }
    currentBet = customAmount;
    document.getElementById('current-bet').textContent = currentBet;
    document.getElementById('custom-bet').value = '';
    showMessage(`Bet set to $${currentBet}`, '');
}

// Start new game
function startGame() {
    if (currentBet === 0) {
        showMessage('Please place a bet first!', 'lose');
        return;
    }

    if (currentBet > balance) {
        showMessage('Insufficient funds!', 'lose');
        return;
    }

    gameInProgress = true;
    createDeck();
    playerHand = [];
    dealerHand = [];
    dealerHiddenCard = null;

    // Hide betting controls, show game controls
    document.getElementById('betting-controls').style.display = 'none';
    document.getElementById('game-controls').style.display = 'flex';
    document.getElementById('new-round-btn').style.display = 'none';

    // Deal initial cards
    playerHand.push(deck.pop());
    dealerHand.push(deck.pop());
    playerHand.push(deck.pop());
    dealerHiddenCard = deck.pop();
    dealerHand.push(dealerHiddenCard);

    renderHands(true);
    showMessage('', '');

    // Check for blackjack
    if (calculateHandValue(playerHand) === 21) {
        stand();
    }
}

// Player actions
function hit() {
    if (!gameInProgress) return;

    playerHand.push(deck.pop());
    renderHands(true);

    const playerValue = calculateHandValue(playerHand);
    if (playerValue > 21) {
        endGame('bust');
    } else if (playerValue === 21) {
        stand();
    }

    // Disable double down after first hit
    const doubleDownBtn = document.querySelector('.btn-secondary');
    if (doubleDownBtn) {
        doubleDownBtn.disabled = true;
    }
}

function stand() {
    if (!gameInProgress) return;

    gameInProgress = false;
    document.getElementById('game-controls').style.display = 'none';

    // Reveal dealer's hidden card
    renderHands(false);

    // Dealer plays
    setTimeout(() => {
        playDealer();
    }, 500);
}

function doubleDown() {
    if (!gameInProgress) return;
    if (playerHand.length !== 2) return;
    if (currentBet * 2 > balance) {
        showMessage('Insufficient funds to double down!', 'lose');
        return;
    }

    currentBet *= 2;
    document.getElementById('current-bet').textContent = currentBet;

    // Take one more card and stand
    playerHand.push(deck.pop());
    renderHands(true);

    const playerValue = calculateHandValue(playerHand);
    if (playerValue > 21) {
        endGame('bust');
    } else {
        stand();
    }
}

function playDealer() {
    const dealerValue = calculateHandValue(dealerHand);

    if (dealerValue < 17) {
        dealerHand.push(deck.pop());
        renderHands(false);
        setTimeout(() => playDealer(), 500);
    } else {
        determineWinner();
    }
}

function determineWinner() {
    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(dealerHand);

    if (dealerValue > 21) {
        endGame('dealer-bust');
    } else if (playerValue > dealerValue) {
        endGame('win');
    } else if (playerValue < dealerValue) {
        endGame('lose');
    } else {
        endGame('push');
    }
}

function endGame(result) {
    gameInProgress = false;
    document.getElementById('game-controls').style.display = 'none';
    document.getElementById('new-round-btn').style.display = 'block';

    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(dealerHand);

    let message = '';
    let messageClass = '';

    switch(result) {
        case 'bust':
            message = `Bust! You lose $${currentBet}`;
            messageClass = 'lose';
            balance -= currentBet;
            losses++;
            break;
        case 'dealer-bust':
            message = `Dealer busts! You win $${currentBet}`;
            messageClass = 'win';
            balance += currentBet;
            wins++;
            break;
        case 'win':
            // Check for blackjack (pays 3:2)
            if (playerValue === 21 && playerHand.length === 2) {
                const winAmount = Math.floor(currentBet * 1.5);
                message = `Blackjack! You win $${winAmount}`;
                balance += winAmount;
            } else {
                message = `You win $${currentBet}`;
                balance += currentBet;
            }
            messageClass = 'win';
            wins++;
            break;
        case 'lose':
            message = `You lose $${currentBet}`;
            messageClass = 'lose';
            balance -= currentBet;
            losses++;
            break;
        case 'push':
            message = `Push! Bet returned`;
            messageClass = 'push';
            break;
    }

    showMessage(message, messageClass);
    updateStats();

    // Check if player is out of money
    if (balance <= 0) {
        setTimeout(() => {
            alert('You\'re out of money! Resetting to $1000');
            balance = 1000;
            wins = 0;
            losses = 0;
            updateStats();
        }, 1000);
    }
}

function newRound() {
    currentBet = 0;
    document.getElementById('current-bet').textContent = 0;
    document.getElementById('betting-controls').style.display = 'block';
    document.getElementById('new-round-btn').style.display = 'none';
    document.getElementById('player-cards').innerHTML = '';
    document.getElementById('dealer-cards').innerHTML = '';
    document.getElementById('player-score').textContent = '';
    document.getElementById('dealer-score').textContent = '';
    showMessage('Place your bet to start!', '');
}

// Render cards
function renderHands(hideDealer) {
    // Render player hand
    const playerCardsDiv = document.getElementById('player-cards');
    playerCardsDiv.innerHTML = '';
    playerHand.forEach(card => {
        playerCardsDiv.appendChild(createCardElement(card));
    });
    const playerValue = calculateHandValue(playerHand);
    document.getElementById('player-score').textContent = `(${playerValue})`;

    // Render dealer hand
    const dealerCardsDiv = document.getElementById('dealer-cards');
    dealerCardsDiv.innerHTML = '';

    if (hideDealer && dealerHand.length > 0) {
        // Show first card
        dealerCardsDiv.appendChild(createCardElement(dealerHand[0]));
        // Hide second card
        dealerCardsDiv.appendChild(createCardElement(null, true));
        document.getElementById('dealer-score').textContent = `(${dealerHand[0].numValue})`;
    } else {
        dealerHand.forEach(card => {
            dealerCardsDiv.appendChild(createCardElement(card));
        });
        const dealerValue = calculateHandValue(dealerHand);
        document.getElementById('dealer-score').textContent = `(${dealerValue})`;
    }
}

function createCardElement(card, hidden = false) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';

    if (hidden) {
        cardDiv.classList.add('hidden');
    } else {
        const color = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';
        cardDiv.classList.add(color);

        const valueSpan = document.createElement('div');
        valueSpan.className = 'card-value';
        valueSpan.textContent = card.value;

        const suitSpan = document.createElement('div');
        suitSpan.className = 'card-suit';
        suitSpan.textContent = card.suit;

        cardDiv.appendChild(valueSpan);
        cardDiv.appendChild(suitSpan);
    }

    return cardDiv;
}

function showMessage(text, className) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + className;
}

function updateStats() {
    document.getElementById('balance').textContent = `$${balance}`;
    document.getElementById('wins').textContent = wins;
    document.getElementById('losses').textContent = losses;
}

// Initialize on load
init();
