// Initialize Firebase (replace with your config)

const firebaseConfig = {
    apiKey: "AIzaSyD8L3X9vsq2tExPXiWRBLgOu90HWj6LMqg",
    authDomain: "snooker-scoreboard-9bd49.firebaseapp.com",
    projectId: "snooker-scoreboard-9bd49",
    storageBucket: "snooker-scoreboard-9bd49.firebasestorage.app",
    messagingSenderId: "563361708567",
    appId: "1:563361708567:web:3a0b623280fb19915c3a52",
    measurementId: "G-PWXHWTL1SX"
  };

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM elements
const playersTable = document.getElementById('players-table');
const playerSelects = document.querySelectorAll('.form-select');
const pinInputs = document.querySelectorAll('.pin-input');
const matchForm = document.getElementById('match-form');
const toast = new bootstrap.Toast(document.getElementById('toast'));
const toastMessage = document.getElementById('toast-message');

// Load players data and populate table/selects
function loadPlayers() {
    database.ref('players').once('value').then((snapshot) => {
        const playersData = snapshot.val();
        const playersArray = Object.values(playersData).map(player => {
            return {
                ...player,
                losses: player.games - player.wins,
                percentage: ((player.wins / player.games) * 100).toFixed(2) + '%'
            };
        });

        // Sort by percentage (descending)
        playersArray.sort((a, b) => {
            const aPerc = parseFloat(a.percentage);
            const bPerc = parseFloat(b.percentage);
            return bPerc - aPerc;
        });

        // Clear table
        playersTable.innerHTML = '';

        // Populate table
        playersArray.forEach(player => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${player.name}</td>
                <td>${player.wins}</td>
                <td>${player.games}</td>
                <td>${player.losses}</td>
                <td>${player.percentage}</td>
            `;
            playersTable.appendChild(row);
        });

        // Populate player selects
        const playerOptions = playersArray.map(player => 
            `<option value="${player.name.toLowerCase()}">${player.name}</option>`
        ).join('');
        
        playerSelects.forEach(select => {
            // Keep the current value if one is selected
            const currentValue = select.value;
            select.innerHTML = select.querySelector('option[value=""]').outerHTML + playerOptions;
            if (currentValue) {
                select.value = currentValue;
            }
        });
    });
}

// Validate PINs
async function validatePins(pins, selectedPlayers) {
    return new Promise((resolve) => {
        database.ref('pins').once('value').then(async (snapshot) => {
            const pinsData = snapshot.val();
            const validPins = [];
            const playerPins = selectedPlayers.map(player => pinsData[player]);
            
            // Check each entered PIN against the player PINs
            for (const pin of pins) {
                let pinEncoded = await sha256(pin);
                if (pinEncoded && playerPins.includes(pinEncoded)) {
                    validPins.push(pinEncoded);
                }
            }
            
            resolve(validPins.length === selectedPlayers.length);
        });
    });
}

// Handle form submission
matchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get selected players
    const team1Player1 = document.querySelector('.team1-player1').value;
    const team1Player2 = document.querySelector('.team1-player2').value;
    const team2Player1 = document.querySelector('.team2-player1').value;
    const team2Player2 = document.querySelector('.team2-player2').value;
    
    // Validate at least one player per team
    if (!team1Player1 || !team2Player1) {
        showToast('Cada time deve ter pelo menos um jogador!', 'danger');
        return;
    }
    
    // Get PINs
    const pins = Array.from(pinInputs)
        .map(input => input.value.trim())
        .filter(pin => pin !== '');
    
    if (pins.length < 3) {
        showToast('Pelo menos 3 PINs são necessários!', 'danger');
        return;
    }
    
    // Get all selected players
    const selectedPlayers = [
        team1Player1, 
        team1Player2, 
        team2Player1, 
        team2Player2
    ].filter(player => player !== '');
    
    // Validate PINs
    const pinsValid = await validatePins(pins, selectedPlayers);
    
    if (!pinsValid) {
        showToast('Necessário 3 PINs válidos dos jogadores envolvidos.', 'danger');
        return;
    }
    
    // Update player stats
    try {
        // Team 1 (winners)
        await updatePlayerStats(team1Player1, true);
        if (team1Player2) await updatePlayerStats(team1Player2, true);
        
        // Team 2 (losers)
        await updatePlayerStats(team2Player1, false);
        if (team2Player2) await updatePlayerStats(team2Player2, false);
        
        showToast('Partida registrada com sucesso!', 'success');
        matchForm.reset();
        bootstrap.Modal.getInstance(document.getElementById('addMatchModal')).hide();
        loadPlayers();
    } catch (error) {
        showToast('Erro ao registrar partida: ' + error.message, 'danger');
    }
});

// Update player stats in Firebase
function updatePlayerStats(playerId, isWinner) {
    return new Promise((resolve, reject) => {
        const playerRef = database.ref(`players/${playerId}`);
        
        playerRef.transaction((player) => {
            if (player) {
                player.games = (player.games || 0) + 1;
                if (isWinner) {
                    player.wins = (player.wins || 0) + 1;
                }
            }
            return player;
        }, (error, committed) => {
            if (error) {
                reject(error);
            } else if (!committed) {
                reject(new Error('Jogador não encontrado'));
            } else {
                resolve();
            }
        });
    });
}

// Show toast notification
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    const toastEl = document.getElementById('toast');
    
    // Remove previous color classes
    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-primary');
    
    // Add appropriate color class
    if (type === 'success') {
        toastEl.classList.add('bg-success');
    } else if (type === 'danger') {
        toastEl.classList.add('bg-danger');
    } else {
        toastEl.classList.add('bg-primary');
    }
    
    toast.show();
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadPlayers();
});

async function sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

  