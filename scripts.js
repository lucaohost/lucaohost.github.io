let inputField = document.getElementById('input');

function isMobileCli() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function readCommand() {
    return inputField.tagName === 'INPUT' ? inputField.value : inputField.innerText;
}

function clearCommand() {
    if (inputField.tagName === 'INPUT') {
        inputField.value = '';
    } else {
        inputField.innerText = '';
    }
    syncMobileInputWidth();
}

function syncMobileInputWidth() {
    const mirror = document.getElementById('input-mirror');
    if (!mirror) return;
    if (!isMobileCli() || inputField.tagName !== 'INPUT') {
        mirror.textContent = '';
        return;
    }
    mirror.textContent = inputField.value;
}

let inputEventsReady = false;

function onMobileBlur() {
    if (!isMobileCli()) return;
    const active = document.activeElement;
    if (active && (active.tagName === 'IFRAME' || active.tagName === 'AUDIO' || active.tagName === 'VIDEO')) return;
}

function bindInputEvents() {
    if (inputField.dataset.bound === '1') return;
    inputField.dataset.bound = '1';
    inputField.addEventListener('keydown', function (event) {
        if (navigateHistory(event)) return;
        onEnter(event);
    });
    inputField.addEventListener('blur', onMobileBlur);
}

function installMobileInput() {
    if (!isMobileCli() || inputField.tagName === 'INPUT') return;
    const native = document.createElement('input');
    native.type = 'text';
    native.id = 'input';
    native.className = 'input';
    native.autocomplete = 'off';
    native.autocapitalize = 'off';
    native.spellcheck = false;
    native.enterKeyHint = 'send';
    native.readOnly = true;
    native.size = 1;
    native.setAttribute('inputmode', 'none');
    native.setAttribute('aria-label', 'Command');
    native.addEventListener('mousedown', (event) => event.preventDefault());
    native.addEventListener('touchstart', (event) => event.preventDefault(), { passive: false });
    inputField.replaceWith(native);
    inputField = native;
    if (inputEventsReady) bindInputEvents();
}

