const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function tracks(ids) {
    const start = Date.UTC(2026, 0, 1);
    return ids.map((id, index) => ({
        id: id,
        name: 'Song ' + id,
        artist: 'Artist ' + id,
        addedAt: new Date(start + (ids.length - index) * 60000).toISOString()
    }));
}

function jsonResponse(body, ok) {
    return {
        ok: ok !== false,
        status: ok === false ? 500 : 200,
        json: async () => body,
        text: async () => (typeof body === 'string' ? body : JSON.stringify(body))
    };
}

function createSpotifyApi(options) {
    const created = [];
    return {
        created: created,
        createController: function (mount, controllerOptions, callback) {
            const listeners = {};
            const player = {
                options: controllerOptions,
                reportedUri: controllerOptions.uri,
                pendingUri: null,
                paused: true,
                destroyed: false,
                sticky: !!(options && options.stickyFirst && created.length === 0),
                orphans: new Set(),
                loads: [],
                listeners: listeners,
                loadUri: function (uri) {
                    this.loads.push(uri);
                    this.pendingUri = uri;
                },
                play: function () {
                    if (this.destroyed) return;
                    if (this.pendingUri && this.reportedUri && this.pendingUri !== this.reportedUri) {
                        this.orphans.add(this.reportedUri);
                    }
                    if (!this.sticky) this.paused = false;
                },
                pause: function () {
                    if (this.destroyed || this.sticky) return;
                    this.paused = true;
                },
                destroy: function () {
                    this.destroyed = true;
                    this.paused = true;
                    this.orphans.clear();
                    this.pendingUri = null;
                },
                completeLoad: function () {
                    if (this.destroyed || !this.pendingUri) return;
                    const next = this.pendingUri;
                    if (!this.paused && this.reportedUri && this.reportedUri !== next) {
                        this.orphans.add(this.reportedUri);
                    }
                    this.reportedUri = next;
                    this.pendingUri = null;
                },
                audible: function () {
                    if (this.destroyed) return new Set();
                    const playing = new Set(this.orphans);
                    if (!this.paused && this.reportedUri) playing.add(this.reportedUri);
                    return playing;
                },
                emit: function (data) {
                    if (data.playingURI) this.reportedUri = data.playingURI;
                    if (data.isPaused === true) this.paused = true;
                    if (data.isPaused === false && !this.sticky) this.paused = false;
                    (listeners.playback_update || []).forEach((fn) => fn({ data: data }));
                },
                addListener: function (name, fn) {
                    listeners[name] = listeners[name] || [];
                    listeners[name].push(fn);
                }
            };
            created.push(player);
            callback(player);
            setTimeout(function () {
                (listeners.ready || []).forEach((fn) => fn());
            }, 0);
        }
    };
}

function audible(page) {
    const playing = new Set();
    page.api.created.forEach((player) => {
        player.audible().forEach((uri) => playing.add(uri));
    });
    return playing;
}

function livePlayer(page) {
    const players = page.api.created.filter((player) => !player.destroyed);
    return players[players.length - 1];
}

function boot(options) {
    const settings = options || {};
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    const dom = new JSDOM(html, {
        url: 'https://lucaohost.github.io/',
        pretendToBeVisual: true,
        runScripts: 'dangerously'
    });
    const window = dom.window;
    window.matchMedia = (query) => ({
        matches: false,
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent() { return false; }
    });
    window.PointerEvent = class extends window.Event {
        constructor(type, params) {
            super(type, params || {});
            this.clientX = params && params.clientX || 0;
            this.clientY = params && params.clientY || 0;
            this.pointerId = params && params.pointerId || 0;
        }
    };
    const played = settings.played || { tracks: {}, cycle: {}, generation: 1 };
    const fetches = [];
    window.fetch = async (url, request) => {
        const href = String(url);
        const method = (request && request.method) || 'GET';
        fetches.push({ href: href, method: method, body: request && request.body });
        if (href.includes('changelog.md')) {
            return jsonResponse(settings.changelog || '# Changelog\n\n## 9.9.9 - 2026-01-01\n\n### Added\n- Example item\n');
        }
        if (href.includes('playedMusic')) return jsonResponse(method === 'GET' ? played : null);
        return jsonResponse(null);
    };
    function run(source) {
        const script = window.document.createElement('script');
        script.textContent = source;
        window.document.body.appendChild(script);
    }
    run(fs.readFileSync(path.join(root, 'songs.js'), 'utf8'));
    run(fs.readFileSync(path.join(root, 'scripts.js'), 'utf8'));
    const api = createSpotifyApi(settings);
    window.onSpotifyIframeApiReady(api);
    window.likedCatalog = settings.catalog || tracks(['a', 'b', 'c']);
    return {
        window: window,
        document: window.document,
        api: api,
        fetches: fetches,
        close: function () {
            window.close();
        }
    };
}

