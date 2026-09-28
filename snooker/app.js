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
const pinInputs = document.querySelectorAll('.pin-input');
const matchForm = document.getElementById('match-form');
const toast = new bootstrap.Toast(document.getElementById('toast'));
const toastMessage = document.getElementById('toast-message');
const seasonSelect = document.getElementById('season-select');
const historyBtn = document.getElementById('history-btn');
const hidePlayerBtn = document.getElementById('hide-player-btn');

const SEASON_2024_PLAYERS = [
    { id: 'lucas', name: 'Lucas', wins: 51, games: 93, season: 2024 },
    { id: 'paulinho', name: 'Paulinho', wins: 41, games: 93, season: 2024 },
    { id: 'raquel', name: 'Raquel', wins: 32, games: 93, season: 2024 }
];

let secretUnlocked = false;

// Buttons to hide/show based on season
const addMatchBtn = document.querySelector('[data-bs-target="#addMatchModal"]');
const addPlayerBtn = document.querySelector('[data-bs-target="#addPlayerModal"]');
const editPlayerBtn = document.querySelector('[data-bs-target="#editPlayerModal"]');
const reportsBtn = document.querySelector('a[href="reports.html"]');

// Current season (default 2026)
let currentSeason = parseInt(localStorage.getItem('currentSeason')) || 2026;
seasonSelect.value = currentSeason;

// Get database paths based on season
function getPlayersPath() {
    return `seasons/${currentSeason}/players`;
}

function getPinsPath() {
    return `seasons/${currentSeason}/pins`;
}

function isClosedSeason() {
    return currentSeason === 2024 || currentSeason === 2025;
}

function getMatchesPath() {
    if (isClosedSeason()) {
        return null;
    }
    return `seasons/${currentSeason}/matches`;
}

function updateSecretButtons() {
    const backupBtn = document.getElementById('backup-btn');
    if (!secretUnlocked) {
        if (backupBtn) backupBtn.style.display = 'none';
        if (hidePlayerBtn) hidePlayerBtn.style.display = 'none';
        return;
    }
    if (backupBtn) backupBtn.style.display = 'inline-block';
    if (hidePlayerBtn) {
        hidePlayerBtn.style.display = currentSeason === 2026 ? 'inline-block' : 'none';
    }
}

// Function to toggle buttons visibility based on season
function toggleButtonsBySeason() {
    const closedSeason = isClosedSeason();
    const displayValue = closedSeason ? 'none' : '';
    
    // Hide/show buttons based on season
    if (addMatchBtn) addMatchBtn.style.display = displayValue;
    if (addPlayerBtn) addPlayerBtn.style.display = displayValue;
    if (editPlayerBtn) editPlayerBtn.style.display = displayValue;
    if (reportsBtn) reportsBtn.style.display = displayValue;
    
    // History button - only show for 2026
    if (historyBtn) {
        if (currentSeason === 2026) {
            historyBtn.style.display = 'inline-block';
        } else {
            historyBtn.style.display = 'none';
        }
    }
    
    updateSecretButtons();

    const buttonsContainer = document.querySelector('.buttons-container');
    if (buttonsContainer) {
        if (closedSeason && !secretUnlocked) {
            buttonsContainer.style.justifyContent = 'center';
            buttonsContainer.classList.add('single-button');
        } else {
            buttonsContainer.style.justifyContent = '';
            buttonsContainer.classList.remove('single-button');
        }
    }
}

// Season selector event listener
seasonSelect.addEventListener('change', (e) => {
    currentSeason = parseInt(e.target.value);
    localStorage.setItem('currentSeason', currentSeason);
    
    // Clear table immediately
    playersTable.innerHTML = '<tr><td colspan="6" class="text-center">Carregando...</td></tr>';
    
    // Toggle buttons visibility
    toggleButtonsBySeason();
    
    // Load players for new season
    loadPlayers();
});


