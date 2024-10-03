const inputField = document.getElementById('input');
const terminalOutput = document.getElementById('output');
const commands = {
    whoami: "<p style='text-align: justify;'>Lucas: Hello, I am a software engineer from Brazil and I really enjoy solving problems with technology.</p>",
    github: "<a href='https://github.com/lucaohost' target='_blank'>https://github.com/lucaohost</a>",
    linkedin: "<a href='https://linkedin.com/in/lucas-reginatto-de-lima' target='_blank'>https://linkedin.com/lucaohost</a>",
    spotify: "<a href='https://open.spotify.com/playlist/2kO4SQsSzH2wYMkNB9lVEC' target='_blank'>https://spotify.com/lucaohost</a>",
    instagram: "<a href='https://instagram.com/lucaohost' target='_blank'>https://instagram.com/lucaohost</a>",
    twitter: "<a href='https://twitter.com/lucaohost' target='_blank'>https://twitter.com/lucaohost</a>",
    share: "Share this site: <a href='https://lucaohost.github.io' target='_blank'>https://lucaohost.github.io</a>",
    rmy: "Random Music on Youtube\n<a href='https://lucaohost.github.io/rmy' target='_blank'>https://lucaohost.github.io/rmy</a>",
    rms: "Random Music on Spotify\n<a href='https://lucaohost.github.io/rms' target='_blank'>https://lucaohost.github.io/rms</a>",
    rmym: "Random Music on Youtube Music\n<a href='https://lucaohost.github.io/rmym' target='_blank'>https://lucaohost.github.io/rmym</a>",
    "*" : "<p style='text-align: justify;'>It's just a character to prevent the cell in the table from being empty.</p>",
    social: function() {
        let socialMidias = [this.github, this.linkedin, this.spotify, this.instagram, this.twitter];
        return buildTable(socialMidias, 1);
    },
    clear: function() {
        terminalOutput.innerHTML = '';
    },
    help: function() {
        const items = ['whoami', 'social', 'share', 'rms', 'rmy', 'rmym', 'help', 'clear', 'exit'];
        return buildTable(items);
    },
    helpDesc: "Type help to see all commands.",
    exit: function() {
        window.close();
        window.history.back(); // if the windows didn't close, we back to the previous page
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
        if(input !== "") {
            appendOutput(`<span class="path">lucaohost@bash:~$</span> ${input}`);
            processCommand(input);
            inputField.innerText = '';
        }
    }
}

inputField.addEventListener('keydown', onEnter);

function buildTable(items, cols = 3) {
    const rows = Math.ceil(items.length / cols);
    let table = `\n<table style="border-collapse: collapse;"><tbody>`;
    for (let i = 0; i < rows; i++) {
        table += '<tr>';
        const rowItems = items.slice(i * cols, (i + 1) * cols);
        while (rowItems.length < cols) {
            rowItems.push('*'); // Fill the table if necessary
        }
        rowItems.forEach(item => {
            table += `
                <td style="border: 1px solid white; padding: 8px; text-align: center; color: white;">${item}</td>`;
        });
        table += '</tr>';
    }
    table += '</tbody></table>\n';

    return table;
}