async function withPage(options, fn) {
    const page = boot(options);
    try {
        await fn(page);
    } finally {
        page.close();
    }
}

async function runCommand(page, command) {
    await page.window.processCommand(command);
}

function output(page) {
    return page.document.getElementById('output');
}

function commandNames(page) {
    const names = [];
    const cells = output(page).querySelectorAll('td');
    for (let i = 0; i < cells.length; i += 2) names.push(cells[i].textContent.trim());
    return names;
}

async function hear(page, uri) {
    livePlayer(page).emit({
        isPaused: false,
        isBuffering: false,
        playingURI: uri,
        duration: 180000,
        position: 1000
    });
    await delay(20);
}

async function finishSlowLoad(page, uri) {
    page.api.created.forEach((player) => player.completeLoad());
    const player = livePlayer(page);
    player.emit({
        isPaused: true,
        isBuffering: false,
        playingURI: uri,
        duration: 180000,
        position: 0
    });
    await delay(20);
    player.emit({
        isPaused: false,
        isBuffering: false,
        playingURI: uri,
        duration: 180000,
        position: 500
    });
    await delay(20);
}

test('list plays the next randomized song when the current one ends', async () => {
    await withPage({ catalog: tracks(['a', 'b', 'c']), played: playedSongs(['a', 'b', 'c']) }, async (page) => {
        await runCommand(page, 'list');
        const before = output(page).querySelectorAll('.musicList .trackRow');
        assert.equal(before[0].classList.contains('is-current'), true);
        await hear(page, 'spotify:track:' + before[0].querySelector('.trackPlay').dataset.trackId);
        livePlayer(page).emit({
            isPaused: true,
            isBuffering: false,
            playingURI: 'spotify:track:' + before[0].querySelector('.trackPlay').dataset.trackId,
            duration: 180000,
            position: 179200
        });
        await delay(500);
        const rows = output(page).querySelectorAll('.musicList .trackRow');
        const nextId = rows[1].querySelector('.trackPlay').dataset.trackId;
        assert.equal(rows[1].classList.contains('is-current'), true);
        assert.equal(output(page).querySelector('.musicList .spotifyHost').dataset.spotifyUri, 'spotify:track:' + nextId);
        await finishSlowLoad(page, 'spotify:track:' + nextId);
        assert.deepEqual([...audible(page)], ['spotify:track:' + nextId]);
    });
});

test('liked plays the next song when the current one ends', async () => {
    await withPage({ catalog: tracks(['a', 'b', 'c']) }, async (page) => {
        await runCommand(page, 'liked');
        const before = output(page).querySelectorAll('.likedBlock .trackRow');
        const firstId = before[0].querySelector('.trackPlay').dataset.trackId;
        await hear(page, 'spotify:track:' + firstId);
        livePlayer(page).emit({
            isPaused: true,
            isBuffering: false,
            playingURI: 'spotify:track:' + firstId,
            duration: 180000,
            position: 179200
        });
        await delay(500);
        const rows = output(page).querySelectorAll('.likedBlock .trackRow');
        const nextId = rows[1].querySelector('.trackPlay').dataset.trackId;
        assert.equal(rows[1].classList.contains('is-current'), true);
        assert.equal(output(page).querySelector('.likedBlock .spotifyHost').dataset.spotifyUri, 'spotify:track:' + nextId);
        await finishSlowLoad(page, 'spotify:track:' + nextId);
        assert.deepEqual([...audible(page)], ['spotify:track:' + nextId]);
    });
});