installMobileInput();
const terminalOutput = document.getElementById('output');
const cli = document.getElementById('cli');
const commands = {
    whoami: "<p style='text-align: justify;'>Lucas: Hello, I am a software engineer from Brazil and I really enjoy solving problems with technology.</p>",
    github: "<a href='https://github.com/lucaohost' target='_blank'>https://github.com/lucaohost</a>",
    linkedin: "<a href='https://linkedin.com/in/lucas-reginatto-de-lima' target='_blank'>https://linkedin.com/lucaohost</a>",
    spotify: "<a href='https://open.spotify.com/user/blood.dota' target='_blank'>https://spotify.com/lucaohost</a>",
    instagram: "<a href='https://instagram.com/lucaohost' target='_blank'>https://instagram.com/lucaohost</a>",
    twitter: "<a href='https://twitter.com/lucaohost' target='_blank'>https://twitter.com/lucaohost</a>",
    share: "<p><button class='shareButton' style='margin-top: 10px; margin-bottom: 10px; background-color: #4CAF50; color: white; border: none; padding: 5px 10px; text-align: center; text-decoration: none; display: inline-block; font-size: 14px; border-radius: 8px; cursor: pointer;'>Share this Site!</button></p>",
    rmy: "Random Music on Youtube:\n<a href='https://lucaohost.github.io/rmy' target='_blank'>https://lucaohost.github.io/rmy</a>",
    rms: "Random Music on Spotify:\n<a href='https://lucaohost.github.io/rms' target='_blank'>https://lucaohost.github.io/rms</a>",
    rmym: "Random Music on Youtube Music:\n<a href='https://lucaohost.github.io/rmym' target='_blank'>https://lucaohost.github.io/rmym</a>",
    youtube: "<a href='https://youtube.com/@lucasreginatto721' target='_blank'>https://youtube.com/lucaohost</a>",
    lucaohost: "<p style='text-align: justify;'>Lucão is my Brazilian nickname, lucaohost is a programmer's joke since sounds like <a class='localhostExplanation'>localhost</a>.</p>",
    'localhost?': "<p style='text-align: justify;'><a href='https://en.wikipedia.org/wiki/Localhost' target='_blank'>localhost</a> is the local computer’s hostname, resolving to IP 127.0.0.1.</p>",
    'rickrolled?': `<p style='text-align: justify;'><a href='https://en.wikipedia.org/wiki/Rickrolling' target='_blank'>Rickrolling</a> is a meme where Rick’s song <a href='https://www.youtube.com/watch?v=dQw4w9WgXcQ' target='_blank'>Never Gonna Give You Up</a> appears unexpectedly.</p>`,
    social: function() {
        let socialMidias = [
            "<a href='https://github.com/lucaohost' target='_blank'><img src='https://cdn-icons-png.flaticon.com/512/733/733553.png' alt='GitHub' width='24' height='24' style='filter: grayscale(100%);'></a>", this.github,
            "<a href='https://linkedin.com/in/lucas-reginatto-de-lima' target='_blank'><img src='https://cdn-icons-png.flaticon.com/512/174/174857.png' alt='LinkedIn' width='24' height='24' style='filter: grayscale(100%);'></a>", this.linkedin,
            "<a href='https://youtube.com/@lucasreginatto721' target='_blank'><img src='https://cdn-icons-png.flaticon.com/512/1384/1384060.png' alt='YouTube' width='24' height='24' style='filter: grayscale(100%);'></a>", this.youtube,
            "<a href='https://open.spotify.com/playlist/2kO4SQsSzH2wYMkNB9lVEC' target='_blank'><img src='https://cdn-icons-png.flaticon.com/512/174/174872.png' alt='Spotify' width='24' height='24' style='filter: grayscale(100%);'></a>", this.spotify
        ];
        return buildSocialTable(socialMidias, 2);
    },
    snooker: "Snooker Scoreboard:\n<a href='https://lucaohost.github.io/snooker' target='_blank'>https://lucaohost.github.io/snooker</a>",
    clear: function() {
        pauseEveryPlayer();
        releaseSpotifyHosts();
        spotifyPlayers.clear();
        terminalOutput.innerHTML = '';
    },
    help: function() {
        const items = [
            "Commands", "Description",
            'whoami', "Information about me.", 
            'lucaohost', "Explains my username.",
            'social', "Social networks.",
            'share', "Share this site.",
            'music', "Random Liked Song.",
            'liked', "Last 100 Liked Songs.",
            'rick', "Type and find out.",
            'tgif', "Thank God It's Friday!",
            'kali', "Kali Linux photo.",
            'snooker', "Snooker Scoreboard.",
            'help', "Show all Commands.",
            'clear', "Clear the Terminal.",
            'exit', "Close the Terminal."
        ];
        return buildCommandTable(items);
    },
    music: function() {
        return playRandomLikedSong();
    },
    'next music': function () {
        return playRandomLikedSong();
    },
    helpDesc: `Type "help" to see all commands.`,
    exit: function() {
        window.close();
        window.close(); // if the first windows.close, closed the spotify iframe
        window.history.back(); // if the windows didn't close, we back to the previous page
    },
    liked: function() {
        pauseEveryPlayer();
        return `My Last 100 Liked Songs:\n${spotifyHostMarkup('spotify:playlist:' + LIKED_PLAYLIST_ID)}`;
    },
    rick: function () {
        pauseEveryPlayer();
        let htmlRick = "<p style='text-align: justify;'>You've been <a class='rickRolledExplanation'>Rickrolled</a>!</p>";
        let rickCounter = localStorage.getItem('rickCounter') || 0;
        rickCounter++;
        localStorage.setItem('rickCounter', parseInt(rickCounter));
        if (rickCounter > 1) {
            htmlRick += `<p style='text-align: justify;'>A true fan! You've been Rickrolling ${rickCounter} times.</p>`;
        }
        htmlRick += "<img src='images/rick-roll-rick-rolled.gif' alt='Rick Roll' style='max-width: 100%; height: auto; margin-top: 10px; margin-bottom: 10px; border-radius:12px;'><br>";
        htmlRick += '<audio src="images/rick-song.mp3" autoplay controls style="width: 100%; max-width: 290px; height: 25px; margin-top: 10px; margin-bottom: 10px; border-radius: 8px;" preload="none"></audio>';
        return htmlRick;
    },
    tgif: function thankGodItsFriday() {
        const now = new Date();
        const nextFriday = new Date(now);
        nextFriday.setDate(now.getDate() + (5 - now.getDay() + 7) % 7);
        nextFriday.setHours(18, 0, 0, 0);
    
        const diff = nextFriday - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
        return buildTgifMsg(days, hours, minutes, seconds);
    },
    kali: function() {
        imagePath = `images/kali-0-min.png`;
        let html = "<p style='text-align: justify;'>That's my cat Kali Linux:</p>"
        return html + `<img src='${imagePath}' alt='Kali Photo' width='150' height='250' style='margin-top: 10px; margin-bottom: 10px; border-radius:12px;'><br>`;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    appendOutput('Welcome to my online terminal!\nType "help" to see all commands.');
    loadLikedTrackIds().catch(function () {});
    if (!isMobileCli()) inputField.focus();
});

document.addEventListener('click', function(event) {
    const selection = window.getSelection().toString();
    if (!isMobileCli() && !selection && !event.target.closest('.nextMusic')) {
        inputField.focus();
    }
});


async function processCommand(input) {
    const command = input.trim().toLocaleLowerCase();
    if (commands[command]) {
        try {
            const result = typeof commands[command] === 'function' ? commands[command]() : commands[command];
            const html = result instanceof Promise ? await result : result;
            if (html !== undefined) appendOutput(html);
            if (command === 'rick' || command === 'music' || command === 'liked' || command === 'next music') {
                showSpotifyIframe();
            }
        } catch (error) {
            appendOutput(`Command "${input}" failed.\n${commands.helpDesc}`);
        }
        addEvents(command);
    } else {
        appendOutput(`Command "${input}" not found.\n${commands["helpDesc"]}`);
    }
}

function pinMobileCli() {
    cli.style.height = '';
    cli.style.maxHeight = '';
    document.documentElement.style.height = '';
    document.body.style.height = '';
    document.body.style.transform = '';
    if (isMobileCli()) window.scrollTo(0, 0);
}

function focusCliInput() {
    if (!isMobileCli()) return;
    syncMobileInputWidth();
}

