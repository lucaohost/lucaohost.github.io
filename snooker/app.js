// It's the free firebase version, it's useless try DDoS, save your time.
const firebaseConfig = {
    apiKey: "AIzaSyBsP4YSbp3qeK-ViyVXhWp8Jf3KetimveU",
    authDomain: "snooker-scoreboard2.firebaseapp.com",
    projectId: "snooker-scoreboard2",
    storageBucket: "snooker-scoreboard2.firebasestorage.app",
    messagingSenderId: "695835616380",
    appId: "1:695835616380:web:17fc21b1d88f26c63055f9"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const playersTable = document.getElementById('players-table');
const playerSelects = document.querySelectorAll('.form-select');
const pinInputs = document.querySelectorAll('.pin-input');
const matchForm = document.getElementById('match-form');
const toast = new bootstrap.Toast(document.getElementById('toast'));
const toastMessage = document.getElementById('toast-message');

function loadPlayers() {
        database.ref('players').once('value').then((snapshot) => {
        const playersData = snapshot.val();
        const maxWins = Math.max(...Object.values(playersData).map(player => player.wins));
        const minWins = Math.floor(maxWins / 2);
        
        const playersArray = Object.values(playersData).map(player => {
            player.qualified = player.wins >= minWins;
            
            player.percentage = ((player.wins / player.games) * 100).toFixed(2) + '%';

            if (player.name === 'Valdir' || player.name === 'Tamara') {
                player.percentage = 'WO';
                player.qualified = false;
            }
                     
            return {
                ...player,
                losses: player.games - player.wins,
                percentage: player.percentage,
                qualified: player.qualified
            };
        });

        const qualifiedPlayers = playersArray.filter(p => p.qualified);
        const unclassifiedPlayers = playersArray.filter(p => !p.qualified && p.percentage !== 'WO');
        const woPlayers = playersArray.filter(p => p.percentage === 'WO');

        qualifiedPlayers.sort((a, b) => {
            const aPerc = parseFloat(a.percentage);
            const bPerc = parseFloat(b.percentage);
            return bPerc - aPerc;
        });
        
        unclassifiedPlayers.sort((a, b) => {
            const aPerc = parseFloat(a.percentage);
            const bPerc = parseFloat(b.percentage);
            return bPerc - aPerc;
        });
        
        const sortedPlayers = [...qualifiedPlayers, ...unclassifiedPlayers, ...woPlayers];

        playersTable.innerHTML = '';

        let position = 1;
        sortedPlayers.forEach(player => {
            const row = document.createElement('tr');
            if (!player.qualified) {
                row.classList.add('unclassified');
            } else{
                row.classList.add('classified');
            }
            
            row.innerHTML = `
                <td>${position++}</td>
                <td>${player.name}</td>
                <td>${player.wins}</td>
                <td>${player.games}</td>
                <td>${player.losses}</td>
                <td>${player.percentage}</td>
            `;
            playersTable.appendChild(row);
        });

        const playerOptions = playersArray.map(player => 
            `<option value="${player.name.toLowerCase()}">${player.name}</option>`
        ).join('');
        
        playerSelects.forEach(select => {
    
            const currentValue = select.value;
            select.innerHTML = select.querySelector('option[value=""]').outerHTML + playerOptions;
            if (currentValue) {
                select.value = currentValue;
            }
        });
    });
}
async function validatePins(pins, selectedPlayers) {
    return new Promise((resolve) => {
        database.ref('pins').once('value').then(async (snapshot) => {
            const pinsData = snapshot.val();
            const validPins = [];
            const playerPins = selectedPlayers.map(player => pinsData[player]);
            
            for (const pinIndex in pins) {
                let pinEncoded = await sha256(pins[pinIndex]);
                if (pinEncoded && playerPins.includes(pinEncoded)) {
                    validPins.push(pinEncoded);
                } else {
                    showToast(`Pin número ${parseInt(pinIndex) + 1} inválido.`, 'danger');
                    matchForm.querySelector('button[type="submit"]').disabled = false;
                    return
                }
            }
            
            resolve(validPins.length === selectedPlayers.length);
        });
    });
}
matchForm.addEventListener('submit', async (e) => {
    matchForm.querySelector('button[type="submit"]').disabled = true;
    e.preventDefault();
    
    const team1Player1 = document.querySelector('.team1-player1').value;
    const team1Player2 = document.querySelector('.team1-player2').value;
    const team2Player1 = document.querySelector('.team2-player1').value;
    const team2Player2 = document.querySelector('.team2-player2').value;
    
    if (!team1Player1 || !team2Player1) {
        showToast('Cada time deve ter pelo menos um jogador!', 'danger');
        return;
    }
    
    const pins = Array.from(pinInputs)
        .map(input => input.value.trim())
        .filter(pin => pin !== '');
    
    if (pins.length < 3) {
        showToast('Pelo menos 3 PINs são necessários!', 'danger');
        return;
    }
    
    const selectedPlayers = [
        team1Player1, 
        team1Player2, 
        team2Player1, 
        team2Player2
    ].filter(player => player !== '');
    
    const pinsValid = await validatePins(pins, selectedPlayers);
    
    if (!pinsValid) {
        matchForm.querySelector('button[type="submit"]').disabled = false;
        showToast('Necessário 3 PINs válidos dos jogadores envolvidos.', 'danger');
        return;
    }
    
    try {
        await updatePlayerStats(team1Player1, true);
        if (team1Player2) await updatePlayerStats(team1Player2, true);

        await updatePlayerStats(team2Player1, false);
        if (team2Player2) await updatePlayerStats(team2Player2, false);
        
        showToast('Partida registrada com sucesso!', 'success');
        matchForm.reset();
        bootstrap.Modal.getInstance(document.getElementById('addMatchModal')).hide();
        loadPlayers();
        setTimeout(() => {
            const winners = [team1Player1, team1Player2].filter(player => player).join(' e ');
            const losers = [team2Player1, team2Player2].filter(player => player).join(' e ');
            const shareMessage = `Vencedores: ${winners}\nPerdedores: ${losers}`;
            captureAndShare(shareMessage);
            matchForm.querySelector('button[type="submit"]').disabled = false;
        }, 1500);
    } catch (error) {
        matchForm.querySelector('button[type="submit"]').disabled = false;
        showToast('Erro ao registrar partida: ' + error.message, 'danger');
    }
});

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

function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    const toastEl = document.getElementById('toast');
    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-primary');
    if (type === 'success') {
        toastEl.classList.add('bg-success');
    } else if (type === 'danger') {
        toastEl.classList.add('bg-danger');
    } else {
        toastEl.classList.add('bg-primary');
    }
    toast.show();
}
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


