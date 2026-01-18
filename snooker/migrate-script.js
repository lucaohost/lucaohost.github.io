// Script de migração de jogadores - Execute no console do navegador
// Ou abra migrate-players.html no navegador e clique no botão

(async function migratePlayers() {
    const firebaseConfig = {
        apiKey: "AIzaSyBsP4YSbp3qeK-ViyVXhWp8Jf3KetimveU",
        authDomain: "snooker-scoreboard2.firebaseapp.com",
        projectId: "snooker-scoreboard2",
        storageBucket: "snooker-scoreboard2.firebasestorage.app",
        messagingSenderId: "695835616380",
        appId: "1:695835616380:web:17fc21b1d88f26c63055f9"
    };

    if (typeof firebase === 'undefined') {
        console.error('Firebase não está carregado. Por favor, execute este script na página index.html ou migrate-players.html');
        return;
    }

    const database = firebase.database();

    async function sha256(message) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    try {
        console.log('Carregando jogadores de 2025...');
        
        // Load players from 2025
        const players2025Snapshot = await database.ref('players').once('value');
        const players2025Data = players2025Snapshot.val() || {};
        
        // Load pins from 2025
        const pins2025Snapshot = await database.ref('pins').once('value');
        const pins2025Data = pins2025Snapshot.val() || {};

        console.log(`Encontrados ${Object.keys(players2025Data).length} jogadores em 2025`);

        // Filter out Marcelo, Valdir and Tamara
        const excludedNames = ['marcelo', 'valdir', 'tamara'];
        const playersToMigrate = Object.entries(players2025Data).filter(([key, player]) => {
            const nameLower = (player.name || key).toLowerCase();
            return !excludedNames.includes(nameLower) && !excludedNames.includes(key.toLowerCase());
        });

        console.log(`Migrando ${playersToMigrate.length} jogadores (excluindo Marcelo, Valdir e Tamara)...`);

        // Check existing players in 2026
        const players2026Snapshot = await database.ref('seasons/2026/players').once('value');
        const existingPlayers2026 = players2026Snapshot.val() || {};
        const existingPlayerIds = Object.keys(existingPlayers2026).map(id => id.toLowerCase());

        // Migrate players
        let migratedCount = 0;
        let skippedCount = 0;
        for (const [playerId, playerData] of playersToMigrate) {
            const playerId2026 = (playerData.name || playerId).toLowerCase();
            
            // Skip if already exists
            if (existingPlayerIds.includes(playerId2026)) {
                console.log(`⊘ Pulado (já existe): ${playerData.name || playerId}`);
                skippedCount++;
                continue;
            }
            
            const playerData2026 = {
                name: playerData.name || playerId,
                wins: 0,
                games: 0,
                season: 2026
            };

            await database.ref(`seasons/2026/players/${playerId2026}`).set(playerData2026);
            console.log(`✓ Migrado: ${playerData.name || playerId} (estatísticas zeradas)`);
            migratedCount++;

            // Try to copy PIN if exists
            if (pins2025Data[playerId]) {
                await database.ref(`seasons/2026/pins/${playerId2026}`).set(pins2025Data[playerId]);
                console.log(`  └─ PIN copiado`);
            } else {
                console.log(`  └─ ⚠ PIN não encontrado em 2025`);
            }
        }

        console.log(`Migração: ${migratedCount} criados, ${skippedCount} já existentes`);

        // Add Nadjane
        const nadjaneId = 'nadjane';
        const existing2026Check = await database.ref(`seasons/2026/players/${nadjaneId}`).once('value');
        
        if (!existing2026Check.val()) {
            console.log('Adicionando jogadora Nadjane...');
            const nadjanePassword = 'jane';
            const nadjanePasswordHash = await sha256(nadjanePassword);
            
            const nadjaneData = {
                name: 'Nadjane',
                wins: 0,
                games: 0,
                season: 2026
            };

            await database.ref(`seasons/2026/players/${nadjaneId}`).set(nadjaneData);
            await database.ref(`seasons/2026/pins/${nadjaneId}`).set(nadjanePasswordHash);
            console.log(`✓ Adicionada: Nadjane com senha "jane"`);
        } else {
            console.log(`⊘ Nadjane já existe em 2026 (pulada)`);
        }

        console.log('✅ Migração concluída com sucesso!');
    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
    }
})();

