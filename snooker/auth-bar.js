function escapeSessionText(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function fillSessionUsers(players) {
    var select = document.getElementById('session-user');
    if (!select || typeof SiteSession === 'undefined') return;
    var current = select.value;
    var options = (players || []).map(function (player) {
        return {
            id: SiteSession.localPart(player.id || player.name),
            name: player.name || player.id
        };
    }).filter(function (player) { return player.id; });
    if (!options.some(function (player) { return player.id === SiteSession.OPERATOR; })) {
        options.push({ id: SiteSession.OPERATOR, name: 'Lucas' });
    }
    options.sort(function (a, b) { return a.name.localeCompare(b.name, 'pt-BR'); });
    select.innerHTML = options.map(function (player) {
        return '<option value="' + escapeSessionText(player.id) + '">' + escapeSessionText(player.name) + '</option>';
    }).join('');
    if (current) select.value = current;
}

function sessionLabel() {
    if (typeof SiteSession === 'undefined' || !SiteSession.email()) return '';
    var id = SiteSession.signedInId();
    var select = document.getElementById('session-user');
    if (select) {
        for (var i = 0; i < select.options.length; i++) {
            if (select.options[i].value === id) return select.options[i].text;
        }
    }
    return id ? id.charAt(0).toUpperCase() + id.slice(1) : '';
}

function setSessionOpen(open) {
    var panel = document.getElementById('session-form');
    if (!panel) return;
    var signedIn = typeof SiteSession !== 'undefined' && !!SiteSession.email();
    var fields = panel.querySelector('.session-fields');
    var signed = panel.querySelector('.session-signed');
    var status = panel.querySelector('.session-status');
    if (fields) fields.hidden = signedIn;
    if (signed) signed.hidden = !signedIn;
    if (status) status.textContent = signedIn ? ('Você está como ' + sessionLabel() + '.') : '';
    panel.classList.toggle('is-open', open);
    panel.hidden = !open;
    if (open && !signedIn) {
        var word = document.getElementById('session-word');
        if (word) word.focus();
    }
}

function syncSessionToggle() {
    var button = document.getElementById('session-toggle');
    if (!button || typeof SiteSession === 'undefined') return;
    var signedIn = !!SiteSession.email();
    var label = signedIn ? sessionLabel() : 'Entrar';
    button.classList.toggle('is-in', signedIn);
    button.innerHTML = signedIn
        ? '<span class="session-dot" aria-hidden="true"></span><span class="session-name"></span>'
        : '<i class="fas fa-right-to-bracket" aria-hidden="true"></i><span class="session-name"></span>';
    button.querySelector('.session-name').textContent = label;
    button.setAttribute('aria-label', signedIn ? ('Sair, ' + label) : 'Entrar');
    if (!signedIn) setSessionOpen(false);
}

function bindSessionBar(loadUsers) {
    var button = document.getElementById('session-toggle');
    var form = document.getElementById('session-form');
    var domain = document.querySelector('.session-domain');
    var leave = document.getElementById('session-leave');
    if (domain && typeof SiteSession !== 'undefined') domain.textContent = SiteSession.DOMAIN;
    if (button) {
        button.addEventListener('click', function (event) {
            event.stopPropagation();
            if (typeof SiteSession === 'undefined') return;
            if (loadUsers) loadUsers();
            setSessionOpen(form ? form.hidden : true);
        });
    }
    if (leave) {
        leave.addEventListener('click', function () {
            SiteSession.signOut();
        });
    }
    if (form) {
        form.addEventListener('click', function (event) {
            event.stopPropagation();
        });
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var select = document.getElementById('session-user');
            var word = document.getElementById('session-word');
            var error = document.getElementById('session-error');
            SiteSession.signInPlayer(select.value, word.value).then(function () {
                if (error) error.textContent = '';
                word.value = '';
                setSessionOpen(false);
            }).catch(function (err) {
                if (error) error.textContent = (err && err.message) || 'Não entrou.';
            });
        });
    }
    document.addEventListener('click', function () {
        setSessionOpen(false);
    });
    if (typeof SiteSession === 'undefined') return function () {};
    return SiteSession.watch(function () {
        syncSessionToggle();
    });
}
