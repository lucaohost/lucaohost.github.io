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

function syncSessionToggle() {
    var button = document.getElementById('session-toggle');
    var panel = document.getElementById('session-form');
    if (!button || typeof SiteSession === 'undefined') return;
    var signedIn = !!SiteSession.email();
    button.innerHTML = signedIn
        ? '<i class="fas fa-right-from-bracket" aria-hidden="true"></i>'
        : '<i class="fas fa-right-to-bracket" aria-hidden="true"></i>';
    button.setAttribute('aria-label', signedIn ? 'Sair' : 'Entrar');
    if (signedIn && panel) panel.hidden = true;
}

function bindSessionBar(loadUsers) {
    var button = document.getElementById('session-toggle');
    var form = document.getElementById('session-form');
    var panel = form;
    var domain = document.querySelector('.session-domain');
    if (domain && typeof SiteSession !== 'undefined') domain.textContent = SiteSession.DOMAIN;
    if (button) {
        button.addEventListener('click', function () {
            if (typeof SiteSession === 'undefined') return;
            if (SiteSession.email()) {
                SiteSession.signOut();
                return;
            }
            if (loadUsers) loadUsers();
            if (panel) panel.hidden = !panel.hidden;
        });
    }
    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var select = document.getElementById('session-user');
            var word = document.getElementById('session-word');
            var error = document.getElementById('session-error');
            SiteSession.signInPlayer(select.value, word.value).then(function () {
                if (error) error.textContent = '';
                word.value = '';
            }).catch(function (err) {
                if (error) error.textContent = (err && err.message) || 'Não entrou.';
            });
        });
    }
    if (typeof SiteSession === 'undefined') return function () {};
    return SiteSession.watch(function () {
        syncSessionToggle();
    });
}
