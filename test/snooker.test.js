const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(check, timeout = 500) {
    const started = Date.now();
    while (!check()) {
        if (Date.now() - started > timeout) throw new Error('Timed out waiting for the snooker flow.');
        await delay(5);
    }
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

async function bootSnooker(options) {
    const settings = options || {};
    const html = fs.readFileSync(path.join(root, 'snooker', 'index.html'), 'utf8')
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    const dom = new JSDOM(html, {
        url: 'https://lucaohost.github.io/snooker/',
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
        removeListener() {}
    });

    const players = {
        lucas: { name: 'Lucas', wins: 4, games: 8, season: 2026, hidden: false },
        paulinho: { name: 'Paulinho', wins: 3, games: 8, season: 2026, hidden: false },
        raquel: { name: 'Raquel', wins: 2, games: 8, season: 2026, hidden: false }
    };
    const reads = [];
    const pushes = [];
    const writes = [];

    function valueAt(refPath) {
        if (refPath === 'seasons/2026/players') return clone(players);
        if (refPath === 'players') return {};
        if (refPath === 'seasons/2026/matches') return {};
        return {};
    }

    const database = {
        ref(refPath) {
            return {
                once: async () => {
                    reads.push(refPath);
                    return { val: () => valueAt(refPath) };
                },
                transaction(update, done) {
                    const prefix = 'seasons/2026/players/';
                    const id = refPath.startsWith(prefix) ? refPath.slice(prefix.length) : '';
                    const next = update(id && players[id] ? clone(players[id]) : null);
                    if (id && next) players[id] = next;
                    writes.push({ path: refPath, type: 'transaction' });
                    done(null, true);
                },
                async push(value) {
                    pushes.push({ path: refPath, value: clone(value) });
                    return { key: 'match-1' };
                },
                async set(value) {
                    writes.push({ path: refPath, type: 'set', value });
                }
            };
        }
    };

    window.firebase = {
        apps: [],
        initializeApp() {
            const app = { name: '[DEFAULT]' };
            this.apps.push(app);
            return app;
        },
        database() {
            return database;
        }
    };

    const modalInstances = new WeakMap();
    class Modal {
        constructor(element) {
            this.element = element;
            modalInstances.set(element, this);
        }
        show() {
            this.element.classList.add('show');
        }
        hide() {
            this.element.classList.remove('show');
            this.element.dispatchEvent(new window.Event('hidden.bs.modal'));
        }
        static getInstance(element) {
            return modalInstances.get(element) || null;
        }
        static getOrCreateInstance(element) {
            return Modal.getInstance(element) || new Modal(element);
        }
    }

    class Toast {
        constructor(element) {
            this.element = element;
        }
        show() {
            this.element.dataset.shown = '1';
        }
    }

    window.bootstrap = { Modal, Toast };
    window.fillSessionUsers = function () {};
    window.bindSessionBar = function () {};

    const operator = settings.operator !== false;
    window.SiteSession = {
        DOMAIN: '@lucaohost.app',
        OPERATOR: 'lucas',
        email() { return operator ? 'lucas@lucaohost.app' : ''; },
        isOperator() { return operator; },
        signedInId() { return operator ? 'lucas' : ''; },
        localPart(value) { return String(value || '').toLowerCase(); },
        wordOk() { return true; },
        confirmMatch(winners, losers) {
            return winners.join(' e ') + ' / ' + losers.join(' e ');
        },
        watch(fn) {
            fn();
            return function () {};
        },
        signOut() { return Promise.resolve(); },
        setPlayerPassword() { return Promise.resolve(); }
    };

    const shares = [];
    Object.defineProperty(window.navigator, 'share', {
        configurable: true,
        value: async (payload) => {
            shares.push(payload);
        }
    });
    Object.defineProperty(window.navigator, 'canShare', {
        configurable: true,
        value: () => true
    });
    window.html2canvas = async () => ({
        toBlob(callback) {
            callback(new window.Blob(['ranking'], { type: 'image/png' }));
        }
    });
    window.confirm = () => true;

    const script = window.document.createElement('script');
    script.textContent = fs.readFileSync(path.join(root, 'snooker', 'app.js'), 'utf8');
    window.document.body.appendChild(script);
    Modal.getOrCreateInstance(window.document.getElementById('addMatchModal')).show();
    window.loadPlayers();
    await waitFor(() => window.document.querySelector('.team1-player1 option[value="lucas"]'));

    return {
        window,
        document: window.document,
        reads,
        pushes,
        writes,
        shares,
        close() {
            window.close();
        }
    };
}

test('a confirmed match automatically shares as soon as saving finishes', async () => {
    const page = await bootSnooker({ operator: true });
    try {
        page.document.querySelector('.team1-player1').value = 'lucas';
        page.document.querySelector('.team2-player1').value = 'paulinho';
        page.document.getElementById('match-form').dispatchEvent(new page.window.Event('submit', {
            bubbles: true,
            cancelable: true
        }));

        await waitFor(() => !page.document.getElementById('match-confirmation').hidden);
        assert.equal(page.document.getElementById('confirm-match-winners').textContent, 'Lucas');
        assert.equal(page.document.getElementById('confirm-match-losers').textContent, 'Paulinho');
        page.document.getElementById('confirm-match-submit').click();

        await waitFor(() => page.pushes.length === 1);
        await waitFor(() => page.shares.length === 1);
        assert.equal(page.shares[0].text, 'Vencedores: Lucas\nPerdedores: Paulinho');
        assert.equal(page.shares[0].files[0].name, 'snooker-ranking.png');
        assert.equal(page.pushes[0].path, 'seasons/2026/matches');
    } finally {
        page.close();
    }
});

test('a visitor cannot start a backup download or read backup data', async () => {
    const page = await bootSnooker({ operator: false });
    try {
        await delay(20);
        const readsBefore = page.reads.length;
        await page.window.downloadBackup();
        assert.equal(page.reads.length, readsBefore);
        assert.equal(page.document.getElementById('toast-message').textContent, 'Só o Lucas pode baixar o backup.');
        assert.equal(page.document.getElementById('backup-btn').style.display, 'none');
    } finally {
        page.close();
    }
});