test('pausing in the middle of a song does not skip to the next one', async () => {
    for (const command of ['liked', 'list']) {
        await withPage({ catalog: tracks(['a', 'b', 'c']), played: playedSongs(['a', 'b', 'c']) }, async (page) => {
            await runCommand(page, command);
            const block = output(page).querySelector('.trackBlock');
            const first = block.querySelector('.trackPlay').dataset.trackId;
            await hear(page, 'spotify:track:' + first);
            livePlayer(page).emit({
                isPaused: true,
                isBuffering: false,
                playingURI: 'spotify:track:' + first,
                duration: 180000,
                position: 20000
            });
            await delay(500);
            assert.equal(block.querySelector('.trackRow.is-current .trackPlay').dataset.trackId, first);
            const next = block.querySelectorAll('.trackPlay')[1].dataset.trackId;
            assert.equal(audible(page).has('spotify:track:' + next), false);
        });
    }
});

test('a slow song change keeps only the selected song playing', async () => {
    await withPage({ catalog: tracks(['s0', 's1', 's2', 's3', 's4']) }, async (page) => {
        await runCommand(page, 'liked');
        const first = output(page).querySelector('.trackPlay').dataset.trackId;
        await hear(page, 'spotify:track:' + first);
        for (let index = 1; index <= 4; index += 1) {
            const rows = output(page).querySelectorAll('.trackRow');
            const previous = 'spotify:track:' + rows[index - 1].querySelector('.trackPlay').dataset.trackId;
            const button = rows[index].querySelector('.trackPlay');
            const next = 'spotify:track:' + button.dataset.trackId;
            button.click();
            await delay(450);
            assert.equal(button.classList.contains('is-loading'), true, 'selection ' + index + ' shows the loading icon');
            const during = audible(page);
            assert.equal(during.has(previous), false, 'selection ' + index + ' still plays the previous song');
            assert.ok(during.size <= 1, 'selection ' + index + ' plays more than one song while loading');
            await finishSlowLoad(page, next);
            assert.deepEqual([...audible(page)], [next], 'selection ' + index + ' overlaps another song');
        }
    });
});

test('a song that keeps playing after pause is replaced by only the selected song', async () => {
    await withPage({ catalog: tracks(['a', 'b', 'c']), stickyFirst: true }, async (page) => {
        await runCommand(page, 'list');
        await runCommand(page, 'liked');
        const rows = output(page).querySelectorAll('.likedBlock .trackRow');
        const first = rows[0].querySelector('.trackPlay').dataset.trackId;
        const button = rows[1].querySelector('.trackPlay');
        const next = 'spotify:track:' + button.dataset.trackId;
        await hear(page, 'spotify:track:' + first);
        button.click();
        const stale = {
            isPaused: false,
            isBuffering: false,
            playingURI: 'spotify:track:' + first,
            duration: 180000,
            position: 4000
        };
        page.api.created[0].emit(stale);
        await delay(450);
        page.api.created[0].emit(stale);
        await delay(40);
        assert.deepEqual([...audible(page)], [next]);
    });
});

test('the last song stays put when it ends', async () => {
    await withPage({ catalog: tracks(['a', 'b']) }, async (page) => {
        await runCommand(page, 'liked');
        const rows = output(page).querySelectorAll('.trackRow');
        const last = rows[rows.length - 1].querySelector('.trackPlay');
        last.click();
        await finishSlowLoad(page, 'spotify:track:' + last.dataset.trackId);
        livePlayer(page).emit({
            isPaused: true,
            isBuffering: false,
            playingURI: 'spotify:track:' + last.dataset.trackId,
            duration: 180000,
            position: 179500
        });
        await delay(500);
        assert.equal(output(page).querySelector('.trackRow.is-current .trackPlay'), last);
        const playing = [...audible(page)].filter((uri) => uri !== 'spotify:track:' + last.dataset.trackId);
        assert.deepEqual(playing, []);
    });
});