function scrollCliToEnd() {
    const apply = () => {
        cli.scrollTop = isMobileCli() ? cli.scrollHeight : terminalOutput.scrollHeight;
    };
    apply();
    requestAnimationFrame(apply);
}

function appendOutput(text) {
    const newLine = document.createElement('div');
    if (text !== undefined) {
        newLine.innerHTML = text;
        terminalOutput.appendChild(newLine);
        newLine.querySelectorAll('img, iframe').forEach((element) => {
            element.addEventListener('load', scrollCliToEnd);
        });
        activateEmbeddedMedia(newLine);
    }
    scrollCliToEnd();
    return text !== undefined ? newLine : null;
}

const commandHistory = [];
let historyCursor = 0;
let historyDraft = '';

function pushHistory(command) {
    commandHistory.push(command);
    historyCursor = commandHistory.length;
    historyDraft = '';
}

function readCommandDraft() {
    const value = inputField.tagName === 'INPUT' ? inputField.value : inputField.innerText;
    return value.replace(/\n$/, '');
}

function placeCaretAtEnd(element) {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
}

function setCommandText(value) {
    if (inputField.tagName === 'INPUT') {
        inputField.value = value;
    } else {
        inputField.textContent = value;
        placeCaretAtEnd(inputField);
    }
    syncMobileInputWidth();
}

function navigateHistory(event) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return false;
    if (isMobileCli()) return false;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return false;
    event.preventDefault();
    if (!commandHistory.length) return true;
    if (historyCursor === commandHistory.length) historyDraft = readCommandDraft();
    if (event.key === 'ArrowUp') {
        historyCursor = Math.max(0, historyCursor - 1);
    } else if (historyCursor < commandHistory.length) {
        historyCursor += 1;
    }
    const value = historyCursor === commandHistory.length ? historyDraft : commandHistory[historyCursor];
    setCommandText(value);
    return true;
}

function onEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = readCommand().trim();
        if(input !== "") {
            appendOutput(`<span class="path">lucaohost@bash:~$</span> ${input}`);
            pushHistory(input);
            processCommand(input);
            clearCommand();
        }
    }
}

bindInputEvents();
inputEventsReady = true;

const mobileCliQuery = window.matchMedia('(max-width: 768px)');

function keepMobileKeyboard() {
    if (!isMobileCli()) {
        inputField.removeAttribute('inputmode');
        return;
    }
    installMobileInput();
    inputField.setAttribute('inputmode', 'none');
    pinMobileCli();
    focusCliInput();
}


document.addEventListener('mousedown', (event) => {
    if (!isMobileCli()) return;
    const control = event.target.closest('button, a');
    if (!control || control.closest('#mobile-keyboard')) return;
    event.preventDefault();
    focusCliInput();
}, true);

document.addEventListener('touchstart', (event) => {
    if (!isMobileCli()) return;
    const control = event.target.closest('button, a');
    if (!control) return;
    if (control.closest('#mobile-keyboard')) {
        event.preventDefault();
        return;
    }
    event.preventDefault();
    if (control.tagName === 'A' && control.getAttribute('href')) {
        window.open(control.href, control.target || '_self', 'noopener');
    } else {
        control.click();
    }
    focusCliInput();
}, { passive: false });

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') keepMobileKeyboard();
});

window.addEventListener('pageshow', keepMobileKeyboard);
window.addEventListener('focus', keepMobileKeyboard);
window.addEventListener('resize', pinMobileCli);
mobileCliQuery.addEventListener('change', () => {
    installMobileInput();
    pinMobileCli();
    keepMobileKeyboard();
});

if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
        pinMobileCli();
        const line = document.querySelector('.input-line');
        const visibleBottom = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        if (line && line.getBoundingClientRect().bottom > visibleBottom - 8) {
            scrollCliToEnd();
        }
    });
    window.visualViewport.addEventListener('scroll', pinMobileCli);
}

