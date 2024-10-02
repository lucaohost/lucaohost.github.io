const inputField = document.getElementById('input');
const terminalOutput = document.getElementById('output');
const commands = {
    whoami: "Lucas: Hello, I am a software engineer from Brazil and I really enjoy solving problems with technology.",
    github: "<a href='https://github.com/lucaohost' target='_blank'>https://github.com/lucaohost</a>",
    linkedin: "<a href='https://linkedin.com/in/lucas-reginatto-de-lima' target='_blank'>https://linkedin.com/lucaohost</a>",
    spotify: "<a href='https://open.spotify.com/playlist/2kO4SQsSzH2wYMkNB9lVEC' target='_blank'>https://spotify.com/lucaohost</a>",
    instagram: "<a href='https://instagram.com/lucaohost' target='_blank'>https://instagram.com/lucaohost</a>",
    twitter: "<a href='https://twitter.com/lucaohost' target='_blank'>https://twitter.com/lucaohost</a>",
    share: "Share this site: <a href='https://lucaohost.github.io' target='_blank'>https://lucaohost.github.io</a>",
    rmy: "<a href='https://lucaohost.github.io/random/music' target='_blank'>https://lucaohost.github.io/random/music</a>",
    social: function() {
        return `${this.github}\n${this.linkedin}\n${this.spotify}\n${this.instagram}\n${this.twitter}`;
    },
    clear: function() {
        terminalOutput.innerHTML = '';
    },
    help: function() {
        const items = ['whoami', 'social', 'share', 'rms', 'rmy', 'rmym', 'help', 'clear', 'exit'];
        const cellSize = 8;
        return buildTable(cellSize, items);
    },
    helpDesc: "Type help to see all commands.",
    exit: function() {
        window.close();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    appendOutput(commands["helpDesc"])
    inputField.focus();  // focus in the terminal after page loads
});

document.addEventListener('click', function() {
    const selection = window.getSelection().toString();
    if (!selection) {
        inputField.focus();
    }
});

function processCommand(input) {
    const command = input.trim().toLocaleLowerCase();
    if (commands[command]) {
        if (typeof commands[command] === 'function') {
            appendOutput(commands[command]());
        } else {
            appendOutput(commands[command]);
        }
    } else {
        appendOutput(`Command '${input}' not found.\nType help to see all commands`);
    }
}

function appendOutput(text) {
    const newLine = document.createElement('div');
    if(text !== undefined) {
        newLine.innerHTML = text;
        terminalOutput.appendChild(newLine);
    }
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function onEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = inputField.innerText.trim();
        appendOutput(`<span class="path">lucaohost@bash:~$</span> ${input}`);
        processCommand(input);
        inputField.innerText = '';
    }
}

inputField.addEventListener('keydown', onEnter);

function buildTable(cellSize, items) {
    const cols = 3;
    const rows = Math.ceil(items.length / cols);

    const createBorder = (left, middle, right) => {
        return left + ('─'.repeat(cellSize) + middle).repeat(cols - 1) + '─'.repeat(cellSize) + right;
    };

    const createSeparator = () => createBorder('├', '┼', '┤');

    const createRow = (rowItems) => {
        return '│' + rowItems.map(item => {
            const padding = cellSize - item.length;
            const leftPadding = Math.floor(padding / 2);
            const rightPadding = padding - leftPadding;
            return ' '.repeat(leftPadding) + item + ' '.repeat(rightPadding);
        }).join('│') + '│';
    };

    let table = createBorder('┌', '┬', '┐') + '\n';
    for (let i = 0; i < rows; i++) {
        const rowItems = items.slice(i * cols, (i + 1) * cols);
        // Preenche colunas faltantes com espaços vazios
        while (rowItems.length < cols) {
            rowItems.push('');
        }
        table += createRow(rowItems) + '\n';
        if (i < rows - 1) {
            table += createSeparator() + '\n';
        }
    }
    table += createBorder('└', '┴', '┘');

    return table;
}
