const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'session.js'), 'utf8'), context);
const SiteSession = context.SiteSession;

test('idToken is empty when auth is unavailable', async () => {
    assert.equal(await SiteSession.idToken(), '');
});

test('a player email is the name plus the fixed domain', () => {
    assert.equal(SiteSession.emailFor('Lucas'), 'lucas@lucaohost.app');
    assert.equal(SiteSession.emailFor('Lourenço'), 'lourenco@lucaohost.app');
    assert.equal(SiteSession.emailFor('paulinho'), 'paulinho@lucaohost.app');
    assert.equal(SiteSession.DOMAIN, '@lucaohost.app');
});

function installFirebase(signIn) {
    function auth() {
        return {
            setPersistence() { return Promise.resolve(); },
            signInWithEmailAndPassword: signIn,
            currentUser: null
        };
    }
    auth.Auth = { Persistence: { LOCAL: 'local' } };
    context.firebase = {
        apps: [{ name: '[DEFAULT]' }],
        initializeApp() { return { name: '[DEFAULT]' }; },
        auth: auth
    };
}

test('a password is the 4-character word plus the two fixed characters', () => {
    assert.equal(SiteSession.wordOk('bola'), true);
    assert.equal(SiteSession.wordOk('Bola'), true);
    assert.equal(SiteSession.wordOk('1234'), true);
    assert.equal(SiteSession.wordOk('12'), false);
    assert.equal(SiteSession.wordOk('bolas'), false);
    assert.equal(SiteSession.passwordFor('bola'), 'bolasn');
    assert.equal(SiteSession.passwordFor('Ab12'), 'Ab12sn');
});

test('sign-in says the password is incorrect and does not describe its shape', async () => {
    const calls = [];
    installFirebase((email, password) => {
        calls.push({ email: email, password: password });
        const error = new Error('The password is invalid or the user does not have a password.');
        error.code = 'auth/wrong-password';
        return Promise.reject(error);
    });
    try {
        const short = await SiteSession.signIn('lucas', 'no').then(() => null, (error) => error);
        const wrong = await SiteSession.signIn('lucas', 'bola').then(() => null, (error) => error);
        assert.equal(short.message, 'Incorrect password.');
        assert.equal(wrong.message, 'Incorrect password.');
        assert.equal(calls.length, 1);
        assert.equal(calls[0].password, 'bolasn');
        const playerShort = await SiteSession.signInPlayer('paulinho', '12').then(() => null, (error) => error);
        const playerWrong = await SiteSession.signInPlayer('paulinho', 'bola').then(() => null, (error) => error);
        assert.equal(playerShort.message, 'Senha incorreta.');
        assert.equal(playerWrong.message, 'Senha incorreta.');
        assert.equal(calls.length, 2);
        const said = short.message + wrong.message + playerShort.message + playerWrong.message;
        assert.doesNotMatch(said, /4|quatro|letra|número|numero|dígito|digito/i);
    } finally {
        delete context.firebase;
    }
});

