const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'session.js'), 'utf8'), context);
const SiteSession = context.SiteSession;

test('a player email is the name plus the fixed domain', () => {
    assert.equal(SiteSession.emailFor('Lucas'), 'lucas@s.co');
    assert.equal(SiteSession.emailFor('Lourenço'), 'lourenco@s.co');
    assert.equal(SiteSession.emailFor('paulinho'), 'paulinho@s.co');
    assert.equal(SiteSession.DOMAIN, '@s.co');
});

test('a password is the 4-character word plus the two fixed characters', () => {
    assert.equal(SiteSession.wordOk('bola'), true);
    assert.equal(SiteSession.wordOk('Bola'), true);
    assert.equal(SiteSession.wordOk('1234'), true);
    assert.equal(SiteSession.wordOk('12'), false);
    assert.equal(SiteSession.wordOk('bolas'), false);
    assert.equal(SiteSession.passwordFor('bola'), 'bolasn');
    assert.equal(SiteSession.passwordFor('Ab12'), 'Ab12sn');
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
    assert.match(text, /lucas@s\.co/);
    assert.match(text, /visitorMusic/);
    assert.equal(text.includes('snooker.lucaohost.app'), false);
    assert.doesNotMatch(text, /"pins":\{"\.read":true/);
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
