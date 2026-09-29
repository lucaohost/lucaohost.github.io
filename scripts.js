let inputField = document.getElementById('input');

function isMobileCli() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function readCommand() {
    if (!inputField) return '';
    if (inputField.tagName === 'INPUT') return inputField.value || '';
    if (typeof inputField.innerText === 'string') return inputField.innerText;
    return inputField.textContent || '';
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
        if (commandInputLocked) {
            event.preventDefault();
            return;
        }
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
            'music song', "Play a Spotify song by name.",
            'list', "Randomized songs. Play from the list.",
            'liked', "100 newest liked songs, one after another.",
            'changelog', "Updates and dates.",
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
        if (window.opener && !window.opener.closed) window.close();
        window.setTimeout(function () {
            if (!window.closed) window.location.replace('about:blank');
        }, 0);
    },
    liked: function() {
        return renderLikedSongs();
    },
    changelog: function () {
        return renderChangelog();
    },
    list: function () {
        return renderPlayedMusic();
    },
    'clear music': function () {
        return clearPlayedMusic();
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
        htmlRick += "<img src='images/rick-roll-rick-rolled.gif' alt='Rick Roll' style='display: block; width: 100%; max-width: 640px; aspect-ratio: 1 / 1; height: auto; margin-top: 10px; margin-bottom: 10px; border-radius:12px;'><br>";
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
    loadLikedCatalog().catch(function () {});
    bindTerminalChrome();
    if (!isMobileCli()) inputField.focus();
});

document.addEventListener('click', function(event) {
    const selection = window.getSelection().toString();
    if (!isMobileCli() && !selection && !event.target.closest('.nextMusic, .terminal-bar, .trackBlock')) {
        inputField.focus();
    }
});