test('snooker sign-in shows an incorrect password and the field has no length cap', async () => {
    const dom = new JSDOM('<!doctype html><body><form id="session-form"><select id="session-user"><option value="paulinho">Paulinho</option></select><input id="session-word" type="password"><p id="session-error"></p></form></body>');
    const sandbox = { document: dom.window.document, console: console };
    function auth() {
        return {
            setPersistence() { return Promise.resolve(); },
            signInWithEmailAndPassword() {
                const error = new Error('The password is invalid or the user does not have a password.');
                error.code = 'auth/invalid-credential';
                return Promise.reject(error);
            },
            onAuthStateChanged(fn) {
                if (fn) fn(null);
                return function () {};
            },
            currentUser: null
        };
    }
    auth.Auth = { Persistence: { LOCAL: 'local' } };
    sandbox.firebase = {
        apps: [{ name: '[DEFAULT]' }],
        initializeApp() { return { name: '[DEFAULT]' }; },
        auth: auth
    };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(root, 'session.js'), 'utf8'), sandbox);
    vm.runInContext(fs.readFileSync(path.join(root, 'snooker', 'auth-bar.js'), 'utf8'), sandbox);
    sandbox.bindSessionBar();
    const form = dom.window.document.getElementById('session-form');
    const word = dom.window.document.getElementById('session-word');
    const error = dom.window.document.getElementById('session-error');
    word.value = 'no';
    form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(error.textContent, 'Senha incorreta.');
    word.value = 'bola';
    form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(error.textContent, 'Senha incorreta.');
    const ranking = fs.readFileSync(path.join(root, 'snooker', 'index.html'), 'utf8');
    const history = fs.readFileSync(path.join(root, 'snooker', 'history.html'), 'utf8');
    const app = fs.readFileSync(path.join(root, 'snooker', 'app.js'), 'utf8');
    const sessionSource = fs.readFileSync(path.join(root, 'session.js'), 'utf8');
    [ranking, history, app, sessionSource].forEach((source) => {
        assert.equal(source.includes('maxlength="4"'), false);
        assert.equal(source.includes('4 letras'), false);
        assert.equal(source.includes('A senha tem'), false);
        assert.equal(source.includes('A senha nova tem'), false);
    });
});

test('match confirmation names winners and losers', () => {
    assert.equal(
        SiteSession.confirmMatch(['Lucas'], ['Paulinho']),
        'Confirma a adição da partida com vencedor Lucas e perdedor Paulinho?'
    );
    assert.equal(
        SiteSession.confirmMatch(['Lucas', 'Raquel'], ['Paulinho', 'Nadjane']),
        'Confirma a adição da partida com vencedores Lucas e Raquel e perdedores Paulinho e Nadjane?'
    );
});

test('firebase rules keep passwords unreadable and limit deletes to Lucas', () => {
    const rules = JSON.parse(fs.readFileSync(path.join(root, 'snooker', 'firebase-rules.json'), 'utf8'));
    assert.equal(rules.rules.pins['.read'], false);
    assert.equal(rules.rules.pins['.write'], false);
    assert.equal(rules.rules.seasons.$season.pins['.read'], false);
    assert.equal(rules.rules.seasons.$season.pins['.write'], false);
    const text = JSON.stringify(rules);
    assert.match(text, /lucas@lucaohost\.app/);
    assert.match(text, /visitorMusic/);
    assert.match(text, /"stack"/);
    assert.match(text, /!newData\.exists\(\) && auth\.token\.email == 'lucas@lucaohost\.app'/);
    assert.equal(text.includes('snooker.lucaohost.app'), false);
    assert.doesNotMatch(text, /"pins":\{"\.read":true/);
});

test('the ranking button shows Entrar or the signed-in name', () => {
    const dom = new JSDOM('<!doctype html><body><button id="session-toggle" type="button"></button><form id="session-form" hidden><select id="session-user"></select><div class="session-fields"></div><div class="session-signed" hidden><p class="session-status"></p><button id="session-leave" type="button">Sair</button></div></form></body>');
    const session = {
        DOMAIN: '@lucaohost.app',
        OPERATOR: 'lucas',
        current: '',
        email() { return this.current || ''; },
        signedInId() { return this.current ? 'lucas' : ''; },
        localPart(id) { return String(id || '').toLowerCase(); },
        watch(fn) { fn(); return function () {}; },
        signOut() { return Promise.resolve(); }
    };
    const sandbox = {
        document: dom.window.document,
        SiteSession: session
    };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(root, 'snooker', 'auth-bar.js'), 'utf8'), sandbox);
    sandbox.syncSessionToggle();
    assert.equal(dom.window.document.querySelector('.session-name').textContent, 'Entrar');
    assert.equal(dom.window.document.getElementById('session-toggle').classList.contains('is-in'), false);
    session.current = 'lucas@lucaohost.app';
    dom.window.document.getElementById('session-user').innerHTML = '<option value="lucas">Lucas</option>';
    sandbox.syncSessionToggle();
    assert.equal(dom.window.document.querySelector('.session-name').textContent, 'Lucas');
    assert.equal(dom.window.document.getElementById('session-toggle').classList.contains('is-in'), true);
    sandbox.setSessionOpen(true);
    assert.equal(dom.window.document.getElementById('session-form').hidden, false);
    assert.match(dom.window.document.querySelector('.session-status').textContent, /Lucas/);
});

