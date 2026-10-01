var SiteSession = (function () {
    var DOMAIN = '@lucaohost.app';
    var TAIL = 'sn';
    var OPERATOR = 'lucas';
    var config = {
        apiKey: 'AIzaSyBsP4YSbp3qeK-ViyVXhWp8Jf3KetimveU',
        authDomain: 'snooker-scoreboard2.firebaseapp.com',
        projectId: 'snooker-scoreboard2',
        storageBucket: 'snooker-scoreboard2.firebasestorage.app',
        messagingSenderId: '695835616380',
        appId: '1:695835616380:web:17fc21b1d88f26c63055f9'
    };

    function localPart(id) {
        return String(id || '').trim().toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
    }

    function emailFor(id) {
        return localPart(id) + DOMAIN;
    }

    function wordOk(word) {
        return /^[A-Za-z0-9]{4}$/.test(String(word || '').trim());
    }

    function passwordFor(word) {
        return String(word || '').trim() + TAIL;
    }

    function sideLabel(names, one, many) {
        return (names.length > 1 ? many : one) + ' ' + names.join(' e ');
    }

    function confirmMatch(winners, losers) {
        return 'Confirma a adição da partida com ' + sideLabel(winners, 'vencedor', 'vencedores') + ' e ' + sideLabel(losers, 'perdedor', 'perdedores') + '?';
    }

    function namedApp(name) {
        if (typeof firebase === 'undefined' || !firebase.apps) return null;
        for (var i = 0; i < firebase.apps.length; i++) {
            if (firebase.apps[i].name === name) return firebase.apps[i];
        }
        return null;
    }

    function auth() {
        if (typeof firebase === 'undefined' || !firebase.auth) return null;
        if (!namedApp('[DEFAULT]')) firebase.initializeApp(config);
        return firebase.auth();
    }

    function email() {
        var client = auth();
        var user = client && client.currentUser;
        return user && user.email ? user.email : '';
    }

    function signedInId() {
        var value = email();
        if (value.indexOf(DOMAIN) !== value.length - DOMAIN.length) return '';
        return value.slice(0, -DOMAIN.length);
    }

    function isOperator() {
        return email() === emailFor(OPERATOR);
    }

    function idToken() {
        var client = auth();
        var user = client && client.currentUser;
        if (!user || typeof user.getIdToken !== 'function') return Promise.resolve('');
        return user.getIdToken().catch(function () { return ''; });
    }

    function signIn(id, word) {
        var client = auth();
        if (!client) return Promise.reject(new Error('Auth indisponível.'));
        if (localPart(id) !== OPERATOR && id !== OPERATOR) {
            return Promise.reject(new Error('Só o Lucas entra por aqui.'));
        }
        if (!wordOk(word)) return Promise.reject(new Error('A senha tem 4 letras ou números.'));
        return client.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(function () {
            return client.signInWithEmailAndPassword(emailFor(OPERATOR), passwordFor(word));
        });
    }

    function signInPlayer(id, word) {
        var client = auth();
        if (!client) return Promise.reject(new Error('Auth indisponível.'));
        if (!localPart(id)) return Promise.reject(new Error('Escolha um jogador.'));
        if (!wordOk(word)) return Promise.reject(new Error('A senha tem 4 letras ou números.'));
        return client.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(function () {
            return client.signInWithEmailAndPassword(emailFor(id), passwordFor(word));
        });
    }

    function signOut() {
        var client = auth();
        if (!client) return Promise.resolve();
        return client.signOut();
    }

    function writer() {
        if (typeof firebase === 'undefined' || !firebase.auth) return null;
        var app = namedApp('pin-writer') || firebase.initializeApp(config, 'pin-writer');
        return firebase.auth(app);
    }

    function setPlayerPassword(id, currentWord, nextWord) {
        if (!isOperator()) return Promise.reject(new Error('Só o Lucas troca a senha.'));
        if (!wordOk(nextWord)) return Promise.reject(new Error('A senha nova tem 4 letras ou números.'));
        var client = writer();
        if (!client) return Promise.reject(new Error('Auth indisponível.'));
        var address = emailFor(id);
        var next = passwordFor(nextWord);
        return client.createUserWithEmailAndPassword(address, next).then(function () {
            return client.signOut();
        }).catch(function (error) {
            if (!error || error.code !== 'auth/email-already-in-use') throw error;
            if (!wordOk(currentWord)) {
                var needsCurrent = new Error('Essa conta já existe. Informe a senha atual.');
                needsCurrent.code = 'auth/needs-current-word';
                throw needsCurrent;
            }
            return client.signInWithEmailAndPassword(address, passwordFor(currentWord)).then(function (cred) {
                return cred.user.updatePassword(next);
            }).then(function () {
                return client.signOut();
            });
        });
    }

    function watch(fn) {
        var client = auth();
        if (!client) {
            fn(null);
            return function () {};
        }
        return client.onAuthStateChanged(fn);
    }

    return {
        DOMAIN: DOMAIN,
        OPERATOR: OPERATOR,
        localPart: localPart,
        emailFor: emailFor,
        wordOk: wordOk,
        passwordFor: passwordFor,
        confirmMatch: confirmMatch,
        email: email,
        signedInId: signedInId,
        isOperator: isOperator,
        idToken: idToken,
        signIn: signIn,
        signInPlayer: signInPlayer,
        signOut: signOut,
        setPlayerPassword: setPlayerPassword,
        watch: watch
    };
})();
