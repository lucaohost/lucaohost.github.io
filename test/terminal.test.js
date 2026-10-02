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
        fetches.push({
            href: href,
            method: method,
            body: request && request.body,
            headers: request && request.headers
        });
        if (href.includes('changelog.md')) {
            return jsonResponse(settings.changelog || '# Changelog\n\n## 9.9.9 - 2026-01-01\n\n### Added\n- Example item\n');
        }
        if (href.includes('embed/api/token')) {
            return jsonResponse({
                accessToken: 'embed-token',
                accessTokenExpirationTimestampMs: Date.now() + 60 * 60 * 1000
            });
        }
        if (href.includes('/seed_to_playlist/')) {
            const trackId = decodeURIComponent(href.split('/seed_to_playlist/')[1].split('?')[0]).split(':').pop();
            const playlistId = settings.songRadio && settings.songRadio[trackId]
                ? settings.songRadio[trackId]
                : 'radio-' + trackId;
            return jsonResponse({ total: 1, mediaItems: [{ uri: 'spotify:playlist:' + playlistId }] });
        }
        if (href.includes('visitorMusic')) return jsonResponse(method === 'GET' ? played : null);
        if (href.includes('playedMusic')) {
            return jsonResponse(method === 'GET' ? (settings.operator || { tracks: {}, cycle: {}, generation: 1 }) : null);
        }
        return jsonResponse(null);
    };
    function run(source) {
        const script = window.document.createElement('script');
        script.textContent = source;
        window.document.body.appendChild(script);
    }
    run(fs.readFileSync(path.join(root, 'session.js'), 'utf8'));
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

test('list shows stored songs before the liked catalog finishes', async () => {
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    await withPage({ played: playedSongs(['a', 'b']) }, async (page) => {
        page.window.likedCatalog = null;
        page.window.likedCatalogPromise = gate.then(() => tracks(['a', 'b', 'c', 'd']));
        const pending = runCommand(page, 'list');
        await delay(40);
        const block = output(page).querySelector('.musicList');
        assert.ok(block);
        assert.equal(block.querySelector('.trackCount').textContent, '2/?');
        release();
        await pending;
        await delay(30);
        assert.equal(output(page).querySelector('.musicList .trackCount').textContent, '2/4');
    });
});