function bindMobileKeyboard() {
    const keyboard = document.getElementById('mobile-keyboard');
    if (!keyboard || keyboard.dataset.bound === '1') return;
    keyboard.dataset.bound = '1';
    const letterButtons = keyboard.querySelectorAll('button[data-letter]');
    const shiftButton = keyboard.querySelector('[data-key="shift"]');
    let shiftOn = false;
    let lastPointerInput = 0;
    let repeatTimer = 0;
    let pressedButton = null;
    let sawPointer = false;

    function setShift(on) {
        shiftOn = on;
        keyboard.classList.toggle('shift-on', on);
        if (shiftButton) shiftButton.setAttribute('aria-pressed', on ? 'true' : 'false');
        letterButtons.forEach((button) => {
            const letter = button.dataset.letter;
            button.textContent = on ? letter.toUpperCase() : letter;
        });
    }

    function stopRepeat() {
        clearTimeout(repeatTimer);
        repeatTimer = 0;
    }

    function finishPress() {
        if (pressedButton) pressedButton.classList.remove('is-pressed');
        pressedButton = null;
        stopRepeat();
    }

    function startBackspaceRepeat() {
        stopRepeat();
        let delay = 70;
        const tick = () => {
            if (inputField.tagName !== 'INPUT' || !inputField.value) {
                stopRepeat();
                return;
            }
            inputField.value = inputField.value.slice(0, -1);
            syncMobileInputWidth();
            delay = Math.max(30, delay - 8);
            repeatTimer = setTimeout(tick, delay);
        };
        repeatTimer = setTimeout(tick, 350);
    }

    function typeKey(keyButton, allowRepeat) {
        if (!isMobileCli() || inputField.tagName !== 'INPUT') return;
        const key = keyButton.dataset.key;
        if (key !== 'back') stopRepeat();
        if (key === 'shift') {
            setShift(!shiftOn);
            return;
        }
        if (key === 'back') {
            if (inputField.value) {
                inputField.value = inputField.value.slice(0, -1);
                syncMobileInputWidth();
            }
            if (allowRepeat) startBackspaceRepeat();
            return;
        }
        if (key === 'enter') {
            onEnter({ key: 'Enter', preventDefault() {} });
        } else {
            const typed = shiftOn && key >= 'a' && key <= 'z' ? key.toUpperCase() : key;
            inputField.value += typed;
            if (shiftOn) setShift(false);
        }
        syncMobileInputWidth();
    }

    function resolveKey(x, y) {
        const target = document.elementFromPoint(x, y);
        const direct = target && target.closest ? target.closest('[data-key]') : null;
        if (direct && keyboard.contains(direct)) return direct;
        let best = null;
        let bestDist = 16 * 16;
        keyboard.querySelectorAll('[data-key]').forEach((button) => {
            const rect = button.getBoundingClientRect();
            const dx = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
            const dy = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
            const dist = dx * dx + dy * dy;
            if (dist <= bestDist) {
                bestDist = dist;
                best = button;
            }
        });
        return best;
    }

    function pressKey(keyButton, allowRepeat) {
        if (pressedButton && pressedButton !== keyButton) pressedButton.classList.remove('is-pressed');
        pressedButton = keyButton;
        keyButton.classList.add('is-pressed');
        typeKey(keyButton, allowRepeat);
    }

    keyboard.addEventListener('pointerdown', (event) => {
        if (!isMobileCli() || event.button > 0) return;
        const keyButton = resolveKey(event.clientX, event.clientY);
        if (!keyButton) return;
        event.preventDefault();
        sawPointer = true;
        const now = Date.now();
        if (now - lastPointerInput < 30) return;
        lastPointerInput = now;
        try { keyboard.setPointerCapture(event.pointerId); } catch (error) {}
        pressKey(keyButton, true);
    });

    keyboard.addEventListener('pointerup', finishPress);
    keyboard.addEventListener('pointercancel', finishPress);
    keyboard.addEventListener('touchend', (event) => {
        if (event.touches.length === 0) finishPress();
    });
    keyboard.addEventListener('touchcancel', finishPress);
    keyboard.addEventListener('contextmenu', (event) => event.preventDefault());
    keyboard.addEventListener('touchstart', (event) => {
        if (!isMobileCli()) return;
        event.preventDefault();
        if (Date.now() - lastPointerInput < 30) return;
        const touch = event.changedTouches[0];
        if (!touch) return;
        const keyButton = resolveKey(touch.clientX, touch.clientY);
        if (!keyButton) return;
        lastPointerInput = Date.now();
        pressKey(keyButton, true);
    }, { passive: false });

    keyboard.addEventListener('click', (event) => {
        if (sawPointer || Date.now() - lastPointerInput < 700) return;
        const keyButton = event.target.closest('[data-key]');
        if (!keyButton) return;
        lastPointerInput = Date.now();
        pressKey(keyButton, false);
        finishPress();
    });

    window.addEventListener('pointerup', finishPress);
    window.addEventListener('pointercancel', finishPress);
}

bindMobileKeyboard();
keepMobileKeyboard();

function buildSocialTable(items, cols = 2) {
    const rows = Math.ceil(items.length / cols);
    let table = `\n<table style="border-collapse: collapse;"><tbody>`;
    for (let i = 0; i < rows; i++) {
        table += '<tr>';
        const rowItems = items.slice(i * cols, (i + 1) * cols);
        while (rowItems.length < cols) {
            rowItems.push('-'); // Fill the table if necessary
        }
        rowItems.forEach((item, index) => {
            const isIconColumn = index === 0;
            const commonStyles = [
                'border: 2px solid black',
                'padding: 5px',
                'color: white'
            ];

            if (isIconColumn) {
                // First column: small, centered icon
                commonStyles.push(
                    'width: 40px',
                    'max-width: 40px',
                    'text-align: center',
                    'white-space: nowrap'
                );
            } else {
                // Second column: keep link on a single line
                commonStyles.push(
                    'text-align: left',
                    'white-space: nowrap'
                );
            }

            table += `
                <td style="${commonStyles.join('; ')};">${item}</td>`;
        });
        table += '</tr>';
    }
    table += '</tbody></table>\n';

    return table;
}

function buildCommandTable(items, cols = 2) {
    const rows = Math.ceil(items.length / cols);
    let table = `\n<table style="border-collapse: collapse;"><thead><tr>`;
    for (let i = 0; i < cols; i++) {
        table += `<th style="border: 2px solid #4CAF50; padding: 5px; text-align: center; background-color: #333; color: #4CAF50;">${items[i]}</th>`;
    }
    table += `</tr></thead><tbody>`;
    items = items.slice(cols); // Remove header items from the array
    for (let i = 0; i < rows - 1; i++) {
        table += '<tr>';
        const rowItems = items.slice(i * cols, (i + 1) * cols);
        while (rowItems.length < cols) {
            rowItems.push('-'); // Fill the table if necessary
        }
        rowItems.forEach(item => {
            table += `
                <td style="border: 2px solid black; padding: 3px; padding-left: 10px; text-align: left; color: white;">${item}</td>`;
        });
        table += '</tr>';
    }
    table += '</tbody></table>\n';

    return table;
}