async function processCommand(input) {
    const command = input.trim().toLocaleLowerCase();
    const namedMusic = command.startsWith('music ') ? input.trim().replace(/^music\s+/i, '').trim() : '';
    const runner = commands[command] ? command : (namedMusic ? 'music-search' : '');
    if (runner) {
        const wait = runner === 'music-search' ? beginSlowCommandWait('Searching Spotify…') : null;
        try {
            const result = runner === 'music-search'
                ? playNamedSong(namedMusic)
                : (typeof commands[command] === 'function' ? commands[command]() : commands[command]);
            const html = result instanceof Promise ? await result : result;
            endSlowCommandWait(wait);
            if (html !== undefined) appendOutput(html);
            if (runner === 'music-search' || command === 'rick' || command === 'music' || command === 'liked' || command === 'list' || command === 'next music') {
                showSpotifyIframe();
            }
        } catch (error) {
            endSlowCommandWait(wait);
            appendOutput(`Command "${escapeHtml(input)}" failed.\n${commands.helpDesc}`);
        }
        addEvents(runner === 'music-search' ? 'music' : command);
    } else {
        appendOutput(`Command "${escapeHtml(input)}" not found.\n${commands.helpDesc}`);
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

var cliScrollLockedUntil = 0;
var commandInputLocked = false;

function cliView() {
    return document.getElementById('terminal-body') || cli;
}

function alignCli(mode, node) {
    if (Date.now() < cliScrollLockedUntil) return;
    const view = cliView();
    const apply = () => {
        if (Date.now() < cliScrollLockedUntil) return;
        if (mode === 'start' && node && node.isConnected) {
            view.scrollTop += node.getBoundingClientRect().top - view.getBoundingClientRect().top;
            return;
        }
        view.scrollTop = view.scrollHeight;
    };
    apply();
    requestAnimationFrame(apply);
}

function blockLockedScroll(event) {
    if (!cliView().classList.contains('is-scrollLocked')) return;
    if (event.cancelable) event.preventDefault();
}

function lockPlaybackScroll() {
    const view = cliView();
    if (view.classList.contains('is-scrollLocked')) return;
    const top = view.scrollTop;
    view.classList.add('is-scrollLocked');
    view._scrollLockTop = top;
    view._scrollLockOverflow = view.style.overflow;
    view.style.overflow = 'hidden';
    view.scrollTop = top;
    view._scrollLockPreviousUntil = cliScrollLockedUntil;
    cliScrollLockedUntil = Date.now() + 20000;
    view._scrollLockRestore = function () {
        if (!view.classList.contains('is-scrollLocked')) return;
        const locked = view._scrollLockTop;
        if (Math.abs(view.scrollTop - locked) <= 1) return;
        requestAnimationFrame(function () {
            if (view.classList.contains('is-scrollLocked')) view.scrollTop = locked;
        });
    };
    view.addEventListener('scroll', view._scrollLockRestore, { passive: true });
    view.addEventListener('wheel', blockLockedScroll, { passive: false, capture: true });
    view.addEventListener('touchmove', blockLockedScroll, { passive: false, capture: true });
}

function unlockPlaybackScroll() {
    if (document.querySelector('.trackBlock.is-playLocked')) return;
    const view = cliView();
    if (!view.classList.contains('is-scrollLocked')) return;
    const top = view._scrollLockTop;
    view.classList.remove('is-scrollLocked');
    view.style.overflow = view._scrollLockOverflow || '';
    if (typeof top === 'number') view.scrollTop = top;
    view.removeEventListener('scroll', view._scrollLockRestore);
    view.removeEventListener('wheel', blockLockedScroll, true);
    view.removeEventListener('touchmove', blockLockedScroll, true);
    const previous = view._scrollLockPreviousUntil || 0;
    cliScrollLockedUntil = previous > Date.now() ? previous : 0;
}

function holdCliPosition() {
    const view = cliView();
    const top = view.scrollTop;
    const until = Date.now() + 1200;
    cliScrollLockedUntil = until;
    const restore = function () {
        if (Date.now() > until) {
            view.removeEventListener('scroll', restore);
            return;
        }
        if (Math.abs(view.scrollTop - top) > 1) view.scrollTop = top;
    };
    view.addEventListener('scroll', restore, { passive: true });
    setTimeout(function () {
        view.removeEventListener('scroll', restore);
    }, 1300);
    const blurFrame = function () {
        const active = document.activeElement;
        if (active && active.tagName === 'IFRAME') active.blur();
        restore();
    };
    blurFrame();
    setTimeout(blurFrame, 0);
    setTimeout(blurFrame, 80);
    setTimeout(blurFrame, 300);
    setTimeout(blurFrame, 700);
}

function bindTerminalChrome() {
    const bar = document.querySelector('.terminal-bar');
    if (!bar || bar.dataset.bound === '1') return;
    bar.dataset.bound = '1';
    const maxButton = bar.querySelector('.term-max');
    bar.querySelector('.term-min').addEventListener('click', function () {
        cli.classList.remove('is-max');
        cli.classList.toggle('is-min');
        syncMaxIcon();
    });
    maxButton.addEventListener('click', function () {
        cli.classList.remove('is-min');
        cli.classList.toggle('is-max');
        syncMaxIcon();
    });
    bar.querySelector('.term-close').addEventListener('click', function () {
        commands.exit();
    });
    function syncMaxIcon() {
        const maximized = cli.classList.contains('is-max');
        maxButton.setAttribute('aria-label', maximized ? 'Restore' : 'Maximize');
        maxButton.classList.toggle('is-maxed', maximized);
    }
}

function scrollCliToEnd() {
    const latest = terminalOutput.lastElementChild;
    const holdStart = latest && latest.querySelector('.likedBlock, .changelogText, .musicList');
    alignCli(holdStart ? 'start' : 'end', latest);
}

function followCliScroll(node) {
    const apply = () => {
        if (node && node.isConnected && terminalOutput.lastElementChild && node !== terminalOutput.lastElementChild) return;
        scrollCliToEnd();
    };
    apply();
    if (!node || node._scrollWatch || typeof ResizeObserver === 'undefined') return;
    node._scrollWatch = true;
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    setTimeout(() => {
        observer.disconnect();
        node._scrollWatch = false;
    }, 3000);
}

function appendOutput(text) {
    const newLine = document.createElement('div');
    if (text !== undefined) {
        newLine.innerHTML = text;
        terminalOutput.appendChild(newLine);
        newLine.querySelectorAll('img, iframe, audio').forEach((element) => {
            element.addEventListener('load', () => followCliScroll(newLine));
            if (element.tagName === 'AUDIO') element.addEventListener('play', () => followCliScroll(newLine));
            if (element.tagName === 'IMG' && element.complete) followCliScroll(newLine);
            if (element.tagName === 'IMG' && typeof element.decode === 'function') {
                element.decode().then(() => followCliScroll(newLine)).catch(function () {});
            }
        });
        activateEmbeddedMedia(newLine);
        followCliScroll(newLine);
        if (newLine.querySelector('img, audio')) {
            setTimeout(() => followCliScroll(newLine), 400);
            setTimeout(() => followCliScroll(newLine), 1200);
        }
    } else {
        scrollCliToEnd();
    }
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
    if (commandInputLocked) {
        if (event.preventDefault) event.preventDefault();
        return;
    }
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

document.addEventListener('beforeinput', function (event) {
    if (!commandInputLocked) return;
    const target = event.target;
    if (target === inputField || (target && target.closest && target.closest('.input-line'))) {
        event.preventDefault();
    }
}, true);

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
    if (control.classList.contains('trackPlay') || control.classList.contains('nextMusic')) {
        const touch = event.changedTouches[0];
        trackTouch = {
            id: touch.identifier,
            x: touch.clientX,
            y: touch.clientY,
            scroll: cliView().scrollTop,
            button: control,
            dragged: false
        };
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

document.addEventListener('touchmove', function (event) {
    if (!trackTouch) return;
    const touch = trackTouchPoint(event.touches, trackTouch.id) || trackTouchPoint(event.changedTouches, trackTouch.id);
    if (!touch) return;
    if (trackGestureMoved(trackTouch, touch.clientX, touch.clientY)) trackTouch.dragged = true;
}, { passive: true });

document.addEventListener('touchend', function (event) {
    if (!trackTouch) return;
    const touch = trackTouchPoint(event.changedTouches, trackTouch.id);
    if (!touch) return;
    const gesture = trackTouch;
    trackTouch = null;
    const dragged = gesture.dragged || trackGestureMoved(gesture, touch.clientX, touch.clientY);
    if (dragged) {
        event.preventDefault();
        armSuppressClick(gesture.button);
        return;
    }
    if (gesture.button.classList.contains('nextMusic')) {
        event.preventDefault();
        armSuppressClick(gesture.button);
        startNextMusic();
        focusCliInput();
        return;
    }
    if (gesture.button.disabled) {
        event.preventDefault();
        return;
    }
    event.preventDefault();
    armSuppressClick(gesture.button);
    playTrackSelection(gesture.button);
    focusCliInput();
}, { passive: false });

document.addEventListener('touchcancel', function () {
    if (!trackTouch) return;
    armSuppressClick(trackTouch.button);
    trackTouch = null;
});

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
    if (isMobileCli()) cli.classList.remove('is-max', 'is-min');
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

    let releaseTimer = 0;

    function finishPress() {
        const button = pressedButton;
        stopRepeat();
        clearTimeout(releaseTimer);
        if (!button) return;
        releaseTimer = setTimeout(() => {
            if (pressedButton === button) {
                button.classList.remove('is-pressed');
                pressedButton = null;
            }
        }, 180);
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
        if (commandInputLocked) return;
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
        clearTimeout(releaseTimer);
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
var SEARCH_QUERY_HASH = 'b50ebd72524415b132ddaca04158fd7aca529da28be322c9924643c0633df5bd';
var HASH_STORAGE_KEY = 'spotifyPlaylistQueryHash';
var PLAYED_MUSIC_URL = 'https://snooker-scoreboard2-default-rtdb.firebaseio.com/seasons/cli/playedMusic';
var spotifyPlayers = new Set();
var spotifyApi = null;
var spotifyApiGaveUp = false;
var pendingSpotifyHosts = [];
var pausingPlayers = false;
var likedCatalog = null;
var likedCatalogPromise = null;
var playedMusicState = null;
var spotifyToken = null;
var spotifyTokenPromise = null;
var trackSearchCache = new Map();

var trackTouch = null;
var trackPointer = null;
var TRACK_TAP_SLOP = 12;
var TRACK_SCROLL_SLOP = 8;

function trackTouchPoint(touchList, id) {
    if (!touchList) return null;
    for (let i = 0; i < touchList.length; i++) {
        if (touchList[i].identifier === id) return touchList[i];
    }
    return null;
}

function trackGestureMoved(gesture, x, y) {
    const dx = x - gesture.x;
    const dy = y - gesture.y;
    if ((dx * dx) + (dy * dy) > TRACK_TAP_SLOP * TRACK_TAP_SLOP) return true;
    return Math.abs(cliView().scrollTop - gesture.scroll) > TRACK_SCROLL_SLOP;
}

function armSuppressClick(button) {
    if (!button) return;
    button.dataset.suppressClick = '1';
    window.setTimeout(function () {
        if (button.dataset.suppressClick === '1') delete button.dataset.suppressClick;
    }, 700);
}

function markTrackDrag() {
    if (trackPointer) trackPointer.dragged = true;
    if (trackTouch) trackTouch.dragged = true;
}

function guardedPressButton(target) {
    return target && target.closest && target.closest('.trackPlay, .nextMusic');
}

function startNextMusic() {
    appendOutput(`<span class="path">lucaohost@bash:~$</span> next music`);
    processCommand('next music');
    clearCommand();
}

document.addEventListener('pointerdown', function (event) {
    const button = guardedPressButton(event.target);
    if (!button) {
        trackPointer = null;
        return;
    }
    trackPointer = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        scroll: cliView().scrollTop,
        button: button,
        dragged: false
    };
}, true);

document.addEventListener('pointermove', function (event) {
    if (!trackPointer || event.pointerId !== trackPointer.id) return;
    if (trackGestureMoved(trackPointer, event.clientX, event.clientY)) markTrackDrag();
}, true);

document.addEventListener('pointerup', function (event) {
    if (!trackPointer || event.pointerId !== trackPointer.id) return;
    if (trackGestureMoved(trackPointer, event.clientX, event.clientY)) markTrackDrag();
    if (trackPointer.dragged) armSuppressClick(trackPointer.button);
    trackPointer = null;
}, true);

document.addEventListener('pointercancel', function (event) {
    if (!trackPointer || event.pointerId !== trackPointer.id) return;
    markTrackDrag();
    armSuppressClick(trackPointer.button);
    trackPointer = null;
}, true);

terminalOutput.addEventListener('click', function (event) {
    const playButton = event.target.closest('.trackPlay');
    if (playButton) {
        if (playButton.dataset.suppressClick === '1') {
            delete playButton.dataset.suppressClick;
            return;
        }
        if (playButton.disabled) return;
        playTrackSelection(playButton);
        return;
    }
    const button = event.target.closest('.nextMusic');
    if (!button) return;
    if (button.dataset.suppressClick === '1') {
        delete button.dataset.suppressClick;
        return;
    }
    startNextMusic();
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
    return '<button type="button" class="nextMusic" aria-label="Next song"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 5.2v13.6L12 12z" fill="currentColor"></path><path d="M12.4 5.2v13.6L20.8 12z" fill="currentColor"></path></svg></button>';
}

function beginSlowCommandWait(label) {
    const wait = { done: false, node: null, timer: 0 };
    wait.timer = window.setTimeout(function () {
        wait.timer = 0;
        showSlowCommandWait(wait, label);
    }, 400);
    return wait;
}

function showSlowCommandWait(wait, label) {
    if (wait.done) return;
    const line = document.createElement('div');
    line.className = 'commandWait';
    line.setAttribute('role', 'status');
    const spin = document.createElement('span');
    spin.className = 'commandWaitSpin';
    spin.setAttribute('aria-hidden', 'true');
    line.appendChild(spin);
    line.appendChild(document.createTextNode(label));
    terminalOutput.appendChild(line);
    wait.node = line;
    const view = cliView();
    view.scrollTop = view.scrollHeight;
    lockPlaybackScroll();
    commandInputLocked = true;
    document.body.classList.add('is-commandLocked');
    if (inputField && inputField.getAttribute('contenteditable') === 'true') {
        inputField.dataset.editable = '1';
        inputField.setAttribute('contenteditable', 'false');
    }
    if (inputField) inputField.setAttribute('aria-busy', 'true');
}

function endSlowCommandWait(wait) {
    if (!wait || wait.done) return;
    wait.done = true;
    window.clearTimeout(wait.timer);
    if (wait.node && wait.node.parentNode) wait.node.remove();
    commandInputLocked = false;
    document.body.classList.remove('is-commandLocked');
    if (inputField) {
        inputField.removeAttribute('aria-busy');
        if (inputField.dataset.editable === '1') {
            inputField.setAttribute('contenteditable', 'true');
            delete inputField.dataset.editable;
        }
    }
    unlockPlaybackScroll();
}

async function playRandomLikedSong() {
    pauseEveryPlayer();
    const slot = document.createElement('div');
    slot.appendChild(document.createTextNode('Random Liked Song:\n'));
    const row = document.createElement('div');
    row.className = 'musicPlay';
    const host = document.createElement('div');
    host.className = 'spotifyHost';
    host.dataset.autoplay = '1';
    host.innerHTML = '<div class="spotifyLoading" role="status">Loading Spotify…</div><div class="spotifyMount"></div>';
    row.appendChild(host);
    slot.appendChild(row);
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
        row.insertAdjacentHTML('beforeend', nextMusicButton());
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

function rejectStalePlayback(controller, host, data) {
    if (host._controller !== controller) return true;
    const playingUri = data && data.playingURI;
    const requested = host.dataset.spotifyUri;
    if (!playingUri || !requested || sameTrackUri(playingUri, requested)) {
        host._stuckUri = '';
        clearTimeout(host._stuckTimer);
        host._stuckTimer = 0;
        return false;
    }
    if (data.isPaused === false) {
        try { controller.pause(); } catch (error) {}
        host._stuckUri = playingUri;
        if (!host._stuckTimer) {
            const token = host._requestToken;
            host._stuckTimer = setTimeout(function () {
                host._stuckTimer = 0;
                try {
                    if (!host.isConnected || !host.ownerDocument || !host.ownerDocument.defaultView) return;
                    if (host._requestToken !== token || host._controller !== controller) return;
                    if (host._heardUri === host.dataset.spotifyUri) return;
                    if (host._reportedUri && sameTrackUri(host._reportedUri, host.dataset.spotifyUri)) return;
                    replaceSpotifyController(host);
                } catch (error) {}
            }, 3500);
        }
    }
    return true;
}

function replaceSpotifyController(host) {
    if (!host || !host.isConnected || host._replacing) return;
    clearTrackSwitch(host);
    host._replacing = true;
    const controller = host._controller;
    host._controller = null;
    if (controller) {
        try { controller.pause(); } catch (error) {}
        try { if (typeof controller.destroy === 'function') controller.destroy(); } catch (error) {}
        spotifyPlayers.delete(controller);
    }
    host.querySelectorAll('iframe').forEach(function (frame) {
        try { frame.src = 'about:blank'; } catch (error) {}
        frame.remove();
    });
    ensureSpotifyMount(host);
    delete host.dataset.mounted;
    host._reportedUri = '';
    host._heardUri = '';
    host._stuckUri = '';
    host._replacing = false;
    mountSpotifyHost(host);
}

function reportedUriBlocksPlay(host) {
    if (!host._reportedUri || !host.dataset.spotifyUri) return false;
    return !sameTrackUri(host._reportedUri, host.dataset.spotifyUri);
}

function startRequestedPlayback(controller, host) {
    if (!host.isConnected || host.dataset.autoplay !== '1' || !controller) return;
    if (controller._requestToken !== host._requestToken) return;
    if (reportedUriBlocksPlay(host)) return;
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
    root.querySelectorAll('.trackBlock').forEach(function (block) {
        const host = block.querySelector('.spotifyHost');
        if (!host || host.dataset.autoplay !== '1') return;
        beginTrackPlayWait(block, block.querySelector('.trackRow.is-current .trackPlay'));
    });
}

function clearTrackSwitch(host) {
    if (!host) return;
    clearTimeout(host._switchTimer);
    clearTimeout(host._stuckTimer);
    host._switchTimer = 0;
    host._stuckTimer = 0;
}

function discardSpotifyHost(host) {
    if (!host) return;
    const block = host.closest('.trackBlock');
    clearTimeout(host._loadingTimer);
    clearTimeout(host._queueTimer);
    clearTrackSwitch(host);
    host._loadingTimer = 0;
    host._queueTimer = 0;
    if (host._spotifyObserver) host._spotifyObserver.disconnect();
    host.remove();
    if (block) finishTrackPlay(block);
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

function ensureSpotifyMount(host) {
    let mount = host.querySelector('.spotifyMount');
    if (mount) return mount;
    mount = document.createElement('div');
    mount.className = 'spotifyMount';
    host.appendChild(mount);
    return mount;
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
    const mount = ensureSpotifyMount(host);
    if (!mount) return;
    try {
        const requestedUri = host.dataset.spotifyUri;
        spotifyApi.createController(mount, {
            width: '100%',
            height: 152,
            uri: requestedUri,
            theme: 'dark'
        }, function (controller) {
            controller._host = host;
            host._controller = controller;
            const playbackToken = (host._requestToken || 0) + 1;
            host._requestToken = playbackToken;
            controller._requestToken = playbackToken;
            spotifyPlayers.add(controller);
            if (host.dataset.spotifyUri && host.dataset.spotifyUri !== requestedUri) {
                try { controller.pause(); } catch (error) {}
                try { if (typeof controller.destroy === 'function') controller.destroy(); } catch (error) {}
                spotifyPlayers.delete(controller);
                host._controller = null;
                delete host.dataset.mounted;
                host._replacing = false;
                mountSpotifyHost(host);
                return;
            }
            if (latestMediaElement() !== host) {
                silenceController(controller);
            } else if (host.dataset.autoplay === '1') {
                const playWhenReady = function () {
                    setTimeout(function () {
                        if (host._requestToken !== playbackToken) return;
                        startRequestedPlayback(controller, host);
                    }, 0);
                };
                controller.addListener('ready', playWhenReady);
                setTimeout(function () {
                    if (!host.isConnected || host._requestToken !== playbackToken) return;
                    if (host._heardUri === host.dataset.spotifyUri) return;
                    if (latestMediaElement() !== host) return;
                    startRequestedPlayback(controller, host);
                }, 700);
            }
            controller.addListener('playback_update', function (event) {
                if (host._controller !== controller) return;
                const data = event && event.data ? event.data : {};
                if (data.playingURI) host._reportedUri = data.playingURI;
                if (rejectStalePlayback(controller, host, data)) return;
                notePlayback(controller, host, data.isPaused);
                noteTrackProgress(host, data);
                watchLikedQueue(host, data);
            });
            controller.addListener('playback_started', function () {
                if (host._controller !== controller) return;
                if (reportedUriBlocksPlay(host)) return;
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

function hostForSpotifySource(source) {
    const iframes = terminalOutput.querySelectorAll('.spotifyHost iframe');
    for (let i = 0; i < iframes.length; i++) {
        if (iframes[i].contentWindow === source) return iframes[i].closest('.spotifyHost');
    }
    return null;
}

window.addEventListener('message', function (event) {
    if (event.origin !== 'https://open.spotify.com') return;
    let message = event.data;
    if (typeof message === 'string') {
        try { message = JSON.parse(message); } catch (error) { return; }
    }
    if (!message || message.type !== 'playback_update') return;
    const host = hostForSpotifySource(event.source);
    if (!host || host._controller) return;
    noteTrackProgress(host, message.payload || message.data || {});
});

function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
}

function trackLabel(track) {
    if (!track) return '';
    if (track.name && track.artist) return track.name + ' — ' + track.artist;
    return track.name || track.artist || track.id || '';
}

function todayStamp() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return now.getFullYear() + '-' + month + '-' + day;
}

function loadLikedCatalog() {
    if (likedCatalog) return Promise.resolve(likedCatalog);
    if (!likedCatalogPromise) {
        likedCatalogPromise = fetchLikedTracks().then(function (tracks) {
            likedCatalog = tracks;
            return tracks;
        }).catch(function (error) {
            likedCatalogPromise = null;
            const fallback = fallbackLikedTracks();
            if (fallback.length) return fallback;
            throw error;
        });
    }
    return likedCatalogPromise;
}

function fallbackLikedTracks() {
    if (typeof likedMusics === 'undefined' || !Array.isArray(likedMusics)) return [];
    return likedMusics.map(function (song) {
        return { id: song.musicId, name: '', artist: '', addedAt: '' };
    }).filter(function (track) { return track.id; });
}

async function fetchLikedTracks() {
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
    const token = await fetchSpotifyToken();
    const tracks = [];
    const seen = new Set();
    const limit = 100;
    let offset = 0;
    let total = Infinity;
    while (offset < total && offset < 2000) {
        const page = await fetchPlaylistPage(token, hash, offset, limit);
        total = page.total;
        page.tracks.forEach(function (track) {
            if (seen.has(track.id)) return;
            seen.add(track.id);
            tracks.push(track);
        });
        if (!page.tracks.length) break;
        offset += limit;
    }
    if (!tracks.length) throw new Error('playlist empty');
    return tracks;
}

async function fetchSpotifyToken() {
    const now = Date.now();
    if (spotifyToken && spotifyToken.expiresAt - now > 60000) return spotifyToken.accessToken;
    if (!spotifyTokenPromise) {
        spotifyTokenPromise = requestSpotifyToken().then(function (token) {
            spotifyToken = token;
            return token.accessToken;
        }).finally(function () {
            spotifyTokenPromise = null;
        });
    }
    return spotifyTokenPromise;
}

async function requestSpotifyToken() {
    const tokenResponse = await fetch('https://open.spotify.com/embed/api/token');
    if (!tokenResponse.ok) throw new Error('embed token unavailable');
    const tokenPayload = await tokenResponse.json();
    if (!tokenPayload.accessToken) throw new Error('embed token missing');
    return {
        accessToken: tokenPayload.accessToken,
        expiresAt: Number(tokenPayload.accessTokenExpirationTimestampMs) || (Date.now() + 30 * 60 * 1000)
    };
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
    const tracks = [];
    (content.items || []).forEach(function (item) {
        const data = item.itemV2 && item.itemV2.data;
        const uri = data && data.uri ? data.uri : '';
        if (uri.indexOf('spotify:track:') !== 0) return;
        if (data.playability && data.playability.playable === false) return;
        const artists = data.artists && data.artists.items ? data.artists.items : [];
        tracks.push({
            id: uri.split(':').pop(),
            name: data.name || '',
            artist: artists.map(function (artist) {
                return artist.profile && artist.profile.name ? artist.profile.name : '';
            }).filter(Boolean).join(', '),
            addedAt: item.addedAt && item.addedAt.isoString ? item.addedAt.isoString : ''
        });
    });
    return { tracks: tracks, total: content.totalCount || tracks.length };
}

async function pickRandomLikedTrackId() {
    const catalog = await loadLikedCatalog();
    const ids = catalog.map(function (track) { return track.id; }).filter(Boolean);
    if (!ids.length) return null;
    const state = await readPlayedMusic(false);
    const generation = state.generation || 1;
    let remaining = ids.filter(function (id) { return state.cycle[id] !== generation; });
    if (!remaining.length) {
        state.generation = generation + 1;
        fetch(PLAYED_MUSIC_URL + '/generation.json', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: String(state.generation)
        }).catch(function () {});
        remaining = ids;
    }
    const trackId = remaining[Math.floor(Math.random() * remaining.length)];
    const track = catalog.find(function (item) { return item.id === trackId; }) || { id: trackId, name: '', artist: '' };
    const previous = state.tracks[trackId] || {};
    const record = {
        name: track.name || previous.name || '',
        artist: track.artist || previous.artist || '',
        playedOn: todayStamp(),
        seq: Date.now()
    };
    state.cycle[trackId] = state.generation || 1;
    state.tracks[trackId] = record;
    writeLocalCycle(state);
    const headers = { 'Content-Type': 'application/json' };
    fetch(PLAYED_MUSIC_URL + '/tracks/' + trackId + '.json', {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(record)
    }).catch(function () {});
    fetch(PLAYED_MUSIC_URL + '/cycle/' + trackId + '.json', {
        method: 'PUT',
        headers: headers,
        body: String(state.generation || 1)
    }).catch(function () {});
    return trackId;
}

function isLegacyPositionKey(id) {
    return /^[0-9]{1,6}$/.test(String(id || ''));
}

function withoutLegacyKeys(value) {
    const kept = {};
    const removed = [];
    if (!value || typeof value !== 'object') return { kept: kept, removed: removed };
    Object.keys(value).forEach(function (key) {
        if (isLegacyPositionKey(key)) {
            removed.push(key);
            return;
        }
        kept[key] = value[key];
    });
    return { kept: kept, removed: removed };
}

function deletePlayedKey(id) {
    fetch(PLAYED_MUSIC_URL + '/tracks/' + id + '.json', { method: 'DELETE' }).catch(function () {});
    fetch(PLAYED_MUSIC_URL + '/cycle/' + id + '.json', { method: 'DELETE' }).catch(function () {});
}

function readLocalCycle() {
    try {
        const stored = JSON.parse(localStorage.getItem('playedPositions'));
        if (!stored || typeof stored !== 'object') return {};
        if (Array.isArray(stored)) {
            localStorage.removeItem('playedPositions');
            return {};
        }
        const cycle = {};
        let legacy = false;
        Object.keys(stored).forEach(function (id) {
            if (isLegacyPositionKey(id)) {
                legacy = true;
                return;
            }
            cycle[id] = true;
        });
        if (legacy) localStorage.setItem('playedPositions', JSON.stringify(cycle));
        return cycle;
    } catch (error) {}
    return {};
}

function writeLocalCycle(state) {
    const pruned = {};
    const generation = state.generation || 1;
    Object.keys(state.cycle || {}).forEach(function (id) {
        if (isLegacyPositionKey(id)) return;
        if (state.cycle[id] === generation) pruned[id] = true;
    });
    localStorage.setItem('playedPositions', JSON.stringify(pruned));
}

function emptyPlayedState() {
    return { tracks: {}, cycle: {}, generation: 1 };
}

async function readPlayedMusic(force) {
    if (playedMusicState && !force) return playedMusicState;
    const state = emptyPlayedState();
    const removed = [];
    try {
        const response = await fetch(PLAYED_MUSIC_URL + '.json');
        if (response.ok) {
            const data = await response.json();
            if (data && data.generation) state.generation = data.generation;
            const tracks = withoutLegacyKeys(data && data.tracks);
            const cycle = withoutLegacyKeys(data && data.cycle);
            state.tracks = tracks.kept;
            state.cycle = cycle.kept;
            tracks.removed.concat(cycle.removed).forEach(function (id) {
                if (removed.indexOf(id) === -1) removed.push(id);
            });
        }
    } catch (error) {}
    const local = readLocalCycle();
    const missing = {};
    Object.keys(local).forEach(function (id) {
        if (!state.tracks[id]) {
            state.tracks[id] = { name: '', artist: '', playedOn: '', seq: 0 };
            missing[id] = true;
        }
        if (state.cycle[id] !== state.generation) {
            state.cycle[id] = state.generation;
            missing[id] = true;
        }
    });
    playedMusicState = state;
    removed.forEach(deletePlayedKey);
    const headers = { 'Content-Type': 'application/json' };
    Object.keys(missing).forEach(function (id) {
        fetch(PLAYED_MUSIC_URL + '/tracks/' + id + '.json', {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(state.tracks[id])
        }).catch(function () {});
        fetch(PLAYED_MUSIC_URL + '/cycle/' + id + '.json', {
            method: 'PUT',
            headers: headers,
            body: String(state.generation)
        }).catch(function () {});
    });
    return state;
}

async function renderPlayedMusic() {
    const state = await readPlayedMusic(true);
    let total = 0;
    try {
        const catalog = await loadLikedCatalog();
        total = catalog.length;
        catalog.forEach(function (track) {
            const saved = state.tracks[track.id];
            if (!saved || saved.name || !track.name) return;
            saved.name = track.name;
            saved.artist = track.artist || saved.artist || '';
            fetch(PLAYED_MUSIC_URL + '/tracks/' + track.id + '.json', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: saved.name, artist: saved.artist })
            }).catch(function () {});
        });
    } catch (error) {}
    const rows = Object.keys(state.tracks).filter(function (id) {
        return !isLegacyPositionKey(id) && state.tracks[id] && typeof state.tracks[id] === 'object';
    }).map(function (id) {
        return Object.assign({ id: id }, state.tracks[id]);
    }).sort(function (a, b) {
        return (b.seq || 0) - (a.seq || 0) || trackLabel(a).localeCompare(trackLabel(b));
    });
    const totalLabel = total ? String(total) : '?';
    const heading = '<div class="trackHeading"><span>Randomized songs</span><span class="trackCount">' + rows.length + '/' + escapeHtml(totalLabel) + '</span></div>';
    if (!rows.length) return '<div class="musicList trackBlock">' + heading + '<p class="trackEmpty">None yet.</p></div>';
    pauseEveryPlayer();
    const items = rows.map(function (row, index) {
        return trackRowMarkup(row, index === 0, row.playedOn || '');
    }).join('');
    return '<div class="musicList trackBlock">' + heading + spotifyHostMarkup('spotify:track:' + rows[0].id, true) + '<ol class="trackList">' + items + '</ol></div>';
}

async function clearPlayedMusic() {
    const response = await fetch(PLAYED_MUSIC_URL + '.json', { method: 'DELETE' });
    if (!response.ok) return "Couldn't clear the randomized songs.";
    playedMusicState = emptyPlayedState();
    localStorage.removeItem('playedPositions');
    return 'Randomized songs cleared.';
}

async function renderLikedSongs() {
    pauseEveryPlayer();
    const catalog = await loadLikedCatalog();
    const latest = catalog.filter(function (track) { return track.addedAt; })
        .sort(function (a, b) { return b.addedAt.localeCompare(a.addedAt); })
        .slice(0, 100);
    if (!latest.length) return "Couldn't load the current liked songs.";
    const items = latest.map(function (track, index) {
        return trackRowMarkup(track, index === 0, '');
    }).join('');
    return '<div class="trackBlock likedBlock"><div class="trackHeading">My Last 100 Liked Songs</div>' + spotifyHostMarkup('spotify:track:' + latest[0].id, true) + '<ol class="trackList">' + items + '</ol></div>';
}

function trackRowMarkup(track, current, meta) {
    const label = trackLabel(track) || 'Unknown song';
    const name = track.name || label;
    const artist = track.artist ? '<span class="trackArtist">' + escapeHtml(track.artist) + '</span>' : '';
    const when = meta ? '<span class="trackMeta">' + escapeHtml(meta) + '</span>' : '';
    return '<li class="trackRow' + (current ? ' is-current' : '') + '"><button type="button" class="trackPlay" data-track-id="' + escapeHtml(track.id) + '" aria-label="Play ' + escapeHtml(label) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"></path></svg></button><span class="trackCopy"><span class="trackName">' + escapeHtml(name) + '</span>' + artist + '</span>' + when + '</li>';
}

function beginTrackPlayWait(block, button) {
    if (!block || !button) return;
    window.clearTimeout(block._playWaitTimer);
    window.clearTimeout(block._playGiveUp);
    const token = (Number(block.dataset.playToken) || 0) + 1;
    block.dataset.playToken = String(token);
    clearTrackPlayUi(block);
    block._playWaitTimer = window.setTimeout(function () {
        block._playWaitTimer = 0;
        if (block.dataset.playToken !== String(token) || !button.isConnected) return;
        showTrackPlayLoading(block, button);
    }, 400);
    block._playGiveUp = window.setTimeout(function () {
        if (block.dataset.playToken !== String(token)) return;
        clearTrackPlayUi(block);
    }, 12000);
}

function showTrackPlayLoading(block, button) {
    button.classList.add('is-loading');
    button.setAttribute('aria-busy', 'true');
    lockPlaybackScroll();
}

function clearTrackPlayUi(block) {
    if (!block) return;
    window.clearTimeout(block._playWaitTimer);
    window.clearTimeout(block._playGiveUp);
    block._playWaitTimer = 0;
    block._playGiveUp = 0;
    block.classList.remove('is-playLocked');
    block.querySelectorAll('.trackPlay').forEach(function (item) {
        item.classList.remove('is-loading');
        item.removeAttribute('aria-busy');
        item.disabled = false;
    });
    unlockPlaybackScroll();
}

function finishTrackPlay(block) {
    if (!block) return;
    block.dataset.playToken = String((Number(block.dataset.playToken) || 0) + 1);
    clearTrackPlayUi(block);
}

function sameTrackUri(left, right) {
    if (!left || !right) return false;
    if (left === right) return true;
    return left.split(':').pop() === right.split(':').pop();
}

function noteTrackProgress(host, data) {
    const uri = host && host.dataset.spotifyUri;
    if (!uri || !data || !sameTrackUri(data.playingURI, uri)) return;
    clearTrackSwitch(host);
    if (data.isPaused === false && !data.isBuffering) {
        host._heardUri = uri;
        host._playNudges = 0;
        host._playGiveUp = false;
        finishTrackPlay(host.closest('.trackBlock'));
        return;
    }
    if (host._heardUri === uri || host._playGiveUp) return;
    if (data.isPaused === false && data.isBuffering) return;
    if (data.isPaused !== true && !data.isBuffering) return;
    if (latestMediaElement() !== host || !host._controller) return;
    const now = Date.now();
    if (now - (host._playNudgeAt || 0) < 500) return;
    if ((host._playNudges || 0) >= 24) {
        host._playGiveUp = true;
        return;
    }
    host._playNudges = (host._playNudges || 0) + 1;
    host._playNudgeAt = now;
    const requestToken = host._requestToken;
    window.setTimeout(function () {
        if (!host.isConnected || host._requestToken !== requestToken || host._heardUri === uri) return;
        if (latestMediaElement() !== host) return;
        startRequestedPlayback(host._controller, host);
    }, 0);
}

function playTrackSelection(button) {
    const block = button.closest('.trackBlock');
    const host = block && block.querySelector('.spotifyHost');
    const trackId = button.dataset.trackId;
    if (!host || !trackId || button.disabled) return;
    const row = button.closest('.trackRow');
    block.querySelectorAll('.trackRow').forEach(function (item) {
        item.classList.toggle('is-current', item === row);
    });
    cancelLikedQueue(host);
    host.dataset.autoplay = '1';
    holdCliPosition();
    beginTrackPlayWait(block, button);
    playSpotifyUri(host, 'spotify:track:' + trackId);
}

function scheduleLikedQueue(host, delay) {
    clearTimeout(host._queueTimer);
    const generation = (host._queueGeneration || 0) + 1;
    host._queueGeneration = generation;
    host._queueDue = Date.now() + delay;
    host._queueTimer = setTimeout(function () {
        if (host._queueGeneration !== generation || !host.isConnected) return;
        host._queueDue = 0;
        host._queueTimer = 0;
        playNextLiked(host);
    }, delay);
}

function cancelLikedQueue(host) {
    clearTimeout(host._queueTimer);
    host._queueTimer = 0;
    host._queueDue = 0;
    host._reachedEnd = false;
    host._queueGeneration = (host._queueGeneration || 0) + 1;
}

function activeTrackBlock(host) {
    return host && host.closest('.trackBlock');
}

function watchLikedQueue(host, data) {
    if (!host || !host.isConnected || !activeTrackBlock(host)) return;
    if (data && data.playingURI && host.dataset.spotifyUri && !sameTrackUri(data.playingURI, host.dataset.spotifyUri)) return;
    if (host._queueAdvancing && (!data || data.isPaused !== false)) return;
    const duration = Number(data && data.duration) || 0;
    const position = Number(data && data.position) || 0;
    const playing = !!(data && data.isPaused === false);
    if (playing && duration >= 2000) {
        if (position >= Math.max(0, duration - 3000)) host._reachedEnd = true;
        scheduleLikedQueue(host, Math.max(0, duration - position) + 800);
        return;
    }
    if (!data || data.isPaused !== true) return;
    const atEnd = host._reachedEnd || (duration >= 2000 && position >= duration - 1500);
    const dueSoon = host._queueDue && host._queueDue - Date.now() < 2500;
    if (atEnd || dueSoon) {
        host._reachedEnd = false;
        scheduleLikedQueue(host, 400);
        return;
    }
    cancelLikedQueue(host);
}

function playNextLiked(host) {
    const block = activeTrackBlock(host);
    if (!block || latestMediaElement() !== host) return;
    const current = block.querySelector('.trackRow.is-current');
    const next = current ? current.nextElementSibling : null;
    const button = next && next.querySelector('.trackPlay');
    cancelLikedQueue(host);
    if (!button) return;
    host._queueAdvancing = true;
    playTrackSelection(button);
    setTimeout(function () {
        host._queueAdvancing = false;
    }, 2500);
}

function scheduleTrackSwitch(host) {
    clearTrackSwitch(host);
    const token = host._requestToken;
    const uri = host.dataset.spotifyUri;
    const controller = host._controller;
    let tries = 0;
    const tick = function () {
        host._switchTimer = 0;
        try {
            if (!host.isConnected || !host.ownerDocument || !host.ownerDocument.defaultView) return;
            if (host._requestToken !== token || !controller || host._controller !== controller) return;
            if (host._heardUri === uri) return;
            if (host._reportedUri && sameTrackUri(host._reportedUri, uri)) {
                startRequestedPlayback(controller, host);
                return;
            }
            tries += 1;
            if (tries <= 4 && typeof controller.loadUri === 'function') {
                try { controller.loadUri(uri); } catch (error) {}
            }
            // The live controller starts the track on play(). The test double sets pendingUri until that load finishes.
            if (!controller.pendingUri) {
                try { controller.play(); } catch (error) {}
            }
            if (tries >= 6) return;
            host._switchTimer = setTimeout(tick, 500);
        } catch (error) {}
    };
    host._switchTimer = setTimeout(tick, 700);
}

function playSpotifyUri(host, uri) {
    const previous = host.dataset.spotifyUri || '';
    const switching = !!(previous && previous !== uri);
    host.dataset.spotifyUri = uri;
    host.dataset.autoplay = '1';
    host.dataset.playback = '';
    if (host._heardUri !== uri) {
        host._heardUri = '';
        host._playNudges = 0;
        host._playGiveUp = false;
    }
    host._requestToken = (host._requestToken || 0) + 1;
    if (host._controller) host._controller._requestToken = host._requestToken;
    if (switching) {
        host._switchToken = (host._switchToken || 0) + 1;
        host._stuckUri = '';
    }
    if (switching && host._controller && typeof host._controller.loadUri === 'function') {
        try {
            host._controller._awaitingPause = false;
            host._controller._ignorePlayUntil = 0;
            host._controller.pause();
            host._controller.loadUri(uri);
            host._controller._requestToken = host._requestToken;
            scheduleTrackSwitch(host);
            return;
        } catch (error) {}
    }
    if (switching && host._controller) {
        replaceSpotifyController(host);
        return;
    }
    if (host._controller && typeof host._controller.loadUri === 'function') {
        try {
            host._controller.loadUri(uri);
            startRequestedPlayback(host._controller, host);
            return;
        } catch (error) {}
    }
    if (host.dataset.mounted === 'plain') {
        const iframe = host.querySelector('iframe');
        if (iframe) {
            iframe.dataset.loaded = '';
            iframe.src = embedUrlFromUri(uri);
            return;
        }
    }
    if (!host.dataset.mounted) mountSpotifyHost(host);
}

function normalizeTrackText(value) {
    return String(value || '').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function matchLikedTrack(query, catalog) {
    const wanted = normalizeTrackText(query);
    if (!wanted || wanted.length < 2 || !catalog || !catalog.length) return null;
    const exact = [];
    catalog.forEach(function (track) {
        if (!track || !track.id) return;
        const name = normalizeTrackText(track.name);
        if (!name) return;
        const artist = normalizeTrackText(track.artist);
        if (name === wanted || (name + ' ' + artist).trim() === wanted || (artist + ' ' + name).trim() === wanted) exact.push(track);
    });
    if (exact.length === 1) return exact[0];
    if (exact.length > 1) {
        const namedArtist = exact.filter(function (track) {
            const artist = normalizeTrackText(track.artist);
            return artist && wanted.indexOf(artist) !== -1;
        });
        if (namedArtist.length === 1) return namedArtist[0];
        return null;
    }
    if (wanted.length < 4) return null;
    const partial = catalog.filter(function (track) {
        const name = normalizeTrackText(track && track.name);
        return track && track.id && name && (name.indexOf(wanted) !== -1 || wanted.indexOf(name) === 0);
    });
    return partial.length === 1 ? partial[0] : null;
}

async function findNamedTrack(query) {
    if (likedCatalog) {
        const local = matchLikedTrack(query, likedCatalog);
        if (local) return local;
    }
    const remote = searchSpotifyTrack(query);
    if (!likedCatalog && likedCatalogPromise) {
        const local = likedCatalogPromise.then(function (catalog) {
            return matchLikedTrack(query, catalog);
        }).catch(function () { return null; });
        const first = await Promise.race([
            local.then(function (track) { return { from: 'local', track: track }; }),
            remote.then(function (track) { return { from: 'remote', track: track }; })
        ]);
        if (first.from === 'local') return first.track || remote;
        if (first.track) return first.track;
        return local;
    }
    return remote;
}

async function playNamedSong(query) {
    pauseEveryPlayer();
    if (!query) return 'Tell me which song to play.\nExample: music Never Gonna Give You Up';
    const track = await findNamedTrack(query);
    if (!track) return 'Couldn\'t find "' + escapeHtml(query) + '" on Spotify.';
    return escapeHtml(trackLabel(track)) + '\n' + spotifyHostMarkup('spotify:track:' + track.id, true);
}

async function searchSpotifyTrack(query) {
    const key = normalizeTrackText(query);
    if (key && trackSearchCache.has(key)) return trackSearchCache.get(key);
    const token = await fetchSpotifyToken();
    const variables = {
        query: query,
        limit: 10,
        numberOfTopResults: 10,
        offset: 0,
        includeAuthors: false,
        includeAlbumPreReleases: false,
        includeEpisodeContentRatingsV2: false
    };
    const extensions = { persistedQuery: { version: 1, sha256Hash: SEARCH_QUERY_HASH } };
    const params = new URLSearchParams({
        operationName: 'searchSuggestions',
        variables: JSON.stringify(variables),
        extensions: JSON.stringify(extensions)
    });
    const response = await fetch('https://api-partner.spotify.com/pathfinder/v1/query?' + params, {
        headers: {
            Accept: 'application/json',
            Authorization: 'Bearer ' + token
        }
    });
    if (!response.ok) throw new Error('search failed');
    const payload = await response.json();
    const hits = payload.data && payload.data.searchV2 && payload.data.searchV2.topResultsV2
        ? payload.data.searchV2.topResultsV2.itemsV2 || []
        : [];
    for (let i = 0; i < hits.length; i++) {
        const item = hits[i] && hits[i].item;
        const data = item && item.data;
        if (!item || item.__typename !== 'TrackResponseWrapper' || !data || !data.uri) continue;
        if (data.playability && data.playability.playable === false) continue;
        const artists = data.artists && data.artists.items ? data.artists.items : [];
        const track = {
            id: data.uri.split(':').pop(),
            name: data.name || '',
            artist: artists.map(function (artist) {
                return artist.profile && artist.profile.name ? artist.profile.name : '';
            }).filter(Boolean).join(', ')
        };
        if (key) trackSearchCache.set(key, track);
        return track;
    }
    return null;
}

async function renderChangelog() {
    const response = await fetch('changelog.md', { cache: 'no-cache' });
    if (!response.ok) throw new Error('changelog');
    const markdown = await response.text();
    const html = markdown.split(/\r?\n/).map(function (line) {
        if (line.indexOf('## ') === 0) return '<div class="changelogVersion">' + escapeHtml(line.slice(3)) + '</div>';
        if (line.indexOf('### ') === 0) return '<div class="changelogSection">' + escapeHtml(line.slice(4)) + '</div>';
        if (line.indexOf('- ') === 0) return '<div class="changelogItem">' + escapeHtml(line.slice(2)) + '</div>';
        if (line.indexOf('# ') === 0) return '<div>' + escapeHtml(line.slice(2)) + '</div>';
        if (!line.trim()) return '';
        return '<div>' + escapeHtml(line) + '</div>';
    }).join('');
    return '<div class="changelogText">' + html + '</div>';
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
