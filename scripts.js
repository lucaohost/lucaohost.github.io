const inputField = document.getElementById('input');
const terminalOutput = document.getElementById('output');
const commands = {
    whoami: "Lucas: Hello, I am a software engineer from Brazil and I really enjoy solving problems with technology.",
    github: "GitHub: <a href='https://github.com/lucaohost' target='_blank'>https://github.com/lucaohost</a>",
    linkedin: "LinkedIn: <a href='https://linkedin.com/in/lucas-reginatto-de-lima' target='_blank'>https://linkedin.com/in/lucas-reginatto-de-lima</a>",
    spotify: "Spotify: <a href='https://open.spotify.com/user/blood.dota?si=9jBkNI51TMuPsx9WAgzCzw' target='_blank'>https://open.spotify.com/user/blood.dota?si=9jBkNI51TMuPsx9WAgzCzw</a>",
    instagram: "Instagram: <a href='https://instagram.com/lucaohost' target='_blank'>https://instagram.com/lucaohost</a>",
    twitter: "Twitter: <a href='https://twitter.com/lucaohost' target='_blank'>https://twitter.com/lucaohost</a>",
    share: "Compartilhar: <a href='https://lucaohost.github.io' target='_blank'>https://lucaohost.github.io</a>",
    social: function() {
        return `${this.github}\n${this.linkedin}\n${this.spotify}\n${this.instagram}\n${this.twitter}`;
    },
    clear: function() {
        terminalOutput.innerHTML = '';
    },
    help: "***********************\n* Available Commmands *\n***********************\n> whoami, github, linkedin, spotify, instagram, twitter, share, social, clear, help",
    exit: function() {
        window.close();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    appendOutput(commands["help"])
    inputField.focus();  // Foca no campo de entrada automaticamente quando a página carregar
});

document.addEventListener('click', function() {
    const selection = window.getSelection().toString();
    if (!selection) {
        inputField.focus();
    }
});

function processCommand(input) {
    const command = input.trim();
    if (commands[command]) {
        if (typeof commands[command] === 'function') {
            appendOutput(commands[command]());
        } else {
            appendOutput(commands[command]);
        }
    } else {
        appendOutput(`Command not found. Try help to see all Available Commmands`);
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
        appendOutput(`<span class="path">lucaohost@terminal:/home/lucahost$</span> ${input}`);
        processCommand(input);
        inputField.innerText = '';
    }
}

inputField.addEventListener('keydown', onEnter);