var LIKED_PLAYLIST_ID = '2kO4SQsSzH2wYMkNB9lVEC';
var PLAYLIST_QUERY_HASH = '243c0ba2736f16da721e3a227004bbcdb8df6c846f198bd478172e00aa1faf42';
var HASH_STORAGE_KEY = 'spotifyPlaylistQueryHash';
var spotifyPlayers = new Set();
var spotifyApi = null;
var spotifyApiGaveUp = false;
var pendingSpotifyHosts = [];
var pausingPlayers = false;
var likedTrackIds = null;
var likedTrackIdsPromise = null;

terminalOutput.addEventListener('click', function (event) {
    const button = event.target.closest('.nextMusic');
    if (!button) return;
    appendOutput(`<span class="path">lucaohost@bash:~$</span> next music`);
    processCommand('next music');
    clearCommand();
});

window.onSpotifyIframeApiReady = function (api) {
    spotifyApi = api;
    pendingSpotifyHosts.splice(0).forEach(mountSpotifyHost);
};

setTimeout(function () {
    if (spotifyApi) return;
    spotifyApiGaveUp = true;
    pendingSpotifyHosts.splice(0).forEach(mountPlainSpotify);
}, 5000);

function spotifyHostMarkup(uri, autoplay) {
    const autoplayAttr = autoplay ? ' data-autoplay="1"' : '';
    return `<div class="spotifyHost"${autoplayAttr} data-spotify-uri="${uri}"><div class="spotifyLoading" role="status">Loading Spotify…</div><div class="spotifyMount"></div></div>`;
}

function nextMusicButton() {
    return `<p><button type="button" class="nextMusic" style="margin-top: 0px; margin-bottom: 10px; background-color: #4CAF50; color: white; border: none; padding: 5px 10px; text-align: center; text-decoration: none; display: inline-block; font-size: 14px; border-radius: 8px; cursor: pointer;">Next</button></p>`;
}

async function playRandomLikedSong() {
    pauseEveryPlayer();
    const slot = document.createElement('div');
    slot.appendChild(document.createTextNode('Random Liked Song:\n'));
    const host = document.createElement('div');
    host.className = 'spotifyHost';
    host.dataset.autoplay = '1';
    host.innerHTML = '<div class="spotifyLoading" role="status">Loading Spotify…</div><div class="spotifyMount"></div>';
    slot.appendChild(host);
    terminalOutput.appendChild(slot);
    mountSpotifyHost(host);
    scrollCliToEnd();
    try {
        const trackId = await pickRandomLikedTrackId();
        if (!slot.isConnected) return;
        if (!trackId) {
            discardSpotifyHost(host);
            slot.appendChild(document.createTextNode("Couldn't load a liked song right now."));
            scrollCliToEnd();
            return;
        }
        host.dataset.spotifyUri = 'spotify:track:' + trackId;
        slot.insertAdjacentHTML('beforeend', nextMusicButton());
        activateEmbeddedMedia(slot);
        scrollCliToEnd();
    } catch (error) {
        if (!slot.isConnected || host.dataset.mounted) return;
        discardSpotifyHost(host);
        slot.appendChild(document.createTextNode("Couldn't load a liked song right now."));
        scrollCliToEnd();
    }
}

function pauseEveryPlayer() {
    pauseOthers({});
}

function silenceController(controller) {
    const token = (controller._pauseToken || 0) + 1;
    controller._pauseToken = token;
    controller._awaitingPause = true;
    controller._ignorePlayUntil = Date.now() + 1500;
    try { controller.pause(); } catch (error) {}
    if (controller._host) controller._host.dataset.playback = 'paused';
    setTimeout(function () {
        if (controller._pauseToken === token) controller._awaitingPause = false;
    }, 4000);
}

function notePlayback(controller, host, isPaused) {
    if (isPaused === true) {
        controller._awaitingPause = false;
        host.dataset.playback = 'paused';
        return;
    }
    if (isPaused !== false) return;
    if (controller._awaitingPause || Date.now() < (controller._ignorePlayUntil || 0)) {
        try { controller.pause(); } catch (error) {}
        return;
    }
    if (host.dataset.playback === 'playing') return;
    host.dataset.playback = 'playing';
    pauseOthers({ controller: controller });
}

function startRequestedPlayback(controller, host) {
    if (!host.isConnected || host.dataset.autoplay !== '1') return;
    if (latestMediaElement() !== host) {
        silenceController(controller);
        return;
    }
    controller._awaitingPause = false;
    controller._ignorePlayUntil = 0;
    pauseOthers({ controller: controller });
    try { controller.play(); } catch (error) {}
}

function latestMediaElement() {
    const nodes = terminalOutput.querySelectorAll('.spotifyHost, audio');
    return nodes.length ? nodes[nodes.length - 1] : null;
}

