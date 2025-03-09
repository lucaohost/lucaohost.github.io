const inputField = document.getElementById('input');
const terminalOutput = document.getElementById('output');
const cli = document.getElementById('cli');
const commands = {
    whoami: "<p style='text-align: justify;'>Lucas: Hello, I am a software engineer from Brasil and I really enjoy solving problems with technology.</p>",
    github: "<a href='https://github.com/lucaohost' target='_blank'>https://github.com/lucaohost</a>",
    linkedin: "<a href='https://linkedin.com/in/lucas-reginatto-de-lima' target='_blank'>https://linkedin.com/lucaohost</a>",
    spotify: "<a href='https://open.spotify.com/playlist/2kO4SQsSzH2wYMkNB9lVEC' target='_blank'>https://spotify.com/lucaohost</a>",
    instagram: "<a href='https://instagram.com/lucaohost' target='_blank'>https://instagram.com/lucaohost</a>",
    twitter: "<a href='https://twitter.com/lucaohost' target='_blank'>https://twitter.com/lucaohost</a>",
    share: "Share this site: <a href='https://lucaohost.github.io' target='_blank'>https://lucaohost.github.io</a>",
    rmy: "Random Music on Youtube:\n<a href='https://lucaohost.github.io/rmy' target='_blank'>https://lucaohost.github.io/rmy</a>",
    rms: "Random Music on Spotify:\n<a href='https://lucaohost.github.io/rms' target='_blank'>https://lucaohost.github.io/rms</a>",
    rmym: "Random Music on Youtube Music:\n<a href='https://lucaohost.github.io/rmym' target='_blank'>https://lucaohost.github.io/rmym</a>",
    youtube: "<a href='https://youtube.com/@lucasreginatto721' target='_blank'>https://youtube.com/lucaohost</a>",
    "*" : "<p style='text-align: justify;'>It's just a character to prevent the cell in the table from being empty.</p>",
    social: function() {
        let socialMidias = [this.github, this.linkedin, this.spotify, this.instagram, this.twitter, this.youtube];
        return buildTable(socialMidias, 1);
    },
    clear: function() {
        terminalOutput.innerHTML = '';
    },
    help: function() {
        const items = ['whoami', 'social', 'share', 'music', 'help', 'clear', 'exit'];
        return buildTable(items);
    },
    music: function() {
        return "Playing random liked music:\n" + showRandomMusic();
    },
    helpDesc: "Type help to see all commands.",
    exit: function() {
        window.close();
        window.history.back(); // if the windows didn't close, we back to the previous page
    },
    liked: function() {
        return '<iframe style="border-radius:12px" src="https://open.spotify.com/embed/playlist/2kO4SQsSzH2wYMkNB9lVEC?utm_source=generator" width="50%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>';
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
        appendOutput(`Command '${input}' not found.\n${commands["helpDesc"]}`);
    }
}

function appendOutput(text) {
    const newLine = document.createElement('div');
    if(text !== undefined) {
        newLine.innerHTML = text;
        terminalOutput.appendChild(newLine);
    }
    cli.scrollTop = terminalOutput.scrollHeight;
    inputField.focus();
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
            rowItems.push('-'); // Fill the table if necessary
        }
        rowItems.forEach(item => {
            table += `
                <td style="border: 1px solid white; padding: 8px; text-align: left; color: white;">${item}</td>`;
        });
        table += '</tr>';
    }
    table += '</tbody></table>\n';

    return table;
}

const likedMusics = [
    { musicId: "o4TVH4imFfA", musicName: "Chris Bandi - Would Have Loved Her" },
    { musicId: "4QIZE708gJ4", musicName: "Post Malone - I Had Some Help" },
    { musicId: "pXRviuL6vMY", musicName: "Twenty One Pilots - Stressed Out" },
    { musicId: "xGytDsqkQY8", musicName: "Semisonic - Closing Time" },
    { musicId: "-oqAU5VxFWs", musicName: "Counting Crows - Mr. Jones" },
    { musicId: "OnuuYcqhzCE", musicName: "Bleed It Out - Linkin Park" },
    { musicId: "Dpv5G0747V4", musicName: "Young Folks - Peter Bjorn and John" },
    { musicId: "odWKEfp2QMY", musicName: "Maneskin - THE LONELIEST" },
    { musicId: "NfMegACVJQw", musicName: "Surf Curse - Freaks" },
    { musicId: "kPBzTxZQG5Q", musicName: "3 Doors Down - Here Without You" },
    { musicId: "O-fyNgHdmLI", musicName: "Creed - My Sacrifice" },
];


function showRandomMusic(width = 560, height = 315) {
    let playedPositions = JSON.parse(localStorage.getItem('playedPositions')) || [];
    if (playedPositions.length === likedMusics.length) {
        localStorage.removeItem('playedPositions');
        playedPositions = [];
    }

    let randomIndex;
    let tries = 0;
    do {
        randomIndex = Math.floor(Math.random() * likedMusics.length);
        tries++;
    } while (tries < 10 && playedPositions.includes(randomIndex));
    if (tries === 10) {
        playedPositions = [];
    }
    
    playedPositions.push(randomIndex);
    localStorage.setItem('playedPositions', JSON.stringify(playedPositions));

    const selectedMusic = likedMusics[randomIndex];
    const iframe = document.createElement('iframe');
    iframe.width = width;
    iframe.height = height;
    iframe.src = `https://www.youtube.com/embed/${selectedMusic.musicId}?autoplay=1`;
    iframe.title = "YouTube video player";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;

    const spotifyIframe = document.createElement('iframe');
    spotifyIframe.style.borderRadius = '12px';
    spotifyIframe.src = 'https://open.spotify.com/embed/track/7cwTQ1psgGDuX1eBqrKonZ?utm_source=generator&theme=0';
    spotifyIframe.width = '50%';
    spotifyIframe.height = '152';
    spotifyIframe.frameBorder = '0';
    spotifyIframe.allowFullscreen = true;
    spotifyIframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    spotifyIframe.loading = 'lazy';

    return spotifyIframe.outerHTML;
    return iframe.outerHTML;
}
