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
                    this.pauses = (this.pauses || 0) + 1;
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
            if (mount && mount.replaceWith) {
                const frame = mount.ownerDocument.createElement('iframe');
                frame.className = 'spotifyIframe';
                mount.replaceWith(frame);
                player.frame = frame;
            }
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
        await delay(400);
        page.api.created[0].emit(stale);
        assert.equal(page.api.created.length, 1);
        await delay(3300);
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

test('another song can start while the previous one is still loading', async () => {
    await withPage({ catalog: tracks(['a', 'b', 'c']) }, async (page) => {
        await runCommand(page, 'liked');
        await hear(page, 'spotify:track:a');
        const buttons = output(page).querySelectorAll('.trackPlay');
        buttons[1].click();
        await delay(450);
        assert.equal(buttons[1].classList.contains('is-loading'), true);
        buttons[2].click();
        assert.equal(output(page).querySelector('.spotifyHost').dataset.spotifyUri, 'spotify:track:c');
        assert.equal(page.api.created.length, 1);
        assert.equal(audible(page).has('spotify:track:a'), false);
        await finishSlowLoad(page, 'spotify:track:c');
        assert.deepEqual([...audible(page)], ['spotify:track:c']);
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
    const changelog = fs.readFileSync(path.join(root, 'changelog.md'), 'utf8');
    const top = changelog.split(/^## /m)[1];
    assert.match(top, /^2\.1\.3 - 2026-09-29/);
    assert.match(top, /keeps that song going/);
    assert.match(top, /remains on screen/);
    assert.match(changelog, /leaves the song that is already playing/);
    assert.match(changelog, /while one is still loading/);
    assert.match(changelog, /round skip button/);
    assert.match(changelog, /holds scrolling and typing/);
    assert.match(changelog, /player already open/);
    assert.match(changelog, /numbered rows that have no song name/);
    assert.match(changelog, /right side of the Spotify player/);
    assert.match(changelog, /`liked` and `list` play the next song/);
    assert.match(changelog, /stops the one already playing/);
    assert.match(changelog, /Dragging or scrolling across Next/);
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

test('Next sits on the right side of the Spotify player', async () => {
    await withPage({ catalog: tracks(['a', 'b']), played: { tracks: {}, cycle: {}, generation: 1 } }, async (page) => {
        for (const command of ['music', 'next music']) {
            output(page).replaceChildren();
            await runCommand(page, command);
            await delay(40);
            const row = output(page).querySelector('.musicPlay');
            const host = row.querySelector('.spotifyHost');
            const button = row.querySelector('.nextMusic');
            assert.equal(host.nextElementSibling, button);
            assert.equal(button.parentElement, row);
        }
        const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
        assert.match(css, /\.musicPlay\s*\{[^}]*display:\s*flex/);
        assert.match(css, /\.musicPlay\s*\{[^}]*flex-direction:\s*row/);
        assert.match(css, /\.musicPlay \.spotifyHost\s*\{[^}]*flex:\s*1/);
    });
});

test('choosing another song keeps a single player', async () => {
    await withPage({ catalog: tracks(['s0', 's1', 's2', 's3', 's4']) }, async (page) => {
        await runCommand(page, 'liked');
        const first = output(page).querySelector('.trackPlay').dataset.trackId;
        await hear(page, 'spotify:track:' + first);
        for (let index = 1; index <= 4; index += 1) {
            const button = output(page).querySelectorAll('.trackPlay')[index];
            button.click();
            await delay(20);
            assert.equal(page.api.created.length, 1, 'selection ' + index + ' opened another player');
            const live = page.api.created.filter((player) => !player.destroyed);
            assert.equal(live.length, 1, 'selection ' + index + ' left more than one player');
            assert.equal(live[0].loads[live[0].loads.length - 1], 'spotify:track:' + button.dataset.trackId);
            assert.equal(audible(page).has('spotify:track:' + output(page).querySelectorAll('.trackPlay')[index - 1].dataset.trackId), false);
        }
    });
});

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

function searchHit(track) {
    return {
        data: {
            searchV2: {
                topResultsV2: {
                    itemsV2: [{
                        item: {
                            __typename: 'TrackResponseWrapper',
                            data: {
                                uri: 'spotify:track:' + track.id,
                                name: track.name,
                                artists: { items: [{ profile: { name: track.artist } }] }
                            }
                        }
                    }]
                }
            }
        }
    };
}

function installSearch(page, track, gate) {
    const original = page.window.fetch;
    page.window.fetch = async (url, request) => {
        const href = String(url);
        if (href.includes('embed/api/token') || href.includes('searchSuggestions')) {
            page.fetches.push({ href: href, method: (request && request.method) || 'GET' });
            if (href.includes('embed/api/token')) {
                return jsonResponse({
                    accessToken: 'token',
                    accessTokenExpirationTimestampMs: Date.now() + 60 * 60 * 1000
                });
            }
            if (gate) await gate;
            return jsonResponse(searchHit(track));
        }
        return original(url, request);
    };
}

function pressEnter(page) {
    page.document.getElementById('input').dispatchEvent(new page.window.KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true
    }));
}

test('Next is a round skip control', async () => {
    await withPage({ catalog: tracks(['a', 'b']), played: { tracks: {}, cycle: {}, generation: 1 } }, async (page) => {
        const button = await musicNextButton(page);
        assert.equal(button.getAttribute('aria-label'), 'Next song');
        assert.ok(button.querySelector('svg'));
        assert.equal(button.textContent.trim(), '');
        const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
        assert.match(css, /\.nextMusic\s*\{[^}]*border-radius:\s*50%/);
        assert.match(css, /\.nextMusic\s*\{[^}]*background:\s*#2c2c2c/);
    });
});

test('music song plays a known liked song without searching', async () => {
    await withPage({ catalog: tracks(['a', 'b']) }, async (page) => {
        await runCommand(page, 'music Song a');
        assert.equal(output(page).querySelector('.spotifyHost').dataset.spotifyUri, 'spotify:track:a');
        assert.equal(page.fetches.some((entry) => entry.href.includes('searchSuggestions')), false);
        await delay(450);
        assert.equal(output(page).querySelector('.commandWait'), null);
        assert.equal(page.document.body.classList.contains('is-commandLocked'), false);
    });
});

test('music song plays the only liked title that contains the words', async () => {
    const catalog = [{ id: 'rick', name: 'Never Gonna Give You Up', artist: 'Rick Astley', addedAt: '2026-09-01T00:00:00.000Z' }];
    await withPage({ catalog: catalog }, async (page) => {
        await runCommand(page, 'music never gonna');
        assert.equal(output(page).querySelector('.spotifyHost').dataset.spotifyUri, 'spotify:track:rick');
        assert.equal(page.fetches.some((entry) => entry.href.includes('searchSuggestions')), false);
    });
});

test('music song asks Spotify when more than one liked title matches', async () => {
    const catalog = [
        { id: 'one', name: 'Love Song', artist: 'A', addedAt: '2026-09-02T00:00:00.000Z' },
        { id: 'two', name: 'Love Song', artist: 'B', addedAt: '2026-09-01T00:00:00.000Z' }
    ];
    await withPage({ catalog: catalog }, async (page) => {
        installSearch(page, { id: 'picked', name: 'Love Song', artist: 'C' });
        await runCommand(page, 'music Love Song');
        assert.equal(output(page).querySelector('.spotifyHost').dataset.spotifyUri, 'spotify:track:picked');
    });
});

test('a repeated song search reuses the Spotify token', async () => {
    await withPage({ catalog: tracks(['a']) }, async (page) => {
        installSearch(page, { id: 'remote', name: 'Remote Song', artist: 'Someone' });
        await runCommand(page, 'music remote one');
        await runCommand(page, 'music remote two');
        assert.equal(page.fetches.filter((entry) => entry.href.includes('embed/api/token')).length, 1);
        assert.equal(page.fetches.filter((entry) => entry.href.includes('searchSuggestions')).length, 2);
    });
});

test('a slow music song search holds scrolling and typing', async () => {
    await withPage({ catalog: tracks(['a', 'b']) }, async (page) => {
        let release;
        const gate = new Promise((resolve) => { release = resolve; });
        installSearch(page, { id: 'remote', name: 'Remote Song', artist: 'Remote Artist' }, gate);
        const pending = runCommand(page, 'music remote song');
        await delay(80);
        assert.equal(output(page).querySelector('.commandWait'), null);
        assert.equal(page.document.body.classList.contains('is-commandLocked'), false);
        await delay(450);
        assert.equal(output(page).querySelector('.commandWait').textContent, 'Searching Spotify…');
        assert.equal(page.document.body.classList.contains('is-commandLocked'), true);
        assert.equal(page.document.getElementById('terminal-body').classList.contains('is-scrollLocked'), true);
        const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
        assert.match(css, /body\.is-commandLocked \.output,[\s\S]*?pointer-events:\s*none/);
        const input = page.document.getElementById('input');
        input.textContent = 'whoami';
        input.innerText = 'whoami';
        pressEnter(page);
        await delay(30);
        assert.equal(output(page).textContent.includes('software engineer'), false);
        release();
        await pending;
        assert.equal(output(page).querySelector('.commandWait'), null);
        assert.equal(page.document.body.classList.contains('is-commandLocked'), false);
        assert.equal(page.document.getElementById('terminal-body').classList.contains('is-scrollLocked'), false);
        assert.equal(output(page).querySelector('.spotifyHost').dataset.spotifyUri, 'spotify:track:remote');
        input.textContent = 'whoami';
        input.innerText = 'whoami';
        pressEnter(page);
        await delay(30);
        assert.match(output(page).textContent, /Lucas/);
    });
});

test('list drops numbered songs that have no name', async () => {
    const played = {
        tracks: {
            a: { name: 'Song a', artist: 'Artist a', playedOn: '2026-09-01', seq: 2 },
            b: { name: '', artist: '', playedOn: '2026-09-02', seq: 3 },
            '99': { name: '', artist: '', playedOn: '', seq: 5 },
            '105': { name: '', artist: '', playedOn: '', seq: 4 }
        },
        cycle: { '99': 1, a: 1 },
        generation: 1
    };
    await withPage({ catalog: tracks(['a', 'b', 'c']), played: played }, async (page) => {
        page.window.localStorage.setItem('playedPositions', JSON.stringify({ '105': true, '42': true, a: true }));
        await runCommand(page, 'list');
        const names = [...output(page).querySelectorAll('.trackName')].map((node) => node.textContent);
        assert.deepEqual(names, ['Song b', 'Song a']);
        const puts = page.fetches.filter((entry) => entry.method === 'PUT' && /\/tracks\/(99|105|42)\.json/.test(entry.href));
        assert.equal(puts.length, 0);
        assert.equal(page.fetches.some((entry) => entry.method === 'DELETE' && entry.href.includes('/tracks/99.json')), true);
        assert.equal(page.fetches.some((entry) => entry.method === 'DELETE' && entry.href.includes('/tracks/105.json')), true);
    });
});

test('music ignores numbered leftovers when it remembers a song', async () => {
    await withPage({ catalog: tracks(['a', 'b']), played: { tracks: {}, cycle: {}, generation: 1 } }, async (page) => {
        page.window.localStorage.setItem('playedPositions', JSON.stringify({ '99': true, '105': true }));
        await runCommand(page, 'music');
        await delay(30);
        const bad = page.fetches.filter((entry) => entry.method === 'PUT' && /\/tracks\/(99|105)\.json/.test(entry.href));
        assert.equal(bad.length, 0);
        await runCommand(page, 'list');
        const names = [...output(page).querySelectorAll('.musicList .trackName')].map((node) => node.textContent);
        assert.equal(names.some((name) => name === '99' || name === '105'), false);
        assert.equal(names.length, 1);
        assert.match(names[0], /^Song /);
    });
});

test('play from list reuses the open player', async () => {
    await withPage({ catalog: tracks(['a', 'b', 'c']), played: playedSongs(['a', 'b', 'c']) }, async (page) => {
        await runCommand(page, 'list');
        const first = output(page).querySelector('.trackPlay').dataset.trackId;
        await hear(page, 'spotify:track:' + first);
        const button = output(page).querySelectorAll('.trackPlay')[1];
        button.click();
        assert.equal(page.api.created.length, 1);
        assert.equal(livePlayer(page).destroyed, false);
        assert.equal(livePlayer(page).loads[livePlayer(page).loads.length - 1], 'spotify:track:' + button.dataset.trackId);
        assert.equal(audible(page).has('spotify:track:' + first), false);
    });
});

test('clicking another song while one is still loading keeps the same player', async () => {
    const ids = Array.from({ length: 30 }, (_, index) => 's' + index);
    for (const command of ['list', 'liked']) {
        const options = { catalog: tracks(ids) };
        if (command === 'list') options.played = playedSongs(ids);
        await withPage(options, async (page) => {
            await runCommand(page, command);
            const buttons = () => [...output(page).querySelectorAll('.trackPlay')];
            await hear(page, 'spotify:track:' + buttons()[0].dataset.trackId);
            buttons()[9].click();
            await delay(1200);
            assert.equal(page.api.created.length, 1, command + ' rebuilt the player while the tenth song was loading');
            assert.equal(buttons()[9].classList.contains('is-loading'), true);
            buttons()[29].click();
            await delay(1200);
            const third = buttons()[14];
            third.click();
            const uri = 'spotify:track:' + third.dataset.trackId;
            assert.equal(output(page).querySelector('.spotifyHost').dataset.spotifyUri, uri);
            assert.equal(page.api.created.filter((player) => !player.destroyed).length, 1, command);
            await finishSlowLoad(page, uri);
            assert.deepEqual([...audible(page)], [uri]);
        });
    }
});

test('list after music leaves the song that is already playing', async () => {
    const played = playedSongs(['a', 'b', 'c']);
    for (const command of ['music', 'next music']) {
        await withPage({ catalog: tracks(['a']), played: played }, async (page) => {
            await runCommand(page, command);
            await delay(30);
            const musicHost = output(page).querySelector('.musicPlay .spotifyHost');
            const musicUri = musicHost.dataset.spotifyUri;
            await hear(page, musicUri);
            await runCommand(page, 'list');
            const listHost = output(page).querySelector('.musicList .spotifyHost');
            const musicPlayer = page.api.created[0];
            assert.equal(musicHost.dataset.playback, 'playing', command);
            assert.equal(musicPlayer.paused, false, command);
            assert.equal(listHost.dataset.spotifyUri, musicUri, command);
            assert.equal(listHost.hasAttribute('data-autoplay'), false, command);
            assert.equal(page.api.created[1].paused, true, command);
            assert.equal(output(page).querySelector('.musicList .trackRow').classList.contains('is-current'), true);
            musicPlayer.emit({
                isPaused: true,
                isBuffering: false,
                playingURI: musicUri,
                duration: 180000,
                position: 179200
            });
            await delay(500);
            const rows = output(page).querySelectorAll('.musicList .trackRow');
            assert.equal(rows[0].classList.contains('is-current'), true, command);
            assert.equal(rows[1].classList.contains('is-current'), false, command);
            rows[1].querySelector('.trackPlay').click();
            const picked = 'spotify:track:' + rows[1].querySelector('.trackPlay').dataset.trackId;
            await finishSlowLoad(page, picked);
            assert.deepEqual([...audible(page)], [picked], command);
            livePlayer(page).emit({
                isPaused: true,
                isBuffering: false,
                playingURI: picked,
                duration: 180000,
                position: 179200
            });
            await delay(500);
            const nextId = output(page).querySelectorAll('.musicList .trackPlay')[2].dataset.trackId;
            assert.equal(output(page).querySelector('.musicList .trackRow.is-current .trackPlay').dataset.trackId, nextId, command);
            assert.equal(listHost.dataset.spotifyUri, 'spotify:track:' + nextId, command);
        });
    }
});

test('list still starts the first song when music is not already playing it', async () => {
    await withPage({ catalog: tracks(['a', 'b', 'c']), played: playedSongs(['a', 'b', 'c']) }, async (page) => {
        await runCommand(page, 'list');
        assert.equal(output(page).querySelector('.musicList .spotifyHost').dataset.autoplay, '1');
    });
    await withPage({
        catalog: tracks(['a']),
        played: {
            tracks: {
                b: { name: 'Song b', artist: 'Artist b', playedOn: '2026-09-02', seq: 9 },
                a: { name: 'Song a', artist: 'Artist a', playedOn: '2026-09-01', seq: 1 }
            },
            cycle: {},
            generation: 1
        }
    }, async (page) => {
        await runCommand(page, 'music');
        await delay(30);
        await hear(page, output(page).querySelector('.musicPlay .spotifyHost').dataset.spotifyUri);
        await runCommand(page, 'list');
        const listHost = output(page).querySelector('.musicList .spotifyHost');
        assert.equal(listHost.dataset.spotifyUri, 'spotify:track:b');
        assert.equal(listHost.dataset.autoplay, '1');
        assert.equal(page.api.created[0].paused, true);
    });
});

test('liked still starts its first song after music', async () => {
    await withPage({ catalog: tracks(['a', 'b', 'c']), played: playedSongs(['a', 'b', 'c']) }, async (page) => {
        await runCommand(page, 'music');
        await delay(30);
        await hear(page, output(page).querySelector('.musicPlay .spotifyHost').dataset.spotifyUri);
        await runCommand(page, 'liked');
        await delay(30);
        const likedHost = output(page).querySelector('.likedBlock .spotifyHost');
        assert.equal(likedHost.dataset.autoplay, '1');
        assert.equal(likedHost.dataset.spotifyUri, 'spotify:track:a');
        assert.equal(page.api.created[0].paused, true);
        assert.equal(livePlayer(page).paused, false);
    });
});

test('a list song stays playing when earlier music players are still reporting', async () => {
    const played = playedSongs(['c', 'b', 'a']);
    await withPage({ catalog: tracks(['c']), played: played }, async (page) => {
        await runCommand(page, 'music');
        await runCommand(page, 'next music');
        await runCommand(page, 'next music');
        await delay(30);
        const musicHosts = [...output(page).querySelectorAll('.musicPlay .spotifyHost')];
        assert.equal(musicHosts.length, 3);
        await hear(page, musicHosts[musicHosts.length - 1].dataset.spotifyUri);
        await runCommand(page, 'list');
        const listHost = output(page).querySelector('.musicList .spotifyHost');
        assert.equal(listHost.classList.contains('is-pinned'), true);
        assert.equal(listHost.hasAttribute('data-autoplay'), false);
        const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
        assert.match(css, /\.spotifyHost\.is-pinned\s*\{[^}]*position:\s*sticky/);
        const rows = [...output(page).querySelectorAll('.musicList .trackRow')];
        const button = rows[1].querySelector('.trackPlay');
        const picked = 'spotify:track:' + button.dataset.trackId;
        const previous = listHost.dataset.spotifyUri;
        button.click();
        const listPlayer = livePlayer(page);
        const pauses = listPlayer.pauses || 0;
        listPlayer.emit({
            isPaused: false,
            isBuffering: false,
            playingURI: previous,
            duration: 180000,
            position: 2000
        });
        assert.equal(listPlayer.pauses || 0, pauses);
        page.api.created.slice(0, 3).forEach((player) => {
            player.emit({
                isPaused: false,
                isBuffering: false,
                playingURI: 'spotify:track:c',
                duration: 180000,
                position: 2000
            });
        });
        await finishSlowLoad(page, picked);
        page.api.created[0].emit({
            isPaused: false,
            isBuffering: false,
            playingURI: 'spotify:track:c',
            duration: 180000,
            position: 3000
        });
        await delay(50);
        assert.equal(listPlayer.paused, false);
        assert.equal(listPlayer.reportedUri, picked);
        page.api.created.slice(0, 3).forEach((player, index) => {
            assert.equal(player.paused, true, 'music player ' + index);
        });
        assert.equal(audible(page).has(picked), true);
    });
});

test('a play tap loads that song once while the player stays put', async () => {
    const ids = Array.from({ length: 30 }, (_, index) => 's' + index);
    for (const command of ['list', 'liked']) {
        const options = { catalog: tracks(ids) };
        if (command === 'list') options.played = playedSongs(ids);
        await withPage(options, async (page) => {
            await runCommand(page, command);
            const host = output(page).querySelector('.spotifyHost');
            assert.equal(host.classList.contains('is-pinned'), true, command);
            const buttons = () => [...output(page).querySelectorAll('.trackPlay')];
            await hear(page, 'spotify:track:' + buttons()[0].dataset.trackId);
            buttons()[9].click();
            await delay(2500);
            const tenth = 'spotify:track:' + buttons()[9].dataset.trackId;
            assert.equal(livePlayer(page).loads.filter((uri) => uri === tenth).length, 1, command);
            buttons()[29].click();
            await delay(2500);
            const later = 'spotify:track:' + buttons()[29].dataset.trackId;
            assert.equal(livePlayer(page).loads.filter((uri) => uri === later).length, 1, command);
            assert.equal(page.api.created.filter((player) => !player.destroyed).length, 1, command);
            assert.equal(host.classList.contains('is-pinned'), true, command);
        });
    }
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