function pauseOthers(active) {
    if (pausingPlayers) return;
    pausingPlayers = true;
    try {
        spotifyPlayers.forEach(function (controller) {
            if (controller === active.controller) return;
            silenceController(controller);
        });
        terminalOutput.querySelectorAll('audio').forEach(function (audio) {
            if (audio !== active.audio) audio.pause();
        });
        terminalOutput.querySelectorAll('.spotifyHost').forEach(function (host) {
            if (active.host === host) return;
            if (active.controller && active.controller._host === host) return;
            if (host.dataset.mounted !== 'plain') return;
            host.dataset.playback = 'paused';
            const iframe = host.querySelector('iframe');
            if (iframe) reloadSpotifyIframe(iframe);
        });
    } finally {
        pausingPlayers = false;
    }
}

function reloadSpotifyIframe(iframe) {
    const src = iframe.getAttribute('src');
    if (!src || src === 'about:blank') return;
    iframe.src = 'about:blank';
    setTimeout(function () {
        if (iframe.isConnected) iframe.src = src;
    }, 0);
}

function activateEmbeddedMedia(root) {
    if (!root) return;
    root.querySelectorAll('audio').forEach(function (audio) {
        if (audio.dataset.bound === '1') return;
        audio.dataset.bound = '1';
        audio.addEventListener('play', function () {
            pauseOthers({ audio: audio });
        });
    });
    root.querySelectorAll('.spotifyHost').forEach(mountSpotifyHost);
}

function discardSpotifyHost(host) {
    if (!host) return;
    clearTimeout(host._loadingTimer);
    host._loadingTimer = 0;
    if (host._spotifyObserver) host._spotifyObserver.disconnect();
    host.remove();
}

function releaseSpotifyHosts() {
    terminalOutput.querySelectorAll('.spotifyHost').forEach(discardSpotifyHost);
}

function spotifySrcReady(src) {
    return !!src && src.indexOf('about:blank') !== 0;
}

function updateSpotifyLoading(host) {
    const iframe = host.querySelector('iframe');
    const src = iframe ? (iframe.getAttribute('src') || '') : '';
    const ready = !!(iframe && iframe.dataset.loaded === '1' && spotifySrcReady(src));
    if (ready) {
        clearTimeout(host._loadingTimer);
        host._loadingTimer = 0;
        host.classList.remove('spotifyPending');
        return;
    }
    if (host._loadingTimer || host.classList.contains('spotifyPending')) return;
    host._loadingTimer = setTimeout(function () {
        host._loadingTimer = 0;
        if (!host.isConnected) return;
        const current = host.querySelector('iframe');
        const currentSrc = current ? (current.getAttribute('src') || '') : '';
        const stillReady = !!(current && current.dataset.loaded === '1' && spotifySrcReady(currentSrc));
        if (!stillReady) host.classList.add('spotifyPending');
    }, 400);
}

function bindSpotifyIframe(host, iframe) {
    if (!iframe || iframe.dataset.loadBound === '1') return;
    iframe.dataset.loadBound = '1';
    iframe.classList.add('spotifyIframe');
    iframe.addEventListener('load', function () {
        const src = iframe.getAttribute('src') || '';
        iframe.dataset.loaded = spotifySrcReady(src) ? '1' : '';
        updateSpotifyLoading(host);
        scrollCliToEnd();
        if (host.dataset.mounted !== 'plain') return;
        if (src.indexOf('open.spotify.com/embed') === -1) return;
        if (host.dataset.autoplay !== '1' || host.dataset.playback === 'paused') return;
        if (latestMediaElement() !== host) return;
        pauseOthers({ host: host });
        try { iframe.contentWindow.postMessage({ command: 'play' }, '*'); } catch (error) {}
    });
}

function watchSpotifyFrame(host) {
    if (!host || host.dataset.loadWatch === '1') return;
    host.dataset.loadWatch = '1';
    if (!host.querySelector('.spotifyLoading')) {
        const loading = document.createElement('div');
        loading.className = 'spotifyLoading';
        loading.setAttribute('role', 'status');
        loading.textContent = 'Loading Spotify…';
        host.prepend(loading);
    }
    const observer = new MutationObserver(function () {
        host.querySelectorAll('iframe').forEach(function (iframe) {
            bindSpotifyIframe(host, iframe);
        });
    });
    observer.observe(host, { childList: true, subtree: true });
    host._spotifyObserver = observer;
    host.querySelectorAll('iframe').forEach(function (iframe) {
        bindSpotifyIframe(host, iframe);
    });
    updateSpotifyLoading(host);
}

function mountSpotifyHost(host) {
    if (!host || host.dataset.mounted) return;
    watchSpotifyFrame(host);
    if (!host.dataset.spotifyUri) return;
    if (!spotifyApi) {
        if (spotifyApiGaveUp) {
            mountPlainSpotify(host);
            return;
        }
        if (pendingSpotifyHosts.indexOf(host) === -1) pendingSpotifyHosts.push(host);
        return;
    }
    const mount = host.querySelector('.spotifyMount');
    if (!mount) return;
    try {
        spotifyApi.createController(mount, {
            width: '100%',
            height: 152,
            uri: host.dataset.spotifyUri,
            theme: 'dark'
        }, function (controller) {
            controller._host = host;
            host._controller = controller;
            spotifyPlayers.add(controller);
            if (latestMediaElement() !== host) {
                silenceController(controller);
            } else if (host.dataset.autoplay === '1') {
                const playWhenReady = function () {
                    setTimeout(function () {
                        startRequestedPlayback(controller, host);
                    }, 0);
                };
                controller.addListener('ready', playWhenReady);
                setTimeout(function () {
                    if (!host.isConnected || host.dataset.playback === 'playing') return;
                    if (latestMediaElement() !== host) return;
                    startRequestedPlayback(controller, host);
                }, 700);
            }
            controller.addListener('playback_update', function (event) {
                const isPaused = event && event.data ? event.data.isPaused : undefined;
                notePlayback(controller, host, isPaused);
            });
            controller.addListener('playback_started', function () {
                notePlayback(controller, host, false);
            });
            styleSpotifyIframe(host);
            scrollCliToEnd();
        });
        host.dataset.mounted = 'api';
    } catch (error) {
        if (host.querySelector('.spotifyMount')) mountPlainSpotify(host);
    }
}