const shareBtn = document.getElementById('share-btn');

async function captureAndShare(shareMsg = "Ranking Sinuca") {
    try {
        const container = document.querySelector('.container');
        const canvas = await html2canvas(container, {
    
            logging: false,
            useCORS: true,
            allowTaint: true
        });
        const dataUrl = canvas.toDataURL('image/png');
        if (navigator.share) {
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'snooker-ranking.png', { 
                type: 'image/png' 
            });
            
            await navigator.share({
                title: shareMsg,
                text: shareMsg,
                files: [file]
            });
        } else {
            const link = document.createElement('a');
            link.download = 'snooker-ranking-' + new Date().toISOString().slice(0, 10) + '.png';
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('Imagem do ranking baixada!', 'info');
        }
    } catch (error) {
        console.error('Erro ao compartilhar:', error);
        showToast('Erro ao compartilhar: ' + error.message, 'danger');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('darkModeToggle');
    const body = document.body;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentMode = localStorage.getItem('darkMode') || (prefersDark ? 'enabled' : 'disabled');
    if (currentMode === 'enabled') {
        body.classList.add('dark-mode');
    }
    toggleButton.addEventListener('click', function() {
        body.classList.toggle('dark-mode');
        
        const isDark = body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
        document.dispatchEvent(new CustomEvent('colorSchemeChanged', {
            detail: { isDark }
        }));
    });
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        const newMode = e.matches ? 'enabled' : 'disabled';
        localStorage.setItem('darkMode', newMode);
        
        if (newMode === 'enabled') {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
    });
    shareBtn.addEventListener('click', () => captureAndShare('Ranking Sinuca'));
});

pinInputs.forEach((input, idx) => {
    input.addEventListener('input', function () {
        if (this.value.length === 4 && idx < pinInputs.length - 1) {
            pinInputs[idx + 1].focus();
        }
    });
});