test('a slow list and liked command show a loading status', async () => {
    await withPage({ played: playedSongs(['a']) }, async (page) => {
        const original = page.window.fetch;
        let releaseFetch;
        const fetchGate = new Promise((resolve) => { releaseFetch = resolve; });
        page.window.fetch = (url, request) => {
            const href = String(url);
            if (href.includes('visitorMusic') || href.includes('playedMusic')) {
                return fetchGate.then(() => original(url, request));
            }
            return original(url, request);
        };
        const pending = runCommand(page, 'list');
        await delay(80);
        assert.equal(output(page).querySelector('.commandWait'), null);
        await delay(400);
        assert.equal(output(page).querySelector('.commandWait').textContent, 'Loading songs…');
        assert.equal(page.document.body.classList.contains('is-commandLocked'), true);
        releaseFetch();
        await pending;
        assert.equal(output(page).querySelector('.commandWait'), null);
        assert.ok(output(page).querySelector('.musicList'));
        assert.equal(page.document.body.classList.contains('is-commandLocked'), false);

        let releaseLiked;
        const likedGate = new Promise((resolve) => { releaseLiked = resolve; });
        page.window.likedCatalog = null;
        page.window.likedCatalogPromise = likedGate.then(() => tracks(['a', 'b']));
        const liked = runCommand(page, 'liked');
        await delay(450);
        assert.equal(output(page).querySelector('.commandWait').textContent, 'Loading liked songs…');
        releaseLiked();
        await liked;
        assert.equal(output(page).querySelector('.commandWait'), null);
        assert.equal(output(page).querySelectorAll('.likedBlock .trackName').length, 2);
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

test('likely command typos are explained and run automatically', async () => {
    await withPage({ catalog: tracks(['a', 'b']) }, async (page) => {
        await runCommand(page, 'githu');
        assert.match(output(page).textContent, /I think you meant "github"\. Running it/);
        assert.equal(output(page).querySelector('a').href, 'https://github.com/lucaohost');

        output(page).replaceChildren();
        await runCommand(page, 'muisc Song a');
        assert.match(output(page).textContent, /I think you meant "music Song a"\. Running it/);
        assert.equal(output(page).querySelector('.spotifyHost').dataset.spotifyUri, 'spotify:track:a');

        output(page).replaceChildren();
        await runCommand(page, 'chagnelog');
        assert.match(output(page).textContent, /I think you meant "changelog"\. Running it/);
        assert.ok(output(page).querySelector('.changelogVersion'));
    });
});

test('an ambiguous short typo is not run as a command', async () => {
    await withPage({}, async (page) => {
        await runCommand(page, 'rmx');
        assert.match(output(page).textContent, /not found/);
        assert.doesNotMatch(output(page).textContent, /I think you meant/);
    });
});

test('an unknown command reports that it was not found', async () => {
    await withPage({}, async (page) => {
        await runCommand(page, 'definitely-missing');
        assert.match(output(page).textContent, /not found/);
        output(page).replaceChildren();
        await runCommand(page, 'helpdesc');
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
    assert.match(top, /^2\.6\.4 - 2026-10-01/);
    assert.match(top, /starts that song's radio/);
    assert.match(changelog, /radio playlist/);
    assert.match(changelog, /similar songs queued/);
    assert.match(changelog, /password is incorrect/);
    assert.match(changelog, /Snooker sign-in says the password is incorrect/);
    assert.match(changelog, /no longer cuts the password short/);
    assert.match(changelog, /nothing typed/);
    assert.match(changelog, /lucas@bash/);
    assert.match(changelog, /already playing/);
    assert.match(changelog, /closes the browser tab/);
    assert.match(changelog, /2\.5\.0 - 2026-09-30/);
    assert.match(changelog, /loading status/);
    assert.match(changelog, /skeleton/);
    assert.match(changelog, /without waiting/);
    assert.match(changelog, /visitors' randomized songs/);
    assert.match(changelog, /one color in light mode/);
    assert.match(changelog, /command typos/);
    assert.match(changelog, /clear visitor music/);
    assert.match(changelog, /sharing immediately/);
    assert.match(changelog, /Hidden players/);
    assert.match(changelog, /Only Lucas/);
    assert.match(changelog, /password/i);
    assert.match(changelog, /@lucaohost\.app/);
    assert.match(changelog, /Rádio/);
    assert.match(changelog, /thick green block/);
    assert.match(changelog, /keeps that song going/);
    assert.match(changelog, /remains on screen/);
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
            const rail = row.querySelector('.playRail');
            const button = rail.querySelector('.nextMusic');
            const radio = rail.querySelector('.trackRadio');
            assert.equal(host.nextElementSibling, rail);
            assert.equal(radio.nextElementSibling, button);
            assert.equal(button.parentElement, rail);
        }
        const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
        assert.match(css, /\.musicPlay\s*\{[^}]*display:\s*flex/);
        assert.match(css, /\.musicPlay\s*\{[^}]*flex-direction:\s*row/);
        assert.match(css, /\.musicPlay \.spotifyHost\s*\{[^}]*flex:\s*1/);
        assert.match(css, /\.playRail\s*\{[^}]*flex-direction:\s*column/);
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
    assert.match(css, /\.nextMusic,\s*\.trackRadio\s*\{[^}]*touch-action:\s*pan-y/);
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

function pressEnter(page, value) {
    const input = page.document.getElementById('input');
    if (value !== undefined) {
        if (input.tagName === 'INPUT') input.value = value;
        else {
            input.innerText = value;
            input.textContent = value;
        }
    }
    input.dispatchEvent(new page.window.KeyboardEvent('keydown', {
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
        assert.match(css, /\.nextMusic,\s*\.trackRadio\s*\{[^}]*border-radius:\s*50%/);
        assert.match(css, /\.nextMusic,\s*\.trackRadio\s*\{[^}]*background:\s*#2c2c2c/);
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

test('login asks for the password and does not offer a user list', async () => {
    await withPage({}, async (page) => {
        await runCommand(page, 'login');
        assert.match(output(page).textContent, /Type the password for lucas@lucaohost\.app/);
        assert.equal(output(page).querySelector('.loginUser'), null);
        await runCommand(page, 'bola');
        await delay(20);
        assert.match(output(page).textContent, /Auth indisponível/);
        assert.equal(output(page).textContent.includes('bola'), false);
    });
});

test('a wrong terminal password says it is incorrect and does not describe its shape', async () => {
    await withPage({}, async (page) => {
        function auth() {
            return {
                setPersistence() { return Promise.resolve(); },
                signInWithEmailAndPassword() {
                    const error = new Error('The password is invalid or the user does not have a password.');
                    error.code = 'auth/wrong-password';
                    return Promise.reject(error);
                },
                currentUser: null
            };
        }
        auth.Auth = { Persistence: { LOCAL: 'local' } };
        page.window.firebase = {
            apps: [{ name: '[DEFAULT]' }],
            initializeApp() { return {}; },
            auth: auth
        };
        await runCommand(page, 'login');
        await runCommand(page, 'no');
        await delay(20);
        assert.equal(output(page).lastElementChild.textContent, 'Incorrect password.');
        await runCommand(page, 'login');
        await runCommand(page, 'bola');
        await delay(20);
        assert.equal(output(page).lastElementChild.textContent, 'Incorrect password.');
        assert.equal(output(page).textContent.includes('bola'), false);
        assert.doesNotMatch(output(page).textContent, /4 letras|quatro|dígito|digito/i);
    });
});

test('a successful terminal login ends at the account name without a period', async () => {
    await withPage({}, async (page) => {
        page.window.SiteSession.isOperator = function () { return false; };
        page.window.SiteSession.signIn = function () { return Promise.resolve(); };
        await runCommand(page, 'login');
        await runCommand(page, 'bola');
        await delay(20);
        assert.equal(output(page).lastElementChild.textContent, 'Signed in as lucas@lucaohost.app');
    });
});

test('the prompt names Lucas while that session is active', async () => {
    await withPage({}, async (page) => {
        page.window.SiteSession.isOperator = function () { return true; };
        page.window.syncTerminalIdentity();
        assert.match(page.document.querySelector('.input-line .path').textContent, /lucas@bash/);
        assert.match(page.document.querySelector('.terminal-title').textContent, /lucas@bash/);
    });
});

test('a visitor stores music apart from Lucas and cannot clear his list', async () => {
    await withPage({ catalog: tracks(['a']), played: { tracks: {}, cycle: {}, generation: 1 } }, async (page) => {
        await runCommand(page, 'music');
        await delay(20);
        assert.ok(page.fetches.some((entry) => entry.method === 'PUT' && entry.href.includes('visitorMusic/tracks/')));
        assert.equal(page.fetches.some((entry) => entry.href.includes('playedMusic')), false);
        const rail = output(page).querySelector('.playRail');
        const radio = rail.querySelector('.trackRadio');
        assert.equal(radio.getAttribute('aria-label'), 'Radio');
        assert.equal(radio.nextElementSibling.classList.contains('nextMusic'), true);
        assert.equal(await radioHref(page), songRadioHref('a', 'radio-a'));
        page.fetches.length = 0;
        await runCommand(page, 'clear music');
        assert.equal(output(page).lastElementChild.textContent, 'Only Lucas can clear the randomized songs.\nUse login.');
        await runCommand(page, 'clear visitor music');
        assert.equal(page.fetches.some((entry) => entry.method === 'DELETE'), false);
    });
});

test('Lucas can clear his randomized list and the visitor list separately', async () => {
    await withPage({ catalog: tracks(['a']), played: { tracks: {}, cycle: {}, generation: 1 } }, async (page) => {
        page.window.SiteSession.isOperator = function () { return true; };
        await runCommand(page, 'music');
        await delay(20);
        assert.ok(page.fetches.some((entry) => entry.method === 'PUT' && entry.href.includes('playedMusic/tracks/')));
        assert.equal(page.fetches.some((entry) => entry.href.includes('visitorMusic')), false);
        await runCommand(page, 'clear music');
        assert.ok(page.fetches.some((entry) => entry.method === 'DELETE' && entry.href.includes('playedMusic.json')));
        assert.match(output(page).textContent, /Randomized songs cleared/);
        page.fetches.length = 0;
        await runCommand(page, 'clear visitor music');
        assert.ok(page.fetches.some((entry) => entry.method === 'DELETE' && entry.href.includes('visitorMusic.json')));
        assert.equal(page.fetches.some((entry) => entry.href.includes('playedMusic')), false);
        assert.match(output(page).textContent, /Visitor randomized songs cleared/);
    });
});

test('clear visitor music sends Lucas Firebase token', async () => {
    await withPage({}, async (page) => {
        page.window.SiteSession.isOperator = function () { return true; };
        page.window.SiteSession.idToken = function () { return Promise.resolve('lucas-token'); };
        await runCommand(page, 'clear visitor music');
        const deleted = page.fetches.find((entry) => entry.method === 'DELETE' && entry.href.includes('visitorMusic.json'));
        assert.ok(deleted);
        assert.match(deleted.href, /[?&]auth=lucas-token/);
        assert.equal(page.fetches.some((entry) => entry.method === 'DELETE' && entry.href.includes('playedMusic')), false);
        assert.match(output(page).textContent, /Visitor randomized songs cleared/);
    });
});

test('social links stay closed when the touch turns into a drag', async () => {
    await withPage({}, async (page) => {
        usePhone(page);
        await runCommand(page, 'social');
        const link = output(page).querySelector('.socialLink');
        assert.equal(output(page).querySelectorAll('.socialLink').length, 4);
        assert.equal(output(page).querySelector('table'), null);
        let opened = 0;
        page.window.open = function () { opened += 1; };
        link.dispatchEvent(touchEvent(page, 'touchstart', 20, 20));
        page.document.dispatchEvent(touchEvent(page, 'touchmove', 20, 80));
        link.dispatchEvent(touchEvent(page, 'touchend', 20, 80));
        assert.equal(opened, 0);
        link.dispatchEvent(touchEvent(page, 'touchstart', 20, 20));
        link.dispatchEvent(touchEvent(page, 'touchend', 22, 22));
        assert.equal(opened, 1);
    });
});

test('the desktop caret is a thick green block', () => {
    const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
    assert.match(css, /@media \(min-width: 769px\)\s*\{[^}]*\.block-caret\s*\{[^}]*width:\s*0\.55ch;[^}]*background:\s*#4CAF50/s);
});

function songRadioHref(trackId, playlistId, medium) {
    return 'https://open.spotify.com/track/' + trackId
        + '?go=1&utm_source=embed_player_p&utm_medium=' + (medium || 'desktop')
        + '&play=true&context=' + encodeURIComponent('spotify:playlist:' + playlistId);
}

async function radioHref(page) {
    const radio = output(page).querySelector('.trackRadio');
    for (let i = 0; i < 20; i++) {
        const href = radio.getAttribute('href') || '';
        if (href.indexOf('https://open.spotify.com/track/') === 0) return href;
        await delay(10);
    }
    return radio.getAttribute('href');
}

test('the radio link opens the song radio playlist Spotify returns for that track', async () => {
    const trackId = '352FuGmGJClPjojSYjNrXG';
    const playlistId = '37i9dQZF1E8RSu251xkcZc';
    await withPage({
        catalog: tracks([trackId]),
        played: { tracks: {}, cycle: {}, generation: 1 },
        songRadio: { [trackId]: playlistId }
    }, async (page) => {
        await runCommand(page, 'music');
        const href = await radioHref(page);
        assert.equal(href, songRadioHref(trackId, playlistId));
        assert.equal(href.includes('/station/'), false);
        assert.match(href, /[?&]go=1/);
        assert.match(href, /[?&]play=true/);
        const lookup = page.fetches.find((entry) => entry.href.includes('/seed_to_playlist/'));
        assert.ok(lookup);
        assert.match(decodeURIComponent(lookup.href), new RegExp('spotify:track:' + trackId));
        const authorization = lookup.headers.Authorization || lookup.headers.authorization;
        assert.equal(authorization, 'Bearer embed-token');
    });
});

test('the radio link on a phone uses the mobile handoff', async () => {
    await withPage({ catalog: tracks(['a']), played: { tracks: {}, cycle: {}, generation: 1 } }, async (page) => {
        usePhone(page);
        await runCommand(page, 'music');
        assert.equal(await radioHref(page), songRadioHref('a', 'radio-a', 'mobile'));
    });
});

test('the radio link follows the song now in the player', async () => {
    await withPage({ catalog: tracks(['a', 'b', 'c']) }, async (page) => {
        await runCommand(page, 'liked');
        const buttons = () => output(page).querySelectorAll('.trackPlay');
        assert.equal(await radioHref(page), songRadioHref(buttons()[0].dataset.trackId, 'radio-' + buttons()[0].dataset.trackId));
        buttons()[1].click();
        assert.equal(await radioHref(page), songRadioHref(buttons()[1].dataset.trackId, 'radio-' + buttons()[1].dataset.trackId));
    });
});

test('enter with nothing typed skips a line and keeps the prompt', async () => {
    await withPage({}, async (page) => {
        pressEnter(page, '');
        pressEnter(page, '   ');
        const lines = [...output(page).children];
        assert.equal(lines.length, 2);
        lines.forEach((line) => {
            assert.equal(line.querySelector('.path').textContent, 'lucaohost@bash:~$');
            assert.equal(line.textContent.trim(), 'lucaohost@bash:~$');
        });
        const input = page.document.getElementById('input');
        assert.equal(input.textContent, '');
        assert.equal(input.innerText, '');
        assert.match(page.document.querySelector('.input-line .path').textContent, /lucaohost@bash/);
        page.document.getElementById('input').dispatchEvent(new page.window.KeyboardEvent('keydown', {
            key: 'ArrowUp',
            bubbles: true,
            cancelable: true
        }));
        assert.equal(page.document.getElementById('input').textContent, '');
    });
});

test('enter with nothing typed keeps Lucas on the new line', async () => {
    await withPage({}, async (page) => {
        page.window.SiteSession.isOperator = function () { return true; };
        page.window.syncTerminalIdentity();
        pressEnter(page, '');
        pressEnter(page, 'whoami');
        const lines = [...output(page).children];
        assert.equal(lines[0].querySelector('.path').textContent, 'lucas@bash:~$');
        assert.equal(lines[1].querySelector('.path').textContent, 'lucas@bash:~$');
        assert.match(lines[1].textContent, /whoami/);
        assert.match(page.document.querySelector('.input-line .path').textContent, /lucas@bash/);
    });
});

test('exit closes the tab instead of a blank page', async () => {
    await withPage({}, async (page) => {
        const calls = [];
        page.window.close = function () { calls.push('close'); };
        page.window.opener = null;
        const before = page.window.location.href;
        await runCommand(page, 'exit');
        await delay(20);
        assert.deepEqual(calls, ['close']);
        assert.equal(page.window.location.href, before);
        assert.equal(page.window.location.href.includes('about:blank'), false);
    });
});