function loadPlayers() {
    if (seasonSelect) {
        const selectedValue = parseInt(seasonSelect.value);
        if (selectedValue !== currentSeason) {
            currentSeason = selectedValue;
            localStorage.setItem('currentSeason', currentSeason);
        }
    }

    if (currentSeason === 2024) {
        renderRanking(SEASON_2024_PLAYERS.map(player => ({ ...player })));
        return;
    }

    const playersPath = getPlayersPath();
    database.ref(playersPath).once('value').then((snapshot) => {
        const playersData = snapshot.val() || {};
        const playersArray = Object.keys(playersData).map(key => {
            const player = playersData[key];
            return {
                id: key,
                name: player.name || key,
                wins: player.wins || 0,
                games: player.games || 0,
                losses: (player.games || 0) - (player.wins || 0),
                season: player.season || currentSeason,
                ...player
            };
        });
        renderRanking(playersArray);
    });
}

function renderRanking(playersArray) {
    updatePlayerSelects(playersArray);
    updateEditPlayerSelect(playersArray);

    if (playersArray.length === 0) {
        playersTable.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum jogador encontrado</td></tr>';
        return;
    }

    const maxWins = Math.max(...playersArray.map(player => player.wins), 0);
    const minWins = Math.floor(maxWins / 2);

    const playersWithStats = playersArray.map(player => {
        const wins = player.wins || 0;
        const games = player.games || 0;
        const percentage = games > 0
            ? ((wins / games) * 100).toFixed(2) + '%'
            : '0.00%';

        return {
            ...player,
            wins,
            games,
            losses: games - wins,
            percentage,
            qualified: wins >= minWins
        };
    });

    const qualifiedPlayers = playersWithStats.filter(p => p.qualified && p.percentage !== 'W.O');
    const unclassifiedPlayers = playersWithStats.filter(p => !p.qualified && p.percentage !== 'W.O');
    const woPlayers = playersWithStats.filter(p => p.percentage === 'W.O');

    const byPercentage = (a, b) => parseFloat(b.percentage) - parseFloat(a.percentage);
    qualifiedPlayers.sort(byPercentage);
    unclassifiedPlayers.sort(byPercentage);

    const sortedPlayers = [...qualifiedPlayers, ...unclassifiedPlayers, ...woPlayers];
    const visiblePlayers = currentSeason === 2026
        ? sortedPlayers.filter(player => player.hidden !== true)
        : sortedPlayers;

    playersTable.innerHTML = '';

    if (visiblePlayers.length === 0) {
        playersTable.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum jogador encontrado</td></tr>';
        return;
    }

    let position = 1;
    visiblePlayers.forEach(player => {
        const row = document.createElement('tr');
        let isUnclassified = false;

        if (isClosedSeason()) {
            if (position === 1) {
                row.classList.add('gold-medal');
            } else if (position === 2) {
                row.classList.add('silver-medal');
            } else if (position === 3) {
                row.classList.add('bronze-medal');
            }
        } else if (!player.qualified) {
            row.classList.add('unclassified');
            isUnclassified = true;
        } else {
            row.classList.add('classified');
        }

        const winsClass = !isUnclassified ? 'text-success' : '';
        const lossesClass = !isUnclassified ? 'text-danger' : '';

        row.innerHTML = `
            <td>${position++}</td>
            <td>${player.name}</td>
            <td class="${winsClass}">${player.wins}</td>
            <td>${player.games}</td>
            <td class="${lossesClass}">${player.losses}</td>
            <td>${player.percentage}</td>
        `;
        playersTable.appendChild(row);
    });
}

function updatePlayerSelects(playersArray) {
    const playerSelects = document.querySelectorAll('.team1-player1, .team1-player2, .team2-player1, .team2-player2');
        const playerOptions = playersArray.map(player => 
        `<option value="${player.id || player.name.toLowerCase()}">${player.name}</option>`
        ).join('');
        
        playerSelects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = select.querySelector('option[value=""]').outerHTML + playerOptions;
            if (currentValue) {
                select.value = currentValue;
            }
        });
}