test('list shows randomized songs newest first and the playlist count', async () => {
    const catalog = tracks(['a', 'b', 'c']);
    const played = {
        tracks: {
            a: { name: 'Song a', artist: 'Artist a', playedOn: '2026-09-01', seq: 1 },
            c: { name: 'Song c', artist: 'Artist c', playedOn: '2026-09-03', seq: 9 }
        },
        cycle: {},
        generation: 1
    };
    await withPage({ catalog: catalog, played: played }, async (page) => {
        await runCommand(page, 'LIST');
        const block = output(page).querySelector('.musicList');
        assert.equal(block.querySelector('.trackCount').textContent, '2/3');
        const names = [...block.querySelectorAll('.trackName')].map((node) => node.textContent);
        assert.deepEqual(names, ['Song c', 'Song a']);
        assert.equal(block.querySelector('.spotifyHost').dataset.spotifyUri, 'spotify:track:c');
    });
});

test('list with no randomized songs says none yet', async () => {
    await withPage({ played: { tracks: {}, cycle: {}, generation: 1 } }, async (page) => {
        await runCommand(page, 'list');
        assert.match(output(page).textContent, /None yet/);
        assert.equal(output(page).querySelector('.spotifyHost'), null);
    });
});

test('liked shows the 100 newest songs, newest first', async () => {
    const catalog = tracks(Array.from({ length: 105 }, (_, index) => 't' + index));
    catalog.push({ id: 'skip', name: 'Skip me', artist: 'Nobody', addedAt: '' });
    await withPage({ catalog: catalog }, async (page) => {
        await runCommand(page, 'liked');
        const names = [...output(page).querySelectorAll('.trackName')].map((node) => node.textContent);
        assert.equal(names.length, 100);
        assert.equal(names[0], 'Song t0');
        assert.equal(names[99], 'Song t99');
        assert.equal(names.includes('Song t104'), false);
        assert.equal(names.includes('Skip me'), false);
    });
});

test('track titles are shown as text', async () => {
    await withPage({
        catalog: [{ id: 'x', name: '<b>Nope</b>', artist: 'A & B', addedAt: '2026-09-01T00:00:00Z' }]
    }, async (page) => {
        await runCommand(page, 'liked');
        const row = output(page).querySelector('.trackRow');
        assert.equal(row.querySelector('.trackName').textContent, '<b>Nope</b>');
        assert.equal(row.querySelector('.trackArtist').textContent, 'A & B');
        assert.equal(row.querySelector('b'), null);
    });
});

test('clicking a play icon selects that song and the song name does not', async () => {
    await withPage({ catalog: tracks(['a', 'b', 'c']) }, async (page) => {
        await runCommand(page, 'liked');
        await hear(page, 'spotify:track:a');
        output(page).querySelectorAll('.trackName')[2].click();
        assert.equal(output(page).querySelector('.spotifyHost').dataset.spotifyUri, 'spotify:track:a');
        assert.equal(output(page).querySelectorAll('.trackRow')[0].classList.contains('is-current'), true);
        output(page).querySelectorAll('.trackPlay')[2].click();
        assert.equal(output(page).querySelector('.spotifyHost').dataset.spotifyUri, 'spotify:track:c');
        assert.equal(output(page).querySelectorAll('.trackRow')[2].classList.contains('is-current'), true);
        await finishSlowLoad(page, 'spotify:track:c');
        assert.deepEqual([...audible(page)], ['spotify:track:c']);
    });
});

