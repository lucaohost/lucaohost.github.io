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
        inputField.textContent = '';
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
        if (awaitingPassword && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
            event.preventDefault();
            return;
        }
        if (inputField.tagName === 'INPUT' && !event.ctrlKey && !event.metaKey && !event.altKey) {
            if (event.key === 'Backspace') {
                event.preventDefault();
                deleteTerminalChar();
                return;
            }
            if (event.key && event.key.length === 1) {
                event.preventDefault();
                insertTerminalChar(event.key);
                return;
            }
        }
        if (navigateHistory(event)) return;
        onEnter(event);
    });
    inputField.addEventListener('input', notePasswordEdit);
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
    share: '<button type="button" class="shareButton"><span class="shareIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="6.2" cy="12" r="2.15" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.2" cy="6.6" r="2.15" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.2" cy="17.4" r="2.15" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8.2 11.1 15.1 7.6M8.3 13.1l6.7 3.2" fill="none" stroke="currentColor" stroke-width="1.7"/></svg></span><span class="shareCopy"><span class="shareTitle">Share this site</span><span class="shareUrl">lucaohost.github.io</span></span></button>',
    rmy: "Random Music on Youtube:\n<a href='https://lucaohost.github.io/rmy' target='_blank'>https://lucaohost.github.io/rmy</a>",
    rms: "Random Music on Spotify:\n<a href='https://lucaohost.github.io/rms' target='_blank'>https://lucaohost.github.io/rms</a>",
    rmym: "Random Music on Youtube Music:\n<a href='https://lucaohost.github.io/rmym' target='_blank'>https://lucaohost.github.io/rmym</a>",
    youtube: "<a href='https://youtube.com/@lucasreginatto721' target='_blank'>https://youtube.com/lucaohost</a>",
    lucaohost: "<p style='text-align: justify;'>Lucão is my Brazilian nickname, lucaohost is a programmer's joke since sounds like <a class='localhostExplanation'>localhost</a>.</p>",
    'localhost?': "<p style='text-align: justify;'><a href='https://en.wikipedia.org/wiki/Localhost' target='_blank'>localhost</a> is the local computer’s hostname, resolving to IP 127.0.0.1.</p>",
    'rickrolled?': `<p style='text-align: justify;'><a href='https://en.wikipedia.org/wiki/Rickrolling' target='_blank'>Rickrolling</a> is a meme where Rick’s song <a href='https://www.youtube.com/watch?v=dQw4w9WgXcQ' target='_blank'>Never Gonna Give You Up</a> appears unexpectedly.</p>`,
    social: function () {
        const rows = [
            ['GitHub', 'https://github.com/lucaohost', 'lucaohost', 'https://cdn-icons-png.flaticon.com/512/733/733553.png'],
            ['LinkedIn', 'https://linkedin.com/in/lucas-reginatto-de-lima', 'lucaohost', 'https://cdn-icons-png.flaticon.com/512/174/174857.png'],
            ['YouTube', 'https://youtube.com/@lucasreginatto721', 'lucaohost', 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png'],
            ['Spotify', 'https://open.spotify.com/playlist/2kO4SQsSzH2wYMkNB9lVEC', 'liked songs', 'https://cdn-icons-png.flaticon.com/512/174/174872.png']
        ];
        return '<ul class="socialList">' + rows.map(function (row) {
            return '<li><a class="socialLink" href="' + row[1] + '" target="_blank" rel="noopener"><img src="' + row[3] + '" alt="" width="28" height="28"><span class="socialCopy"><span class="socialName">' + row[0] + '</span><span class="socialHandle">' + row[2] + '</span></span></a></li>';
        }).join('') + '</ul>';
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
            'install', "Add this site to your home screen.",
            'music', "Random Liked Song.<br>Press Enter with nothing typed to play one.",
            'music song', "Play a Spotify song by name.",
            'list', "Randomized songs. Play from the list.",
            'liked', "100 newest liked songs, one after another.",
            'changelog', "Updates and dates.",
            'rick', "Type and find out.",
            'tgif', "Thank God It's Friday!",
            'kali', "Kali Linux photo.",
            'snooker', "Snooker Scoreboard.",
            'help', "Show all Commands.",
            'login', "Sign in as Lucas.",
            'logout', "End the session.",
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
    exit: function () {
        closeBrowserTab();
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
    'clear visitor music': function () {
        return clearVisitorMusic();
    },
    login: function () {
        if (typeof SiteSession !== 'undefined' && SiteSession.isOperator()) return 'Already signed in.';
        awaitingPassword = true;
        passwordDraft = '';
        const address = typeof SiteSession !== 'undefined'
            ? SiteSession.emailFor(SiteSession.OPERATOR)
            : 'lucas@lucaohost.app';
        return 'Type the password for ' + address;
    },
    logout: function () {
        if (typeof SiteSession === 'undefined' || !SiteSession.email()) return 'Not signed in.';
        return SiteSession.signOut().then(function () {
            playedMusicState = null;
            musicStoreKey = '';
            syncTerminalIdentity();
            return 'Signed out.';
        });
    },
    install: function () {
        return installSite();
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

function placeBlockCaret() {
    const caret = document.querySelector('.block-caret');
    if (!caret) return;
    if (!inputField || isMobileCli()) {
        caret.hidden = true;
        return;
    }
    const active = document.activeElement === inputField;
    caret.hidden = !active;
    if (!active) return;
    const line = inputField.closest('.input-line') || inputField.parentElement;
    const lineRect = line.getBoundingClientRect();
    const inputRect = inputField.getBoundingClientRect();
    let left = inputRect.left;
    let top = inputRect.top;
    const selection = window.getSelection();
    if (selection && selection.rangeCount && inputField.contains(selection.anchorNode)) {
        try {
            const range = selection.getRangeAt(0).cloneRange();
            range.collapse(true);
            const rects = typeof range.getClientRects === 'function' ? range.getClientRects() : [];
            const rect = rects.length ? rects[0] : (typeof range.getBoundingClientRect === 'function' ? range.getBoundingClientRect() : null);
            if (rect && rect.left) {
                left = rect.left;
                if (rect.top) top = rect.top;
            }
        } catch (error) {}
    }
    caret.style.left = (left - lineRect.left) + 'px';
    caret.style.top = (top - lineRect.top) + 'px';
}

function bindBlockCaret() {
    if (!inputField || inputField.dataset.caretBound) return;
    inputField.dataset.caretBound = '1';
    ['keyup', 'click', 'focus', 'input'].forEach(function (type) {
        inputField.addEventListener(type, placeBlockCaret);
    });
    inputField.addEventListener('blur', placeBlockCaret);
    document.addEventListener('selectionchange', placeBlockCaret);
}

document.addEventListener('DOMContentLoaded', function() {
    appendOutput('Welcome to my online terminal!\nType "help" to see all commands.');
    loadLikedCatalog().catch(function () {});
    bindTerminalChrome();
    bindBlockCaret();
    if (!isMobileCli()) inputField.focus();
});
bindBlockCaret();

document.addEventListener('click', function (event) {
    const link = event.target.closest && event.target.closest('.socialLink, .trackRadio');
    if (!link) return;
    if (link.dataset.suppressClick === '1') {
        event.preventDefault();
        delete link.dataset.suppressClick;
        return;
    }
    if (!link.classList.contains('trackRadio')) return;
    const href = link.getAttribute('href') || '';
    if (href.indexOf('https://open.spotify.com/track/') === 0) return;
    event.preventDefault();
    if (link.dataset.radioOpening === '1') return;
    link.dataset.radioOpening = '1';
    lookupSongRadio(link.dataset.trackId).then(function (next) {
        delete link.dataset.radioOpening;
        if (!next || !link.isConnected) return;
        link.href = next;
        window.open(next, '_blank', 'noopener');
    });
}, true);

document.addEventListener('click', function(event) {
    const selection = window.getSelection().toString();
    if (!isMobileCli() && !selection && !event.target.closest('.nextMusic, .terminal-bar, .trackBlock, .loginForm, .socialList, .trackRadio')) {
        inputField.focus();
    }
});


function closeBrowserTab() {
    window.close();
}

async function processCommand(input) {
    if (!awaitingPassword && String(input || '').trim().toLocaleLowerCase() === 'exit') {
        closeBrowserTab();
        return;
    }
    if (typeof SiteSession !== 'undefined' && SiteSession.whenReady && !SiteSession.settled()) {
        await SiteSession.whenReady();
        syncTerminalIdentity();
    }
    if (awaitingPassword) {
        var secret = passwordDraft || input;
        passwordDraft = '';
        awaitingPassword = false;
        submitTerminalPassword(secret);
        return;
    }
    const command = input.trim().toLocaleLowerCase();
    const namedMusic = command.startsWith('music ') ? input.trim().replace(/^music\s+/i, '').trim() : '';
        const runner = commands[command] ? command : (namedMusic ? 'music-search' : '');
    if (runner) {
        const searching = runner === 'music-search';
        const wait = (searching || commandNeedsWait(command))
            ? beginSlowCommandWait(searching ? 'Searching Spotify…' : commandWaitLabel(command))
            : null;
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
        const corrected = correctCommandTypo(input);
        if (corrected) {
            appendOutput('I think you meant "' + escapeHtml(corrected) + '". Running it…');
            return processCommand(corrected);
        }
        appendOutput(`Command "${escapeHtml(input)}" not found.\n${commands.helpDesc}`);
    }
}

const commonCommandTypos = {
    hlep: 'help',
    hepl: 'help',
    heelp: 'help',
    whomai: 'whoami',
    whaomi: 'whoami',
    guthib: 'github',
    linkedn: 'linkedin',
    spotfy: 'spotify',
    instragram: 'instagram',
    twtiter: 'twitter',
    yotube: 'youtube',
    lucahost: 'lucaohost',
    'locahost?': 'localhost?',
    socail: 'social',
    soical: 'social',
    sahre: 'share',
    shrae: 'share',
    msuic: 'music',
    muisc: 'music',
    musci: 'music',
    liekd: 'liked',
    lsit: 'list',
    lits: 'list',
    chagnelog: 'changelog',
    chnageolg: 'changelog',
    snoker: 'snooker',
    snokker: 'snooker',
    logni: 'login',
    lgoin: 'login',
    logotu: 'logout',
    lgout: 'logout',
    claer: 'clear',
    clera: 'clear',
    exti: 'exit'
};

function commandDistance(left, right) {
    const rows = left.length + 1;
    const cols = right.length + 1;
    const matrix = Array.from({ length: rows }, function () {
        return Array(cols).fill(0);
    });
    for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
    for (let col = 0; col < cols; col += 1) matrix[0][col] = col;
    for (let row = 1; row < rows; row += 1) {
        for (let col = 1; col < cols; col += 1) {
            const cost = left[row - 1] === right[col - 1] ? 0 : 1;
            matrix[row][col] = Math.min(
                matrix[row - 1][col] + 1,
                matrix[row][col - 1] + 1,
                matrix[row - 1][col - 1] + cost
            );
            if (
                row > 1 &&
                col > 1 &&
                left[row - 1] === right[col - 2] &&
                left[row - 2] === right[col - 1]
            ) {
                matrix[row][col] = Math.min(matrix[row][col], matrix[row - 2][col - 2] + 1);
            }
        }
    }
    return matrix[left.length][right.length];
}

function closestCommandTypo(value) {
    if (commonCommandTypos[value]) return commonCommandTypos[value];
    const candidates = Object.keys(commands).filter(function (name) {
        return name !== 'helpDesc';
    }).map(function (name) {
        return { name: name, distance: commandDistance(value, name) };
    });
    const bestDistance = Math.min.apply(null, candidates.map(function (candidate) {
        return candidate.distance;
    }));
    const limit = value.length >= 8 ? 2 : 1;
    const nearest = candidates.filter(function (candidate) {
        return candidate.distance === bestDistance && candidate.distance <= limit;
    });
    return nearest.length === 1 ? nearest[0].name : '';
}

function correctCommandTypo(input) {
    const raw = String(input || '').trim();
    const normalized = raw.toLocaleLowerCase().replace(/\s+/g, ' ');
    if (!normalized) return '';
    if (commands[normalized]) return normalized;
    const firstSpace = normalized.indexOf(' ');
    if (firstSpace > 0) {
        const prefix = normalized.slice(0, firstSpace);
        const query = raw.slice(raw.search(/\s/) + 1).trim();
        if (query && prefix !== 'music' && commandDistance(prefix, 'music') <= 1) {
            return 'music ' + query;
        }
    }
    return closestCommandTypo(normalized);
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
        closeBrowserTab();
    });
    const installButton = bar.querySelector('.term-install');
    if (installButton) {
        installButton.addEventListener('click', function () {
            const result = installSite();
            if (result && typeof result.then === 'function') {
                result.then(function (text) { if (text) appendOutput(text); });
                return;
            }
            if (result) appendOutput(result);
        });
    }
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

var awaitingPassword = false;
var passwordDraft = '';
var maskingPassword = false;

function notePasswordEdit() {
    if (!awaitingPassword || maskingPassword || !inputField) return;
    var shown = readCommand().replace(/\n/g, '');
    var extra = shown.replace(/•/g, '');
    if (extra) passwordDraft += extra;
    else if (shown.length < passwordDraft.length) passwordDraft = passwordDraft.slice(0, shown.length);
    var masked = '•'.repeat(passwordDraft.length);
    if (shown === masked) return;
    maskingPassword = true;
    setCommandText(masked);
    maskingPassword = false;
}

function submitTerminalPassword(secret) {
    awaitingPassword = false;
    passwordDraft = '';
    clearCommand();
    if (!secret) {
        appendOutput('Login cancelled.');
        return;
    }
    if (typeof SiteSession === 'undefined') {
        appendOutput('Auth indisponível.');
        return;
    }
    SiteSession.signIn('lucas', secret).then(function () {
        appendOutput('Signed in as lucas' + SiteSession.DOMAIN);
        syncTerminalIdentity();
    }).catch(function (err) {
        appendOutput((err && err.message) || 'Could not sign in.');
    });
}

function signedInTerminal() {
    return typeof SiteSession !== 'undefined' && SiteSession.isOperator();
}

function commandPromptHtml() {
    return '<span class="path">' + (signedInTerminal() ? 'lucas@bash:~$' : 'lucaohost@bash:~$') + '</span>';
}

function syncTerminalIdentity() {
    if (typeof rememberMusicStore === 'function') rememberMusicStore();
    var signed = signedInTerminal();
    var prompt = document.querySelector('.input-line .path');
    if (prompt) prompt.textContent = (signed ? 'lucas@bash:~$' : 'lucaohost@bash:~$') + '\u00a0';
    var title = document.querySelector('.terminal-title');
    if (title) title.textContent = signed ? 'lucas@bash: ~' : 'lucaohost@bash: ~';
}

if (typeof SiteSession !== 'undefined') {
    SiteSession.watch(syncTerminalIdentity);
    if (SiteSession.whenReady) SiteSession.whenReady().then(syncTerminalIdentity);
}

function runEnteredCommand(input) {
    var command = input || 'music';
    appendOutput(commandPromptHtml() + ' ' + command);
    pushHistory(command);
    processCommand(command);
}

function onEnter(event) {
    if (commandInputLocked) {
        if (event.preventDefault) event.preventDefault();
        return;
    }
    if (event.key === 'Enter') {
        event.preventDefault();
        if (awaitingPassword) {
            var secret = passwordDraft;
            passwordDraft = '';
            awaitingPassword = false;
            appendOutput('<span class="path">Password:</span> ' + (secret ? '••••' : ''));
            clearCommand();
            submitTerminalPassword(secret);
            return;
        }
        const input = readCommand().trim();
        clearCommand();
        if (typeof SiteSession !== 'undefined' && SiteSession.whenReady && !SiteSession.settled()) {
            SiteSession.whenReady().then(function () {
                syncTerminalIdentity();
                runEnteredCommand(input);
            });
            return;
        }
        runEnteredCommand(input);
    }
}

bindInputEvents();
inputEventsReady = true;

function terminalTypingTarget(node) {
    if (!node) return false;
    if (node === inputField) return true;
    return !!(node.closest && node.closest('.input-line'));
}

function foreignTypingTarget(node) {
    if (!node || node === document.body || node === document.documentElement) return false;
    const tag = node.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    return !!(node.isContentEditable && node !== inputField);
}

function revealTerminalCursor() {
    const view = typeof cliView === 'function' ? cliView() : null;
    if (view) view.scrollTop = view.scrollHeight;
    const line = document.querySelector('.input-line');
    if (line && typeof line.scrollIntoView === 'function') {
        try { line.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (error) {
            try { line.scrollIntoView(); } catch (ignore) {}
        }
    }
    if (inputField && typeof inputField.focus === 'function') {
        try { inputField.focus({ preventScroll: true }); } catch (error) {
            try { inputField.focus(); } catch (ignore) {}
        }
    }
    if (typeof placeBlockCaret === 'function') placeBlockCaret();
}

function insertTerminalChar(char) {
    if (!inputField || !char) return;
    if (inputField.tagName === 'INPUT') {
        inputField.value += char;
    } else {
        inputField.textContent = (inputField.textContent || '') + char;
        placeCaretAtEnd(inputField);
    }
    syncMobileInputWidth();
    notePasswordEdit();
    placeBlockCaret();
}

function deleteTerminalChar() {
    if (!inputField) return;
    if (inputField.tagName === 'INPUT') {
        inputField.value = inputField.value.slice(0, -1);
    } else {
        inputField.textContent = (inputField.textContent || '').slice(0, -1);
        placeCaretAtEnd(inputField);
    }
    syncMobileInputWidth();
    notePasswordEdit();
    placeBlockCaret();
}

document.addEventListener('keydown', function (event) {
    if (event.defaultPrevented || commandInputLocked) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (terminalTypingTarget(event.target) || foreignTypingTarget(event.target)) return;
    const key = event.key;
    if (!key || (key.length !== 1 && key !== 'Enter' && key !== 'Backspace')) return;
    event.preventDefault();
    revealTerminalCursor();
    if (key === 'Enter') {
        onEnter({ key: 'Enter', preventDefault: function () {} });
        return;
    }
    if (key === 'Backspace') {
        deleteTerminalChar();
        return;
    }
    insertTerminalChar(key);
}, true);

window.addEventListener('blur', function () {
    setTimeout(function () {
        const active = document.activeElement;
        if (!active || active.tagName !== 'IFRAME') return;
        try { active.blur(); } catch (error) {}
        revealTerminalCursor();
    }, 0);
});

var deferredInstall = null;

window.addEventListener('beforeinstallprompt', function (event) {
    if (event && event.preventDefault) event.preventDefault();
    deferredInstall = event;
});

function installSite() {
    const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    if (standalone || window.navigator.standalone) return 'This site is already on your home screen.';
    if (deferredInstall && typeof deferredInstall.prompt === 'function') {
        const pending = deferredInstall;
        deferredInstall = null;
        return Promise.resolve().then(function () {
            return pending.prompt();
        }).then(function () {
            return pending.userChoice || { outcome: 'dismissed' };
        }).then(function (choice) {
            if (choice && choice.outcome === 'accepted') return 'Added to your home screen.';
            return 'Install dismissed.';
        }).catch(function () {
            return 'Open the browser menu and choose Install app or Add to Home Screen.';
        });
    }
    if (/iphone|ipad|ipod/i.test(navigator.userAgent || '')) {
        return 'On iPhone or iPad: tap Share, then Add to Home Screen.';
    }
    return 'Open the browser menu and choose Install app or Add to Home Screen.';
}

if (navigator.serviceWorker && typeof navigator.serviceWorker.register === 'function') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
}

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
    if (control.classList.contains('trackPlay') || control.classList.contains('nextMusic') || control.classList.contains('socialLink') || control.classList.contains('trackRadio') || control.classList.contains('commandRun')) {
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
    if (gesture.button.classList.contains('socialLink') || gesture.button.classList.contains('trackRadio')) {
        event.preventDefault();
        armSuppressClick(gesture.button);
        if (!dragged) window.open(gesture.button.href, gesture.button.target || '_blank', 'noopener');
        focusCliInput();
        return;
    }
    if (gesture.button.classList.contains('nextMusic')) {
        event.preventDefault();
        armSuppressClick(gesture.button);
        startNextMusic();
        focusCliInput();
        return;
    }
    if (gesture.button.classList.contains('commandRun')) {
        event.preventDefault();
        armSuppressClick(gesture.button);
        runListedCommand(gesture.button.getAttribute('data-command'));
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
            notePasswordEdit();
            keyboardTap();
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
                notePasswordEdit();
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
        notePasswordEdit();
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

    function keyboardTap() {
        const vibrate = navigator.vibrate;
        if (typeof vibrate !== 'function') return;
        try { vibrate.call(navigator, 15); } catch (error) {}
    }

    function pressKey(keyButton, allowRepeat) {
        clearTimeout(releaseTimer);
        if (pressedButton && pressedButton !== keyButton) pressedButton.classList.remove('is-pressed');
        pressedButton = keyButton;
        keyButton.classList.add('is-pressed');
        keyboardTap();
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
        rowItems.forEach(function (item, index) {
            const content = index === 0 && item !== '-' ? commandRunButton(item) : item;
            table += `
                <td style="border: 2px solid black; padding: 3px; padding-left: 10px; text-align: left; color: white;">${content}</td>`;
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
var VISITOR_MUSIC_URL = 'https://snooker-scoreboard2-default-rtdb.firebaseio.com/seasons/cli/visitorMusic';
var musicStoreKey = '';
var musicReadTicket = 0;

function musicStoreUrl() {
    const url = (typeof SiteSession !== 'undefined' && SiteSession.isOperator()) ? PLAYED_MUSIC_URL : VISITOR_MUSIC_URL;
    if (musicStoreKey !== url) {
        musicStoreKey = url;
        playedMusicState = null;
        musicReadTicket++;
    }
    return url;
}

function rememberMusicStore() {
    if (!musicStoreKey) return;
    const url = (typeof SiteSession !== 'undefined' && SiteSession.isOperator()) ? PLAYED_MUSIC_URL : VISITOR_MUSIC_URL;
    if (musicStoreKey !== url) {
        musicStoreKey = '';
        playedMusicState = null;
        musicReadTicket++;
    }
}
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

function commandRunButton(name) {
    const label = escapeHtml(name);
    return '<button type="button" class="commandRun" data-command="' + label + '">' + label + '</button>';
}

function settleListedCommand() {
    if (!inputField || isMobileCli()) return;
    try { inputField.focus(); } catch (error) {}
    if (inputField.tagName !== 'INPUT') placeCaretAtEnd(inputField);
    placeBlockCaret();
}

function runListedCommand(name) {
    const command = String(name || '').trim();
    if (!command || commandInputLocked || awaitingPassword) return;
    appendOutput(commandPromptHtml() + ' ' + escapeHtml(command));
    pushHistory(command);
    if (command === 'music song') {
        setCommandText('music ');
        settleListedCommand();
        return;
    }
    clearCommand();
    settleListedCommand();
    processCommand(command);
}

function guardedPressButton(target) {
    return target && target.closest && target.closest('.trackPlay, .nextMusic, .trackRadio, .commandRun');
}

function startNextMusic() {
    const run = function () {
        appendOutput(commandPromptHtml() + ' next music');
        processCommand('next music');
        clearCommand();
    };
    if (typeof SiteSession !== 'undefined' && SiteSession.whenReady && !SiteSession.settled()) {
        SiteSession.whenReady().then(function () {
            syncTerminalIdentity();
            run();
        });
        return;
    }
    run();
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
    const commandButton = event.target.closest('.commandRun');
    if (commandButton) {
        event.preventDefault();
        event.stopPropagation();
        if (commandButton.dataset.suppressClick === '1') {
            delete commandButton.dataset.suppressClick;
            return;
        }
        runListedCommand(commandButton.getAttribute('data-command'));
        return;
    }
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

function trackIdFrom(value) {
    return String(value || '').split(':').pop();
}

function songRadioHref(trackId, playlistId) {
    const track = encodeURIComponent(trackIdFrom(trackId));
    const playlist = trackIdFrom(playlistId);
    const medium = isMobileCli() ? 'mobile' : 'desktop';
    return 'https://open.spotify.com/track/' + track
        + '?go=1&utm_source=embed_player_p&utm_medium=' + medium
        + '&play=true&context=' + encodeURIComponent('spotify:playlist:' + playlist);
}

const songRadioLookups = new Map();

function lookupSongRadio(trackId) {
    const id = trackIdFrom(trackId);
    if (!id) return Promise.resolve('');
    if (songRadioLookups.has(id)) return songRadioLookups.get(id);
    const pending = fetchSongRadioPlaylistId(id).then(function (playlistId) {
        return playlistId ? songRadioHref(id, playlistId) : '';
    }).catch(function () {
        songRadioLookups.delete(id);
        return '';
    });
    songRadioLookups.set(id, pending);
    return pending;
}

async function fetchSongRadioPlaylistId(trackId) {
    const token = await fetchSpotifyToken();
    const seed = encodeURIComponent('spotify:track:' + trackId);
    const response = await fetch('https://spclient.wg.spotify.com/inspiredby-mix/v2/seed_to_playlist/' + seed + '?response-format=json', {
        headers: {
            Accept: 'application/json',
            Authorization: 'Bearer ' + token
        }
    });
    if (!response.ok) throw new Error('song radio');
    const payload = await response.json();
    const item = payload && payload.mediaItems && payload.mediaItems[0];
    const uri = item && item.uri ? item.uri : '';
    if (uri.indexOf('spotify:playlist:') !== 0) throw new Error('song radio');
    return trackIdFrom(uri);
}

function armTrackRadio(radio, trackId) {
    if (!radio) return;
    const id = trackIdFrom(trackId);
    if (!id) return;
    const href = radio.getAttribute('href') || '';
    if (radio.dataset.trackId === id && href.indexOf('https://open.spotify.com/track/') === 0) return;
    radio.dataset.trackId = id;
    const token = (Number(radio.dataset.radioToken) || 0) + 1;
    radio.dataset.radioToken = String(token);
    radio.setAttribute('href', '#');
    lookupSongRadio(id).then(function (next) {
        if (!radio.isConnected || radio.dataset.radioToken !== String(token) || radio.dataset.trackId !== id) return;
        if (next) radio.href = next;
    });
}

function radioControl(trackId) {
    return '<a class="trackRadio" href="#" data-track-id="' + escapeHtml(trackIdFrom(trackId)) + '" target="_blank" rel="noopener" aria-label="Radio"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="9" width="16" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"></rect><path d="M8 9 16 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><circle cx="9" cy="14" r="1.4" fill="currentColor"></circle></svg></a>';
}

function syncTrackRadio(host) {
    const play = host && host.closest && host.closest('.musicPlay');
    const radio = play && play.querySelector('.trackRadio');
    if (!radio) return;
    armTrackRadio(radio, host.dataset.spotifyUri || radio.dataset.trackId || '');
}

function dropPlayRail(row) {
    const rail = row && row.querySelector('.playRail');
    if (rail) rail.remove();
}

function playRailMarkup(trackId, withNext) {
    return '<div class="playRail">' + radioControl(trackId) + (withNext ? nextMusicButton() : '') + '</div>';
}

function spotifyHostMarkup(uri, autoplay) {
    const autoplayAttr = autoplay ? ' data-autoplay="1"' : '';
    return `<div class="spotifyHost"${autoplayAttr} data-spotify-uri="${uri}"><div class="spotifyLoading" role="status">Loading Spotify…</div><div class="spotifyMount"></div></div>`;
}

function nextMusicButton() {
    return '<button type="button" class="nextMusic" aria-label="Next song"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 5.2v13.6L12 12z" fill="currentColor"></path><path d="M12.4 5.2v13.6L20.8 12z" fill="currentColor"></path></svg></button>';
}

function commandNeedsWait(command) {
    return command === 'list' || command === 'liked' || command === 'changelog'
        || command === 'clear music' || command === 'clear visitor music' || command === 'logout';
}

function commandWaitLabel(command) {
    if (command === 'list') return 'Loading songs…';
    if (command === 'liked') return 'Loading liked songs…';
    if (command === 'changelog') return 'Loading changelog…';
    if (command === 'clear music' || command === 'clear visitor music') return 'Clearing songs…';
    if (command === 'logout') return 'Signing out…';
    return 'Loading…';
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
    host.className = 'spotifyHost spotifyPending';
    host.dataset.autoplay = '1';
    host.innerHTML = '<div class="spotifyLoading" role="status">Loading Spotify…</div><div class="spotifyMount"></div>';
    row.appendChild(host);
    row.insertAdjacentHTML('beforeend', playRailMarkup('', true));
    slot.appendChild(row);
    terminalOutput.appendChild(slot);
    mountSpotifyHost(host);
    followCliScroll(slot);
    try {
        const trackId = await pickRandomLikedTrackId();
        if (!slot.isConnected) return;
        if (!trackId) {
            discardSpotifyHost(host);
            dropPlayRail(row);
            slot.appendChild(document.createTextNode("Couldn't load a liked song right now."));
            scrollCliToEnd();
            return;
        }
        host.dataset.spotifyUri = 'spotify:track:' + trackId;
        activateEmbeddedMedia(slot);
        scrollCliToEnd();
    } catch (error) {
        if (!slot.isConnected || host.dataset.mounted) return;
        discardSpotifyHost(host);
        dropPlayRail(row);
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
    const latest = latestMediaElement();
    if (latest && latest !== host && latest.classList && latest.classList.contains('spotifyHost') && latest.dataset.autoplay === '1') {
        silenceController(controller);
        return;
    }
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
    root.querySelectorAll('.trackRadio').forEach(function (radio) {
        const play = radio.closest('.musicPlay');
        const host = play && play.querySelector('.spotifyHost');
        armTrackRadio(radio, (host && host.dataset.spotifyUri) || radio.dataset.trackId || '');
    });
    root.querySelectorAll('.trackBlock').forEach(function (block) {
        const host = block.querySelector('.spotifyHost');
        if (!host) return;
        pinTrackPlayer(host);
        if (host.dataset.autoplay !== '1') return;
        beginTrackPlayWait(block, block.querySelector('.trackRow.is-current .trackPlay'));
    });
}

function pinTrackPlayer(host) {
    if (!host || !host.closest('.trackBlock')) return;
    terminalOutput.querySelectorAll('.spotifyHost.is-pinned').forEach(function (node) {
        if (node !== host) node.classList.remove('is-pinned');
    });
    host.classList.add('is-pinned');
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
        if (!stillReady) {
            host.classList.add('spotifyPending');
            scrollCliToEnd();
        }
    }, 400);
}

function bindSpotifyIframe(host, iframe) {
    if (!iframe || iframe.dataset.loadBound === '1') return;
    iframe.dataset.loadBound = '1';
    iframe.loading = 'eager';
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
            if (latestMediaElement() !== host || host.dataset.autoplay !== '1') {
                silenceController(controller);
            } else {
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
                if (host.dataset.autoplay !== '1') {
                    if (data.isPaused === false) {
                        try { controller.pause(); } catch (error) {}
                    }
                    return;
                }
                if (data.playingURI) host._reportedUri = data.playingURI;
                if (rejectStalePlayback(controller, host, data)) return;
                notePlayback(controller, host, data.isPaused);
                noteTrackProgress(host, data);
                watchLikedQueue(host, data);
            });
            controller.addListener('playback_started', function () {
                if (host._controller !== controller) return;
                if (host.dataset.autoplay !== '1') {
                    try { controller.pause(); } catch (error) {}
                    return;
                }
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
    const limit = 100;
    const first = await fetchPlaylistPage(token, hash, 0, limit);
    const tracks = [];
    const seen = new Set();
    function take(page) {
        page.tracks.forEach(function (track) {
            if (seen.has(track.id)) return;
            seen.add(track.id);
            tracks.push(track);
        });
    }
    take(first);
    const offsets = [];
    const total = first.total || tracks.length;
    for (let offset = limit; offset < total && offset < 2000; offset += limit) offsets.push(offset);
    const width = 4;
    for (let index = 0; index < offsets.length; index += width) {
        const pages = await Promise.all(offsets.slice(index, index + width).map(function (offset) {
            return fetchPlaylistPage(token, hash, offset, limit);
        }));
        pages.forEach(take);
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

async function pickRandomLikedTrackId(attempt) {
    const catalog = await loadLikedCatalog();
    const ids = catalog.map(function (track) { return track.id; }).filter(Boolean);
    if (!ids.length) return null;
    const store = musicStoreUrl();
    const state = await readPlayedMusic(false);
    if (!state || state.storeUrl !== store) {
        if (attempt) return null;
        return pickRandomLikedTrackId(1);
    }
    const generation = state.generation || 1;
    let remaining = ids.filter(function (id) { return state.cycle[id] !== generation; });
    let bumped = false;
    if (!remaining.length) {
        state.generation = generation + 1;
        bumped = true;
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
    const stack = pushPlayedStack(state, trackId);
    writeLocalCycle(state);
    if (bumped) writeMusicJson(store + '/generation.json', 'PUT', state.generation).catch(function () {});
    await writeMusicJson(store + '/tracks/' + trackId + '.json', 'PUT', record);
    await writeMusicJson(store + '/cycle/' + trackId + '.json', 'PUT', state.generation || 1);
    await writeMusicJson(store + '/stack.json', 'PUT', stack);
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

function deletePlayedKey(store, id) {
    writeMusicJson(store + '/tracks/' + id + '.json', 'DELETE').catch(function () {});
    writeMusicJson(store + '/cycle/' + id + '.json', 'DELETE').catch(function () {});
}

function cycleStorageKey(url) {
    return url === PLAYED_MUSIC_URL ? 'playedPositions:lucas' : 'playedPositions:visitor';
}

function readLocalCycle(url) {
    try {
        const stored = JSON.parse(localStorage.getItem(cycleStorageKey(url)));
        if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {};
        const cycle = {};
        Object.keys(stored).forEach(function (id) {
            if (isLegacyPositionKey(id)) return;
            cycle[id] = typeof stored[id] === 'number' ? stored[id] : 0;
        });
        return cycle;
    } catch (error) {}
    return {};
}

function writeLocalCycle(state) {
    const pruned = {};
    const generation = state.generation || 1;
    Object.keys(state.cycle || {}).forEach(function (id) {
        if (isLegacyPositionKey(id)) return;
        if (state.cycle[id] === generation) {
            const seq = state.tracks[id] && state.tracks[id].seq;
            pruned[id] = typeof seq === 'number' && seq > 0 ? seq : 1;
        }
    });
    localStorage.setItem(cycleStorageKey(state.storeUrl), JSON.stringify(pruned));
}

function emptyPlayedState() {
    return { tracks: {}, cycle: {}, generation: 1 };
}

async function readPlayedMusic(force, attempt) {
    const url = musicStoreUrl();
    if (playedMusicState && playedMusicState.storeUrl === url && !force) return playedMusicState;
    const ticket = ++musicReadTicket;
    const state = emptyPlayedState();
    state.storeUrl = url;
    const removed = [];
    try {
        const response = await fetch(url + '.json');
        if (ticket !== musicReadTicket) {
            if ((attempt || 0) >= 2) return playedMusicState || state;
            return readPlayedMusic(true, (attempt || 0) + 1);
        }
        if (response.ok) {
            const data = await response.json();
            if (data && data.generation) state.generation = data.generation;
            if (data && data.stack) state.stack = data.stack;
            const tracks = withoutLegacyKeys(data && data.tracks);
            const cycle = withoutLegacyKeys(data && data.cycle);
            state.tracks = tracks.kept;
            state.cycle = cycle.kept;
            tracks.removed.concat(cycle.removed).forEach(function (id) {
                if (removed.indexOf(id) === -1) removed.push(id);
            });
        }
    } catch (error) {}
    if (ticket !== musicReadTicket) {
        if ((attempt || 0) >= 2) return playedMusicState || state;
        return readPlayedMusic(true, (attempt || 0) + 1);
    }
    overlayLocalPlays(state);
    playedMusicState = state;
    removed.forEach(function (id) { deletePlayedKey(url, id); });
    return state;
}

function stackList(state) {
    const raw = state && state.stack;
    let ids = [];
    if (Array.isArray(raw)) ids = raw.slice();
    else if (raw && typeof raw === 'object') {
        ids = Object.keys(raw).filter(function (key) {
            return /^\d+$/.test(key);
        }).sort(function (a, b) {
            return Number(a) - Number(b);
        }).map(function (key) {
            return raw[key];
        });
    }
    return ids.filter(function (id) {
        return id && !isLegacyPositionKey(id);
    });
}

function tracksByNewest(state) {
    return Object.keys(state.tracks || {}).filter(function (id) {
        return !isLegacyPositionKey(id) && state.tracks[id] && typeof state.tracks[id] === 'object';
    }).map(function (id) {
        return Object.assign({ id: id }, state.tracks[id]);
    }).sort(function (a, b) {
        return (b.seq || 0) - (a.seq || 0) || trackLabel(a).localeCompare(trackLabel(b));
    });
}

function fullStack(state) {
    const seen = {};
    const ids = [];
    stackList(state).forEach(function (id) {
        if (seen[id] || !state.tracks[id] || isLegacyPositionKey(id)) return;
        seen[id] = true;
        ids.push(id);
    });
    tracksByNewest(state).forEach(function (row) {
        if (seen[row.id]) return;
        seen[row.id] = true;
        ids.push(row.id);
    });
    return ids;
}

function pushPlayedStack(state, trackId) {
    const next = [trackId].concat(fullStack(state).filter(function (id) { return id !== trackId; }));
    state.stack = next;
    return next;
}

function orderedPlayedRows(state) {
    const rows = tracksByNewest(state);
    const stack = stackList(state);
    if (!stack.length) return rows;
    const byId = {};
    rows.forEach(function (row) { byId[row.id] = row; });
    const seen = {};
    const ordered = [];
    stack.forEach(function (id) {
        if (seen[id] || !byId[id]) return;
        seen[id] = true;
        ordered.push(byId[id]);
    });
    if (ordered.length !== rows.length) return rows;
    return ordered;
}

function insertPlayedId(state, id) {
    const seq = (state.tracks[id] && state.tracks[id].seq) || 0;
    const ids = fullStack(state).filter(function (item) { return item !== id; });
    let index = 0;
    while (index < ids.length && ((state.tracks[ids[index]] && state.tracks[ids[index]].seq) || 0) > seq) index += 1;
    ids.splice(index, 0, id);
    state.stack = ids;
}

function overlayLocalPlays(state) {
    const local = readLocalCycle(state.storeUrl);
    const missing = [];
    Object.keys(local).forEach(function (id) {
        if (isLegacyPositionKey(id)) return;
        if (!state.tracks[id]) {
            const seq = typeof local[id] === 'number' ? local[id] : 0;
            state.tracks[id] = { name: '', artist: '', playedOn: '', seq: seq };
            missing.push(id);
        }
        if (state.cycle[id] !== state.generation) state.cycle[id] = state.generation;
    });
    missing.sort(function (a, b) {
        return ((state.tracks[a] && state.tracks[a].seq) || 0) - ((state.tracks[b] && state.tracks[b].seq) || 0);
    });
    missing.forEach(function (id) { insertPlayedId(state, id); });
}

function applyCatalogNames(state, catalog) {
    if (!catalog) return 0;
    catalog.forEach(function (track) {
        const saved = state.tracks[track.id];
        if (!saved || saved.name || !track.name) return;
        saved.name = track.name;
        saved.artist = track.artist || saved.artist || '';
        writeMusicJson((state.storeUrl || musicStoreUrl()) + '/tracks/' + track.id + '.json', 'PATCH', {
            name: saved.name,
            artist: saved.artist
        }).catch(function () {});
    });
    return catalog.length;
}

function playedListNeedsNames(state) {
    return Object.keys(state.tracks).some(function (id) {
        if (isLegacyPositionKey(id)) return false;
        const track = state.tracks[id];
        return track && typeof track === 'object' && !track.name;
    });
}

var listCountTicket = 0;

function schedulePlayedListFill(state) {
    const ticket = ++listCountTicket;
    const needsNames = playedListNeedsNames(state);
    loadLikedCatalog().then(function (catalog) {
        if (!catalog || !catalog.length || ticket !== listCountTicket) return;
        window.setTimeout(function () {
            if (ticket !== listCountTicket) return;
            const lists = terminalOutput.querySelectorAll('.musicList');
            const block = lists[lists.length - 1];
            if (!block) return;
            if (needsNames) {
                applyCatalogNames(state, catalog);
                const holder = document.createElement('div');
                holder.innerHTML = markupPlayedList(state, catalog.length);
                const fresh = holder.firstElementChild;
                if (!fresh) return;
                block.replaceWith(fresh);
                activateEmbeddedMedia(fresh);
                return;
            }
            const count = block.querySelector('.trackCount');
            if (!count || count.textContent.indexOf('/?') === -1) return;
            count.textContent = count.textContent.replace('/?', '/' + catalog.length);
        }, 0);
    }).catch(function () {});
}

async function renderPlayedMusic() {
    const state = await readPlayedMusic(true);
    const total = applyCatalogNames(state, likedCatalog);
    if (!total || playedListNeedsNames(state)) schedulePlayedListFill(state);
    return markupPlayedList(state, total);
}

function markupPlayedList(state, total) {
    const rows = orderedPlayedRows(state);
    const totalLabel = total ? String(total) : '?';
    const heading = '<div class="trackHeading"><span>Randomized songs</span><span class="trackCount">' + rows.length + '/' + escapeHtml(totalLabel) + '</span></div>';
    if (!rows.length) return '<div class="musicList trackBlock">' + heading + '<p class="trackEmpty">None yet.</p></div>';
    const keepCurrent = currentMusicTrackId() === rows[0].id;
    if (!keepCurrent) pauseEveryPlayer();
    const items = rows.map(function (row, index) {
        return trackRowMarkup(row, index === 0, row.playedOn || '');
    }).join('');
    return '<div class="musicList trackBlock">' + heading + '<div class="musicPlay">' + spotifyHostMarkup('spotify:track:' + rows[0].id, !keepCurrent) + playRailMarkup(rows[0].id, false) + '</div><ol class="trackList">' + items + '</ol></div>';
}

function currentMusicTrackId() {
    const hosts = terminalOutput.querySelectorAll('.musicPlay .spotifyHost');
    for (let i = hosts.length - 1; i >= 0; i--) {
        const host = hosts[i];
        const uri = host.dataset.spotifyUri || '';
        if (uri.indexOf('spotify:track:') !== 0) continue;
        if (host.dataset.playback === 'paused') return '';
        return uri.split(':').pop();
    }
    return '';
}

async function writeMusicJson(url, method, body) {
    let target = url;
    if (typeof SiteSession !== 'undefined' && SiteSession.isOperator && SiteSession.isOperator() && SiteSession.idToken && url.indexOf(PLAYED_MUSIC_URL) === 0) {
        const token = await SiteSession.idToken();
        if (token) target += (target.indexOf('?') === -1 ? '?' : '&') + 'auth=' + encodeURIComponent(token);
    }
    const request = { method: method };
    if (body !== undefined) {
        request.headers = { 'Content-Type': 'application/json' };
        request.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    return fetch(target, request);
}

async function firebaseJsonUrl(base) {
    let url = base + '.json';
    if (typeof SiteSession === 'undefined' || typeof SiteSession.idToken !== 'function') return url;
    const token = await SiteSession.idToken();
    if (!token) return url;
    return url + '?auth=' + encodeURIComponent(token);
}

async function clearPlayedMusic() {
    if (typeof SiteSession === 'undefined' || !SiteSession.isOperator()) {
        return 'Only Lucas can clear the randomized songs.\nUse login.';
    }
    const response = await fetch(await firebaseJsonUrl(PLAYED_MUSIC_URL), { method: 'DELETE' });
    if (!response.ok) return "Couldn't clear the randomized songs.";
    playedMusicState = emptyPlayedState();
    localStorage.removeItem('playedPositions');
    localStorage.removeItem('playedPositions:lucas');
    return 'Randomized songs cleared.';
}

async function clearVisitorMusic() {
    if (typeof SiteSession === 'undefined' || !SiteSession.isOperator()) {
        return 'Only Lucas can clear visitor randomized songs.\nUse login.';
    }
    const response = await fetch(await firebaseJsonUrl(VISITOR_MUSIC_URL), { method: 'DELETE' });
    if (!response.ok) return "Couldn't clear visitor randomized songs.";
    localStorage.removeItem('playedPositions:visitor');
    if (musicStoreKey === VISITOR_MUSIC_URL) playedMusicState = emptyPlayedState();
    return 'Visitor randomized songs cleared.';
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
    return '<div class="trackBlock likedBlock"><div class="trackHeading">My Last 100 Liked Songs</div><div class="musicPlay">' + spotifyHostMarkup('spotify:track:' + latest[0].id, true) + playRailMarkup(latest[0].id, false) + '</div><ol class="trackList">' + items + '</ol></div>';
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
    if (host._controller) {
        host._controller._awaitingPause = false;
        host._controller._ignorePlayUntil = 0;
    }
    pauseOthers({ controller: host._controller, host: host });
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
            // One loadUri per click. Repeating it reloads the embed and cuts off the song that just started.
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
    syncTrackRadio(host);
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
            if (!host._controller.pendingUri) {
                try { host._controller.play(); } catch (error) {}
            }
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
    return escapeHtml(trackLabel(track)) + '\n<div class="musicPlay">' + spotifyHostMarkup('spotify:track:' + track.id, true) + playRailMarkup(track.id, false) + '</div>';
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
                appendOutput(commandPromptHtml() + ' rickrolled?');
                processCommand(`rickrolled?`);
                clearCommand();
            });
        });
    }
    if (command === "lucaohost") {
        document.querySelectorAll(`.localhostExplanation`).forEach(element => {
            element.addEventListener('click', function() {
                appendOutput(commandPromptHtml() + ' localhost?');
                processCommand(`localhost?`);
                clearCommand();
            });
        });
    }
}

bindTerminalChrome();