function updateEditPlayerSelect(playersArray) {
    const editPlayerSelect = document.getElementById('edit-player-name');
    if (editPlayerSelect) {
        const playerOptions = playersArray.map(player => 
            `<option value="${player.id || player.name.toLowerCase()}">${player.name}</option>`
        ).join('');
        editPlayerSelect.innerHTML = '<option value="">Selecione um jogador</option>' + playerOptions;
    }
}

async function validatePins(pins, selectedPlayers) {
    return new Promise((resolve) => {
        const pinsPath = getPinsPath();
        database.ref(pinsPath).once('value').then(async (snapshot) => {
            const pinsData = snapshot.val() || {};
            const validPins = [];
            const playerPins = selectedPlayers.map(player => pinsData[player]);
            
            for (const pinIndex in pins) {
                let pinEncoded = await sha256(pins[pinIndex]);
                if (pinEncoded && playerPins.includes(pinEncoded)) {
                    validPins.push(pinEncoded);
                } else {
                    showToast(`Pin número ${parseInt(pinIndex) + 1} inválido.`, 'danger');
                    matchForm.querySelector('button[type="submit"]').disabled = false;
                    resolve(false);
                    return;
                }
            }
            
            resolve(validPins.length === selectedPlayers.length);
        });
    });
}

matchForm.addEventListener('submit', async (e) => {
    matchForm.querySelector('button[type="submit"]').disabled = true;
    e.preventDefault();
    
    // Ensure currentSeason is in sync with the select element
    if (seasonSelect) {
        const selectedValue = parseInt(seasonSelect.value);
        if (selectedValue !== currentSeason) {
            currentSeason = selectedValue;
            localStorage.setItem('currentSeason', currentSeason);
        }
    }
    
    const team1Player1 = document.querySelector('.team1-player1').value;
    const team1Player2 = document.querySelector('.team1-player2').value;
    const team2Player1 = document.querySelector('.team2-player1').value;
    const team2Player2 = document.querySelector('.team2-player2').value;
    
    if (!team1Player1 || !team2Player1) {
        showToast('Cada time deve ter pelo menos um jogador!', 'danger');
        matchForm.querySelector('button[type="submit"]').disabled = false;
        return;
    }
    
    const pins = Array.from(pinInputs)
        .map(input => input.value.trim())
        .filter(pin => pin !== '');
    
    if (pins.length < 3) {
        showToast('Pelo menos 3 PINs são necessários!', 'danger');
        matchForm.querySelector('button[type="submit"]').disabled = false;
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
        // Get player names for match history
        const playersPath = getPlayersPath();
        const playersSnapshot = await database.ref(playersPath).once('value');
        const playersData = playersSnapshot.val() || {};
        
        const getPlayerName = (id) => {
            const player = playersData[id];
            return player ? player.name : id;
        };
        
        const winners = [team1Player1, team1Player2].filter(p => p).map(getPlayerName);
        const losers = [team2Player1, team2Player2].filter(p => p).map(getPlayerName);
        
        // Update player stats
        await updatePlayerStats(team1Player1, true);
        if (team1Player2) await updatePlayerStats(team1Player2, true);

        await updatePlayerStats(team2Player1, false);
        if (team2Player2) await updatePlayerStats(team2Player2, false);
        
        // Save match history (only for 2026+)
        if (currentSeason === 2026) {
            const matchesPath = getMatchesPath();
            const matchData = {
                winners: winners,
                losers: losers,
                date: new Date().toISOString(),
                timestamp: Date.now()
            };
            await database.ref(matchesPath).push(matchData);
        }
        
        showToast('Partida registrada com sucesso!', 'success');
        matchForm.reset();
        bootstrap.Modal.getInstance(document.getElementById('addMatchModal')).hide();
        loadPlayers();
        setTimeout(() => {
            const winnersStr = winners.join(' e ');
            const losersStr = losers.join(' e ');
            const shareMessage = `Vencedores: ${winnersStr}\nPerdedores: ${losersStr}`;
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
        const playersPath = getPlayersPath();
        const playerRef = database.ref(`${playersPath}/${playerId}`);
        
        playerRef.transaction((player) => {
            if (player) {
                player.games = (player.games || 0) + 1;
                if (isWinner) {
                    player.wins = (player.wins || 0) + 1;
                }
                player.season = currentSeason;
            } else {
                // Create new player if doesn't exist
                player = {
                    name: playerId,
                    wins: isWinner ? 1 : 0,
                    games: 1,
                    season: currentSeason
                };
            }
            return player;
        }, (error, committed) => {
            if (error) {
                reject(error);
            } else if (!committed) {
                reject(new Error('Erro ao atualizar jogador'));
            } else {
                resolve();
            }
        });
    });
}

// Add Player Form
const addPlayerForm = document.getElementById('add-player-form');
addPlayerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const playerName = document.getElementById('new-player-name').value.trim();
    const playerPassword = document.getElementById('new-player-password').value.trim();
    const adminPassword = document.getElementById('admin-password-add').value.trim();
    
    if (!playerName || !playerPassword || playerPassword.length !== 4) {
        showToast('Nome e senha de 4 dígitos são obrigatórios!', 'danger');
        return;
    }
    
    if (!adminPassword) {
        showToast('Senha admin é obrigatória!', 'danger');
        return;
    }
    
    try {
        // Validate admin password
        const adminPasswordHash = await sha256(adminPassword);
        const expectedAdminHash = await sha256('godsmode');
        if (adminPasswordHash !== expectedAdminHash) {
            showToast('Senha admin incorreta!', 'danger');
            return;
        }
        
        const playersPath = getPlayersPath();
        const pinsPath = getPinsPath();
        
        // Check if player already exists
        const playersSnapshot = await database.ref(playersPath).once('value');
        const playersData = playersSnapshot.val() || {};
        const playerExists = Object.values(playersData).some(p => 
            p.name.toLowerCase() === playerName.toLowerCase()
        );
        
        if (playerExists) {
            showToast('Jogador já existe!', 'danger');
            return;
        }
        
        // Create player ID (lowercase name)
        const playerId = playerName.toLowerCase();
        
        // Create player object
        const playerData = {
            name: playerName,
            wins: 0,
            games: 0,
            season: currentSeason,
            hidden: false
        };
        
        // Create password hash
        const passwordHash = await sha256(playerPassword);
        
        // Save player and password
        await database.ref(`${playersPath}/${playerId}`).set(playerData);
        await database.ref(`${pinsPath}/${playerId}`).set(passwordHash);
        
        showToast('Jogador adicionado com sucesso!', 'success');
        addPlayerForm.reset();
        bootstrap.Modal.getInstance(document.getElementById('addPlayerModal')).hide();
        loadPlayers();
    } catch (error) {
        showToast('Erro ao adicionar jogador: ' + error.message, 'danger');
    }
});