function styleSpotifyIframe(host) {
    const iframe = host.querySelector('iframe');
    if (!iframe) return;
    iframe.classList.add('spotifyIframe');
    iframe.style.width = '100%';
    iframe.style.maxWidth = '100%';
    iframe.style.borderRadius = '12px';
    bindSpotifyIframe(host, iframe);
}

function embedUrlFromUri(uri) {
    const parts = uri.split(':');
    return `https://open.spotify.com/embed/${parts[1]}/${parts[2]}?utm_source=generator&theme=0`;
}

function mountPlainSpotify(host) {
    if (!host || host.dataset.mounted) return;
    watchSpotifyFrame(host);
    if (!host.dataset.spotifyUri) return;
    const mount = host.querySelector('.spotifyMount');
    if (!mount) return;
    const iframe = document.createElement('iframe');
    iframe.className = 'spotifyIframe';
    iframe.src = embedUrlFromUri(host.dataset.spotifyUri);
    iframe.height = '152';
    iframe.style.width = '100%';
    iframe.style.maxWidth = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '12px';
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    host.dataset.mounted = 'plain';
    bindSpotifyIframe(host, iframe);
    mount.replaceWith(iframe);
    scrollCliToEnd();
}

function showSpotifyIframe() {
    document.querySelectorAll('.spotifyHost iframe').forEach(function (iframe) {
        iframe.style.width = '100%';
        iframe.style.maxWidth = '100%';
        iframe.hidden = false;
        iframe.style.borderRadius = '12px';
    });
    scrollCliToEnd();
}

function loadLikedTrackIds() {
    if (likedTrackIds) return Promise.resolve(likedTrackIds);
    if (!likedTrackIdsPromise) {
        likedTrackIdsPromise = fetchLikedTrackIds().then(function (ids) {
            likedTrackIds = ids;
            return ids;
        }).catch(function (error) {
            likedTrackIdsPromise = null;
            const fallback = fallbackLikedTrackIds();
            if (fallback.length) return fallback;
            throw error;
        });
    }
    return likedTrackIdsPromise;
}

function fallbackLikedTrackIds() {
    if (typeof likedMusics === 'undefined' || !Array.isArray(likedMusics)) return [];
    return likedMusics.map(function (song) { return song.musicId; }).filter(Boolean);
}

async function fetchLikedTrackIds() {
    const hashes = [PLAYLIST_QUERY_HASH];
    const stored = readStoredHash();
    if (stored && hashes.indexOf(stored) === -1) hashes.push(stored);
    let lastError = null;
    for (let i = 0; i < hashes.length; i++) {
        try {
            return await fetchTracksForHash(hashes[i]);
        } catch (error) {
            lastError = error;
        }
    }
    try {
        const discovered = await discoverPlaylistQueryHash();
        if (discovered && hashes.indexOf(discovered) === -1) {
            localStorage.setItem(HASH_STORAGE_KEY, JSON.stringify({ hash: discovered, savedAt: Date.now() }));
            return await fetchTracksForHash(discovered);
        }
    } catch (error) {
        lastError = error;
    }
    throw lastError || new Error('playlist');
}

function readStoredHash() {
    try {
        const raw = JSON.parse(localStorage.getItem(HASH_STORAGE_KEY));
        if (!raw || !/^[a-f0-9]{64}$/.test(raw.hash)) return null;
        if (Date.now() - raw.savedAt > 12 * 60 * 60 * 1000) return null;
        return raw.hash;
    } catch (error) {
        return null;
    }
}

async function discoverPlaylistQueryHash() {
    const home = await fetch('https://open.spotify.com/');
    if (!home.ok) throw new Error('spotify home unavailable');
    const html = await home.text();
    const bundleUrl = html.match(/https:\/\/open\.spotifycdn\.com\/cdn\/build\/web-player\/web-player\.[a-f0-9]+\.js/);
    if (!bundleUrl) throw new Error('web player bundle missing');
    const jsResponse = await fetch(bundleUrl[0]);
    if (!jsResponse.ok) throw new Error('web player bundle unavailable');
    const js = await jsResponse.text();
    const hash = js.match(/"fetchPlaylist","query","([a-f0-9]{64})"/);
    if (!hash) throw new Error('playlist query missing');
    return hash[1];
}