test('dragging a play icon does not start the song', async () => {
    await withPage({ catalog: tracks(['a', 'b']) }, async (page) => {
        await runCommand(page, 'liked');
        await hear(page, 'spotify:track:a');
        const button = output(page).querySelectorAll('.trackPlay')[1];
        const pointer = (type, x) => new page.window.PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            clientX: x,
            clientY: 10
        });
        button.dispatchEvent(pointer('pointerdown', 10));
        page.document.dispatchEvent(pointer('pointermove', 40));
        page.document.dispatchEvent(pointer('pointerup', 40));
        button.click();
        assert.equal(output(page).querySelector('.spotifyHost').dataset.spotifyUri, 'spotify:track:a');
        assert.equal(output(page).querySelectorAll('.trackRow')[1].classList.contains('is-current'), false);
    });
});

test('another song cannot start while the loading icon is showing', async () => {
    await withPage({ catalog: tracks(['a', 'b', 'c']) }, async (page) => {
        await runCommand(page, 'liked');
        await hear(page, 'spotify:track:a');
        const buttons = output(page).querySelectorAll('.trackPlay');
        buttons[1].click();
        await delay(450);
        assert.equal(buttons[1].classList.contains('is-loading'), true);
        buttons[2].click();
        assert.equal(output(page).querySelector('.spotifyHost').dataset.spotifyUri, 'spotify:track:b');
        assert.equal(audible(page).has('spotify:track:c'), false);
        assert.equal(audible(page).has('spotify:track:a'), false);
    });
});

test('help lists list and liked and omits clear music', async () => {
    await withPage({}, async (page) => {
        await runCommand(page, 'help');
        const names = commandNames(page);
        for (const name of ['whoami', 'music', 'list', 'liked', 'changelog', 'clear', 'exit']) {
            assert.equal(names.includes(name), true, name);
        }
        assert.equal(names.includes('clear music'), false);
        assert.equal(names.includes('list music'), false);
    });
});

test('list music is not a command anymore', async () => {
    await withPage({}, async (page) => {
        await runCommand(page, 'list music');
        assert.match(output(page).textContent, /not found/);
    });
});

test('an unknown command reports that it was not found', async () => {
    await withPage({}, async (page) => {
        await runCommand(page, 'definitely-missing');
        assert.match(output(page).textContent, /not found/);
    });
});

test('clear empties the terminal', async () => {
    await withPage({}, async (page) => {
        await runCommand(page, 'whoami');
        assert.match(output(page).textContent, /Lucas/);
        await runCommand(page, 'clear');
        assert.equal(output(page).textContent.trim(), '');
    });
});

test('changelog renders versions, sections, and items', async () => {
    await withPage({}, async (page) => {
        await runCommand(page, 'changelog');
        assert.equal(output(page).querySelector('.changelogVersion').textContent, '9.9.9 - 2026-01-01');
        assert.equal(output(page).querySelector('.changelogSection').textContent, 'Added');
        assert.equal(output(page).querySelector('.changelogItem').textContent, 'Example item');
    });
});

test('the changelog records list playback and single-song changes', () => {
    const top = fs.readFileSync(path.join(root, 'changelog.md'), 'utf8').split(/^## /m)[1];
    assert.match(top, /^2\.0\.0 - 2026-09-29/);
    assert.match(top, /`list` command/);
    assert.match(top, /`list` plays the next song/);
    assert.match(top, /stops the one already playing/);
});

test('music starts a random liked song and remembers it', async () => {
    await withPage({ catalog: tracks(['a', 'b']), played: { tracks: {}, cycle: {}, generation: 1 } }, async (page) => {
        await runCommand(page, 'music');
        await delay(20);
        const uri = output(page).querySelector('.spotifyHost').dataset.spotifyUri;
        assert.match(uri, /^spotify:track:(a|b)$/);
        assert.equal(output(page).textContent.includes('Random Liked Song'), true);
        assert.ok(output(page).querySelector('.nextMusic'));
        assert.ok(page.fetches.some((entry) => entry.method === 'PUT' && entry.href.includes('/tracks/')));
    });
});

function usePhone(page) {
    page.window.matchMedia = (query) => ({
        matches: String(query).indexOf('768') !== -1,
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent() { return false; }
    });
}

function touchEvent(page, type, x, y) {
    const point = { identifier: 1, clientX: x, clientY: y };
    const event = new page.window.Event(type, { bubbles: true, cancelable: true });
    event.touches = type === 'touchend' || type === 'touchcancel' ? [] : [point];
    event.changedTouches = [point];
    return event;
}

async function musicNextButton(page) {
    await runCommand(page, 'music');
    await delay(40);
    const button = output(page).querySelector('.nextMusic');
    assert.ok(button);
    return button;
}

test('a tap on Next plays another song', async () => {
    await withPage({ catalog: tracks(['a', 'b']), played: { tracks: {}, cycle: {}, generation: 1 } }, async (page) => {
        const button = await musicNextButton(page);
        button.click();
        await delay(40);
        assert.equal(output(page).querySelectorAll('.spotifyHost').length, 2);
    });
});

test('dragging Next does not play another song', async () => {
    await withPage({ catalog: tracks(['a', 'b']), played: { tracks: {}, cycle: {}, generation: 1 } }, async (page) => {
        const button = await musicNextButton(page);
        const pointer = (type, x) => new page.window.PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            clientX: x,
            clientY: 10
        });
        button.dispatchEvent(pointer('pointerdown', 8));
        page.document.dispatchEvent(pointer('pointermove', 36));
        page.document.dispatchEvent(pointer('pointerup', 36));
        button.click();
        await delay(40);
        assert.equal(output(page).querySelectorAll('.spotifyHost').length, 1);
    });
});