// Edit Player Form
const editPlayerForm = document.getElementById('edit-player-form');
editPlayerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const playerId = document.getElementById('edit-player-name').value;
    const oldPasswordOrAdmin = document.getElementById('old-player-password').value.trim();
    const newPassword = document.getElementById('new-edit-player-password').value.trim();
    
    if (!playerId || !newPassword || newPassword.length !== 4) {
        showToast('Jogador e nova senha de 4 dígitos são obrigatórios!', 'danger');
        return;
    }
    
    if (!oldPasswordOrAdmin) {
        showToast('Senha antiga ou senha admin é obrigatória!', 'danger');
        return;
    }
    
    try {
        const pinsPath = getPinsPath();
        const pinsSnapshot = await database.ref(pinsPath).once('value');
        const pinsData = pinsSnapshot.val() || {};
        const currentPasswordHash = pinsData[playerId];
        
        let isValid = false;
        
        // Check if it's admin password
        const inputHash = await sha256(oldPasswordOrAdmin);
        const expectedAdminHash = await sha256('godsmode');
        
        if (inputHash === expectedAdminHash) {
            // It's the admin password
            isValid = true;
        } else if (oldPasswordOrAdmin.length === 4) {
            // Check if it's the old player password (4 digits)
            const oldPasswordHash = await sha256(oldPasswordOrAdmin);
            if (oldPasswordHash === currentPasswordHash) {
                isValid = true;
            }
        }
        
        if (!isValid) {
            showToast('Senha antiga incorreta ou senha admin inválida!', 'danger');
            return;
        }
        
        // Update password
        const newPasswordHash = await sha256(newPassword);
        await database.ref(`${pinsPath}/${playerId}`).set(newPasswordHash);
        
        showToast('Senha atualizada com sucesso!', 'success');
        editPlayerForm.reset();
        bootstrap.Modal.getInstance(document.getElementById('editPlayerModal')).hide();
    } catch (error) {
        showToast('Erro ao atualizar senha: ' + error.message, 'danger');
    }
});

