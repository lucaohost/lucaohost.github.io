// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyD8L3X9vsq2tExPXiWRBLgOu90HWj6LMqg",
    authDomain: "snooker-scoreboard-9bd49.firebaseapp.com",
    projectId: "snooker-scoreboard-9bd49",
    storageBucket: "snooker-scoreboard-9bd49.firebasestorage.app",
    messagingSenderId: "563361708567",
    appId: "1:563361708567:web:3a0b623280fb19915c3a52",
    measurementId: "G-PWXHWTL1SX"
  };

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Elementos
const playersTable = document.getElementById('playersTable');
const pinModal = document.getElementById('pinModal');
const pinForm = document.getElementById('pinForm');
const cancelBtn = document.getElementById('cancelBtn');

let selectedPlayerId = null;
let selectedAction = null;

function renderTable(players) {
  playersTable.innerHTML = '';
  Object.entries(players).forEach(([id, player]) => {
    const { name, wins, games } = player;
    const losses = games - wins;
    const percentage = ((wins / games) * 100 || 0).toFixed(2) + '%';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="p-2">${name}</td>
      <td class="p-2 text-center">${wins}</td>
      <td class="p-2 text-center">${games}</td>
      <td class="p-2 text-center">${losses}</td>
      <td class="p-2 text-center">${percentage}</td>
      <td class="p-2 text-center">
        <button class="bg-green-500 text-white px-2 py-1 rounded" data-id="${id}" data-action="win">+</button>
      </td>
      <td class="p-2 text-center">
        <button class="bg-red-500 text-white px-2 py-1 rounded" data-id="${id}" data-action="loss">-</button>
      </td>
    `;
    playersTable.appendChild(row);
  });

  document.querySelectorAll('button[data-action]').forEach(btn =>
    btn.addEventListener('click', () => {
      selectedPlayerId = btn.dataset.id;
      selectedAction = btn.dataset.action;
      pinModal.classList.remove('hidden');
    })
  );
}

async function fetchPlayers() {
  const snapshot = await get(ref(db, 'players'));
  if (snapshot.exists()) renderTable(snapshot.val());
}

pinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const [pin1, pin2, pin3] = Array.from(pinForm.elements).slice(0, 3).map(input => input.value);
  const pinSet = new Set([pin1, pin2, pin3]);

  if (pinSet.size !== 3) return alert('Os PINs devem ser diferentes!');

  const pinsSnapshot = await get(ref(db, 'pins'));
  const pins = pinsSnapshot.val();

  const validPins = Object.values(pins);
  if ([pin1, pin2, pin3].every(pin => validPins.includes(pin))) {
    const playerRef = ref(db, 'players/' + selectedPlayerId);
    const snapshot = await get(playerRef);
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    const updates = {
      games: data.games + 1,
      wins: selectedAction === 'win' ? data.wins + 1 : data.wins
    };

    await update(playerRef, updates);
    pinModal.classList.add('hidden');
    pinForm.reset();
    fetchPlayers();
  } else {
    alert('PINs inválidos.');
  }
});

cancelBtn.addEventListener('click', () => {
  pinModal.classList.add('hidden');
});
fetchPlayers();