test('hidden players are left out of the ranking sign-in choices', () => {
    const dom = new JSDOM('<!doctype html><body><select id="session-user"></select></body>');
    const sandbox = {
        document: dom.window.document,
        SiteSession: {
            OPERATOR: 'lucas',
            localPart(id) { return String(id || '').toLowerCase(); }
        }
    };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(root, 'snooker', 'auth-bar.js'), 'utf8'), sandbox);
    sandbox.fillSessionUsers([
        { id: 'paulinho', name: 'Paulinho' },
        { id: 'raquel', name: 'Raquel', hidden: true }
    ]);
    const options = [...dom.window.document.querySelectorAll('#session-user option')].map((option) => option.value);
    assert.deepEqual(options, ['lucas', 'paulinho']);
    assert.equal(options.includes('raquel'), false);
});

test('the ranking sign-in is a select with the domain beside it and the match form has no pins', () => {
    const ranking = fs.readFileSync(path.join(root, 'snooker', 'index.html'), 'utf8');
    assert.match(ranking, /id="session-user"/);
    assert.match(ranking, /class="session-domain"/);
    assert.equal(ranking.includes('pin-input'), false);
    assert.equal(ranking.includes('godsmode'), false);
    const history = fs.readFileSync(path.join(root, 'snooker', 'history.html'), 'utf8');
    assert.match(history, /Registrou/);
    assert.match(history, /delete-match/);
});

test('match confirmation uses the site modal instead of the browser confirm', () => {
    const ranking = fs.readFileSync(path.join(root, 'snooker', 'index.html'), 'utf8');
    const app = fs.readFileSync(path.join(root, 'snooker', 'app.js'), 'utf8');
    assert.match(ranking, /id="match-confirmation"/);
    assert.match(ranking, /id="confirm-match-winners"/);
    assert.match(ranking, /id="confirm-match-losers"/);
    assert.match(ranking, /id="confirm-match-submit"/);
    assert.match(app, /await confirmMatchAddition\(winners, losers\)/);
});

test('the phone history is rendered as wrapping cards without horizontal scrolling', () => {
    const history = fs.readFileSync(path.join(root, 'snooker', 'history.html'), 'utf8');
    const css = fs.readFileSync(path.join(root, 'snooker', 'style.css'), 'utf8');
    assert.match(history, /class="table table-striped table-hover history-table"/);
    assert.match(history, /class="history-author"/);
    assert.match(css, /\.table-responsive:has\(\.history-table\)\s*\{[^}]*overflow:\s*visible/s);
    assert.match(css, /\.history-table tr\.history-match\s*\{[^}]*display:\s*grid/s);
    assert.match(css, /\.history-table tr\.history-match td\s*\{[^}]*overflow-wrap:\s*anywhere/s);
    assert.match(css, /body:not\(\.dark-mode\) \.history-table\.table-striped > tbody > tr\.history-match:nth-of-type\(odd\)/);
    assert.match(css, /--bs-table-bg-type:\s*transparent/);
    assert.match(history, /skeleton-row/);
    assert.match(fs.readFileSync(path.join(root, 'snooker', 'index.html'), 'utf8'), /skeleton-row/);
    assert.match(fs.readFileSync(path.join(root, 'snooker', 'reports.html'), 'utf8'), /report-skeleton/);
});