// Reports
document.getElementById('report-last-week').addEventListener('click', async () => {
    await generateReport('week');
});

document.getElementById('report-year').addEventListener('click', async () => {
    await generateReport('year');
});

async function generateReport(period) {
    try {
        const matchesPath = getMatchesPath();
        if (!matchesPath) {
            showToast('Histórico de partidas não disponível para esta temporada.', 'danger');
            return;
        }
        
        const matchesSnapshot = await database.ref(matchesPath).once('value');
        const matchesData = matchesSnapshot.val() || {};
        const matches = Object.values(matchesData);
        
        const now = new Date();
        let cutoffDate;
        
        if (period === 'week') {
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
            // Year - start of current year
            cutoffDate = new Date(now.getFullYear(), 0, 1);
        }
        
        const filteredMatches = matches.filter(match => {
            const matchDate = new Date(match.date);
            return matchDate >= cutoffDate;
        });
        
        // Get players for names
        const playersPath = getPlayersPath();
        const playersSnapshot = await database.ref(playersPath).once('value');
        const playersData = playersSnapshot.val() || {};
        
        let reportText = `Relatório ${period === 'week' ? 'da Última Semana' : 'do Período Completo'}:\n\n`;
        reportText += `Total de partidas: ${filteredMatches.length}\n\n`;
        
        // Group by winners
        const winnerStats = {};
        const loserStats = {};
        
        filteredMatches.forEach(match => {
            match.winners.forEach(winner => {
                winnerStats[winner] = (winnerStats[winner] || 0) + 1;
            });
            match.losers.forEach(loser => {
                loserStats[loser] = (loserStats[loser] || 0) + 1;
            });
        });
        
        reportText += 'Vitórias por jogador:\n';
        const sortedWinners = Object.entries(winnerStats).sort((a, b) => b[1] - a[1]);
        sortedWinners.forEach(([player, wins]) => {
            reportText += `  ${player}: ${wins} vitória(s)\n`;
        });
        
        reportText += '\nDerrotas por jogador:\n';
        const sortedLosers = Object.entries(loserStats).sort((a, b) => b[1] - a[1]);
        sortedLosers.forEach(([player, losses]) => {
            reportText += `  ${player}: ${losses} derrota(s)\n`;
        });
        
        document.getElementById('report-text').textContent = reportText;
        document.getElementById('report-content').style.display = 'block';
    } catch (error) {
        showToast('Erro ao gerar relatório: ' + error.message, 'danger');
    }
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

async function sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

const shareBtn = document.getElementById('share-btn');

// Backup function to download all data from Firebase
async function downloadBackup() {
    try {
        showToast('Gerando backup...', 'primary');
        
        const backupData = {
            exportDate: new Date().toISOString(),
            seasons: {}
        };

        backupData.seasons['2024'] = {
            players: Object.fromEntries(SEASON_2024_PLAYERS.map(player => [player.id, {
                name: player.name,
                wins: player.wins,
                games: player.games,
                season: 2024
            }]))
        };
        
        // Fetch 2025 data (old structure)
        const [players2025, pins2025] = await Promise.all([
            database.ref('players').once('value'),
            database.ref('pins').once('value')
        ]);
        
        backupData.seasons['2025'] = {
            players: players2025.val() || {},
            pins: pins2025.val() || {}
        };
        
        // Fetch 2026 data (new structure)
        const [players2026, pins2026, matches2026] = await Promise.all([
            database.ref('seasons/2026/players').once('value'),
            database.ref('seasons/2026/pins').once('value'),
            database.ref('seasons/2026/matches').once('value')
        ]);
        
        backupData.seasons['2026'] = {
            players: players2026.val() || {},
            pins: pins2026.val() || {},
            matches: matches2026.val() || {}
        };
        
        // Create JSON string with formatted data
        const jsonData = JSON.stringify(backupData, null, 2);
        
        // Create blob and download
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        link.download = `snooker-backup-${timestamp}.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        showToast('Backup baixado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao gerar backup:', error);
        showToast('Erro ao gerar backup: ' + error.message, 'danger');
    }
}

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
    const html = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentMode = localStorage.getItem('darkMode') || (prefersDark ? 'enabled' : 'disabled');
    if (currentMode === 'enabled') {
        body.classList.add('dark-mode');
        html.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
        html.classList.remove('dark-mode');
    }
    toggleButton.addEventListener('click', function() {
        const isDark = body.classList.contains('dark-mode');
        const newMode = !isDark ? 'enabled' : 'disabled';
        localStorage.setItem('darkMode', newMode);
        
        // Force page reload to apply theme correctly
        window.location.reload();
    });
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        const newMode = e.matches ? 'enabled' : 'disabled';
        localStorage.setItem('darkMode', newMode);
        
        const isDark = newMode === 'enabled';
        
        if (isDark) {
            body.classList.add('dark-mode');
            html.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
            html.classList.remove('dark-mode');
        }
        
        // Update the prevent-flash style when theme changes
        const preventFlashStyle = document.getElementById('prevent-flash');
        if (preventFlashStyle) {
            if (isDark) {
                preventFlashStyle.textContent = `
                    html, html.dark-mode, body, body.dark-mode { 
                        background-color: #121212 !important; 
                        color: #e0e0e0 !important; 
                    }
                    html.dark-mode h1, body.dark-mode h1 { color: #e0e0e0 !important; }
                    html.dark-mode .container, body.dark-mode .container { 
                        background-color: #1e1e1e !important; 
                        box-shadow: 0 2px 10px rgba(0,0,0,0.3) !important; 
                    }
                `;
            } else {
                preventFlashStyle.textContent = `
                    html, body { 
                        background-color: #f8f9fa !important; 
                        color: #212529 !important; 
                    }
                    h1 { color: #212529 !important; }
                    .container { 
                        background-color: white !important; 
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important; 
                    }
                `;
            }
        }
    });
    
    shareBtn.addEventListener('click', () => captureAndShare('Ranking Sinuca'));
    
    // History button event listener
    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
            window.location.href = 'history.html';
        });
    }
    
    // Initial load
    loadPlayers();
    
    // Toggle buttons visibility on page load
    toggleButtonsBySeason();
    
    // Info classification expand/collapse and secret backup button
    const infoClassification = document.getElementById('info-classification');
    const backupBtn = document.getElementById('backup-btn');
    let classificationClickCount = 0;
    
    if (infoClassification) {
        infoClassification.addEventListener('click', function() {
            const fullText = this.querySelector('.info-full-text');
            if (fullText) {
                const isHidden = fullText.style.display === 'none';
                fullText.style.display = isHidden ? 'block' : 'none';
            }
        });

        const infoTitle = infoClassification.querySelector('.info-title');
        if (infoTitle) {
            infoTitle.addEventListener('click', function() {
                classificationClickCount++;
                if (classificationClickCount >= 10) {
                    secretUnlocked = true;
                    updateSecretButtons();
                }
            });
        }
    }

    const hidePlayerModal = document.getElementById('hidePlayerModal');
    const hidePlayerList = document.getElementById('hide-player-list');
    const hideAdminPassword = document.getElementById('hide-admin-password');
    let hideAdminUnlocked = false;

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    async function ensureHideAdmin() {
        if (hideAdminUnlocked) return true;
        const password = hideAdminPassword ? hideAdminPassword.value.trim() : '';
        if (!password) {
            showToast('Senha admin é obrigatória!', 'danger');
            return false;
        }
        const adminPasswordHash = await sha256(password);
        const expectedAdminHash = await sha256('godsmode');
        if (adminPasswordHash !== expectedAdminHash) {
            showToast('Senha admin incorreta!', 'danger');
            return false;
        }
        hideAdminUnlocked = true;
        return true;
    }

    async function onHidePlayerToggle(event) {
        const input = event.target;
        const wantHidden = input.checked;
        const playerId = input.dataset.playerId;
        const playerName = input.dataset.playerName;
        const allowed = await ensureHideAdmin();
        if (!allowed) {
            input.checked = !wantHidden;
            return;
        }
        try {
            await database.ref(`seasons/2026/players/${playerId}/hidden`).set(wantHidden);
            showToast(wantHidden ? `${playerName} oculto no ranking.` : `${playerName} visível no ranking.`, 'success');
            loadPlayers();
        } catch (error) {
            input.checked = !wantHidden;
            showToast('Erro ao atualizar jogador: ' + error.message, 'danger');
        }
    }

    async function renderHidePlayerList() {
        const snapshot = await database.ref('seasons/2026/players').once('value');
        const playersData = snapshot.val() || {};
        const players = Object.keys(playersData).map(id => ({
            id,
            name: playersData[id].name || id,
            hidden: playersData[id].hidden === true
        })).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

        if (!hidePlayerList) return;

        if (players.length === 0) {
            hidePlayerList.innerHTML = '<p class="mb-0">Nenhum jogador encontrado.</p>';
            return;
        }

        hidePlayerList.innerHTML = players.map((player, index) => `
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span>${escapeHtml(player.name)}</span>
                <div class="form-check form-switch m-0">
                    <input class="form-check-input" type="checkbox" role="switch" id="hide-switch-${index}" data-player-id="${escapeHtml(player.id)}" data-player-name="${escapeHtml(player.name)}" ${player.hidden ? 'checked' : ''}>
                    <label class="form-check-label" for="hide-switch-${index}">Oculto</label>
                </div>
            </div>
        `).join('');

        hidePlayerList.querySelectorAll('input[type="checkbox"]').forEach(input => {
            input.addEventListener('change', onHidePlayerToggle);
        });
    }

    if (hidePlayerModal) {
        hidePlayerModal.addEventListener('show.bs.modal', () => {
            hideAdminUnlocked = false;
            if (hideAdminPassword) hideAdminPassword.value = '';
            renderHidePlayerList().catch(error => {
                showToast('Erro ao carregar jogadores: ' + error.message, 'danger');
            });
        });
    }
    
    // Backup button event listener
    if (backupBtn) {
        backupBtn.addEventListener('click', downloadBackup);
    }
});

pinInputs.forEach((input, idx) => {
    input.addEventListener('input', function () {
        if (this.value.length === 4 && idx < pinInputs.length - 1) {
            pinInputs[idx + 1].focus();
        }
    });
});