async function fetchTracksForHash(hash) {
    const tokenResponse = await fetch('https://open.spotify.com/embed/api/token');
    if (!tokenResponse.ok) throw new Error('embed token unavailable');
    const tokenPayload = await tokenResponse.json();
    if (!tokenPayload.accessToken) throw new Error('embed token missing');
    const ids = [];
    const limit = 100;
    let offset = 0;
    let total = Infinity;
    while (offset < total && offset < 2000) {
        const page = await fetchPlaylistPage(tokenPayload.accessToken, hash, offset, limit);
        total = page.total;
        page.ids.forEach(function (id) {
            if (ids.indexOf(id) === -1) ids.push(id);
        });
        if (!page.ids.length) break;
        offset += limit;
    }
    if (!ids.length) throw new Error('playlist empty');
    return ids;
}

async function fetchPlaylistPage(token, hash, offset, limit) {
    const variables = {
        uri: `spotify:playlist:${LIKED_PLAYLIST_ID}`,
        offset: offset,
        limit: limit,
        enableWatchFeedEntrypoint: false
    };
    const extensions = { persistedQuery: { version: 1, sha256Hash: hash } };
    const params = new URLSearchParams({
        operationName: 'fetchPlaylist',
        variables: JSON.stringify(variables),
        extensions: JSON.stringify(extensions)
    });
    const response = await fetch(`https://api-partner.spotify.com/pathfinder/v1/query?${params}`, {
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
        }
    });
    if (!response.ok) throw new Error('playlist request failed');
    const payload = await response.json();
    if (payload.errors && payload.errors.length) {
        throw new Error(payload.errors[0].message || 'playlist query failed');
    }
    const content = payload.data && payload.data.playlistV2 && payload.data.playlistV2.content;
    if (!content) throw new Error('playlist content missing');
    const ids = [];
    (content.items || []).forEach(function (item) {
        const data = item.itemV2 && item.itemV2.data;
        const uri = data && data.uri ? data.uri : '';
        if (uri.indexOf('spotify:track:') !== 0) return;
        if (data.playability && data.playability.playable === false) return;
        ids.push(uri.split(':').pop());
    });
    return { ids: ids, total: content.totalCount || ids.length };
}

async function pickRandomLikedTrackId() {
    const ids = await loadLikedTrackIds();
    if (!ids.length) return null;
    let played = {};
    try {
        const stored = JSON.parse(localStorage.getItem('playedPositions'));
        if (stored && !Array.isArray(stored)) played = stored;
    } catch (error) {
        played = {};
    }
    const remaining = ids.filter(function (id) { return !played[id]; });
    const pool = remaining.length ? remaining : ids;
    const nextPlayed = remaining.length ? played : {};
    const trackId = pool[Math.floor(Math.random() * pool.length)];
    nextPlayed[trackId] = true;
    const pruned = {};
    ids.forEach(function (id) {
        if (nextPlayed[id]) pruned[id] = true;
    });
    localStorage.setItem('playedPositions', JSON.stringify(pruned));
    return trackId;
}

function buildTgifMsg(days, hours, minutes, seconds) {
    const today = new Date();
    const day = today.getDay();

    switch (day) {
        case 5: // Friday
            if (today.getHours() >= 18) {
                return `Thank God it's Friday!.<br>At Monday we restart the countdown.`;
            }
            break;
        case 6: // Saturday
            return `It's Saturday, enjoy your day!<br>At Monday we restart the countdown.`;
        case 0: // Sunday
            return `It's Sunday, take a good rest.<br>Tomorrow, we restart the countdown.`;
        break;
    }
    let message = `Thank God It's Friday in:\n`;
    if (days > 0) {
        message += `${days}d`;
    }
    if (hours > 0) {
        if (days > 0) {
            message += ', ';
        }
        message += `${hours}h`;
    }
    if (minutes > 0) {
        if (days > 0 || hours > 0) {
            message += ', ';
        }
        message += `${minutes}m`;
    }
    if (days > 0 || hours > 0 || minutes > 0) {
        message += ' and ';
    }
    message += `${seconds}s`;
    return message + '.';  
}

function addShareButtonEvent() {
    const shareButton = document.querySelectorAll('.shareButton')[document.querySelectorAll('.shareButton').length - 1];
    shareButton.addEventListener('click', function() {
        if (navigator.share) {
            navigator.share({
                title: 'Online Terminal by lucaohost',
                text: 'Online Terminal by lucaohost',
                url: 'https://lucaohost.github.io',
            })
            .then(() => console.log('Successful share'))
            .catch((error) => console.log('Error sharing', error));
        } else {
            alert('This feature is not supported in your browser. You can copy the link in the address bar.');
        }
    });
    shareButton.click();
}

function addEvents(command) {
    if (command === 'share') {
        addShareButtonEvent();
    }
    if (command === "liked") {
        showSpotifyIframe();
    }
    if (command === "rick") {
        document.querySelectorAll(`.rickRolledExplanation`).forEach(element => {
            element.addEventListener('click', function() {
                appendOutput(`<span class="path">lucaohost@bash:~$</span> rickrolled?`);
                processCommand(`rickrolled?`);
                clearCommand();
            });
        });
    }
    if (command === "lucaohost") {
        document.querySelectorAll(`.localhostExplanation`).forEach(element => {
            element.addEventListener('click', function() {
                appendOutput(`<span class="path">lucaohost@bash:~$</span> localhost?`);
                processCommand(`localhost?`);
                clearCommand();
            });
        });
    }
}