test('a phone tap on Next plays one more song', async () => {
    await withPage({ catalog: tracks(['a', 'b']), played: { tracks: {}, cycle: {}, generation: 1 } }, async (page) => {
        const button = await musicNextButton(page);
        usePhone(page);
        button.dispatchEvent(touchEvent(page, 'touchstart', 12, 12));
        button.dispatchEvent(touchEvent(page, 'touchend', 14, 13));
        button.click();
        await delay(40);
        assert.equal(output(page).querySelectorAll('.spotifyHost').length, 2);
    });
});

test('scrolling across Next on the phone does not play another song', async () => {
    await withPage({ catalog: tracks(['a', 'b']), played: { tracks: {}, cycle: {}, generation: 1 } }, async (page) => {
        const button = await musicNextButton(page);
        usePhone(page);
        button.dispatchEvent(touchEvent(page, 'touchstart', 10, 10));
        page.document.dispatchEvent(touchEvent(page, 'touchmove', 10, 42));
        button.dispatchEvent(touchEvent(page, 'touchend', 10, 42));
        button.click();
        await delay(40);
        assert.equal(output(page).querySelectorAll('.spotifyHost').length, 1);
    });
});

test('letting go after the list scrolls does not play another song', async () => {
    await withPage({ catalog: tracks(['a', 'b']), played: { tracks: {}, cycle: {}, generation: 1 } }, async (page) => {
        const button = await musicNextButton(page);
        usePhone(page);
        button.dispatchEvent(touchEvent(page, 'touchstart', 10, 10));
        page.document.getElementById('terminal-body').scrollTop = 30;
        button.dispatchEvent(touchEvent(page, 'touchend', 10, 12));
        button.click();
        await delay(40);
        assert.equal(output(page).querySelectorAll('.spotifyHost').length, 1);
    });
});

test('Next keeps the play icon scroll gesture', () => {
    const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
    assert.match(css, /\.nextMusic\s*\{[^}]*touch-action:\s*pan-y/);
    assert.match(css, /\.trackPlay\s*\{[^}]*touch-action:\s*pan-y/);
});

test('tgif tells how long until Friday', async () => {
    await withPage({}, async (page) => {
        await runCommand(page, 'tgif');
        assert.match(output(page).textContent, /Thank God It's Friday|It's Saturday|It's Sunday/);
    });
});

function playedSongs(ids) {
    const tracks = {};
    ids.forEach((id, index) => {
        tracks[id] = {
            name: 'Song ' + id,
            artist: 'Artist ' + id,
            playedOn: '2026-09-0' + (index + 1),
            seq: ids.length - index
        };
    });
    return { tracks: tracks, cycle: {}, generation: 1 };
}
