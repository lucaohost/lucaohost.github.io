const inputField = document.getElementById('input');
const terminalOutput = document.getElementById('output');
const cli = document.getElementById('cli');
const commands = {
    whoami: "<p style='text-align: justify;'>Lucas: Hello, I am a software engineer from Brazil and I really enjoy solving problems with technology.</p>",
    github: "<a href='https://github.com/lucaohost' target='_blank'>https://github.com/lucaohost</a>",
    linkedin: "<a href='https://linkedin.com/in/lucas-reginatto-de-lima' target='_blank'>https://linkedin.com/lucaohost</a>",
    spotify: "<a href='https://open.spotify.com/playlist/2kO4SQsSzH2wYMkNB9lVEC' target='_blank'>https://spotify.com/lucaohost</a>",
    instagram: "<a href='https://instagram.com/lucaohost' target='_blank'>https://instagram.com/lucaohost</a>",
    twitter: "<a href='https://twitter.com/lucaohost' target='_blank'>https://twitter.com/lucaohost</a>",
    share: "<p><button id='shareButton' style='margin-top: 10px; margin-bottom: 10px; background-color: #4CAF50; color: white; border: none; padding: 5px 10px; text-align: center; text-decoration: none; display: inline-block; font-size: 14px; border-radius: 8px; cursor: pointer;'>Share this Site!</button></p>",
    rmy: "Random Music on Youtube:\n<a href='https://lucaohost.github.io/rmy' target='_blank'>https://lucaohost.github.io/rmy</a>",
    rms: "Random Music on Spotify:\n<a href='https://lucaohost.github.io/rms' target='_blank'>https://lucaohost.github.io/rms</a>",
    rmym: "Random Music on Youtube Music:\n<a href='https://lucaohost.github.io/rmym' target='_blank'>https://lucaohost.github.io/rmym</a>",
    youtube: "<a href='https://youtube.com/@lucasreginatto721' target='_blank'>https://youtube.com/lucaohost</a>",
    social: function() {
        let socialMidias = [
            "<a href='https://github.com/lucaohost' target='_blank'><img src='https://cdn-icons-png.flaticon.com/512/25/25231.png' alt='GitHub' width='24' height='24'></a>", this.github,
            "<a href='https://linkedin.com/in/lucas-reginatto-de-lima' target='_blank'><img src='https://cdn-icons-png.flaticon.com/512/174/174857.png' alt='LinkedIn' width='24' height='24'></a>", this.linkedin,
            "<a href='https://youtube.com/@lucasreginatto721' target='_blank'><img src='https://cdn-icons-png.flaticon.com/512/1384/1384060.png' alt='YouTube' width='24' height='24'></a>", this.youtube,
            "<a href='https://open.spotify.com/playlist/2kO4SQsSzH2wYMkNB9lVEC' target='_blank'><img src='https://cdn-icons-png.flaticon.com/512/174/174872.png' alt='Spotify' width='24' height='24'></a>", this.spotify
        ];
        return buildTable(socialMidias, 2);
    },
    clear: function() {
        terminalOutput.innerHTML = '';
    },
    help: function() {
        const items = [
            "Commands", "Description",
            'whoami', "Print brief information about me.", 
            'social', "Show my social networks.",
            'share', "Share this site.",
            'music', "Show a random liked song.",
            'liked', "Show my liked songs playlist.",
            'help', "Show all commands.",
            'clear', "Clear the terminal.",
            'exit', "Close the terminal."
        ];
        return buildTable(items);
    },
    music: function() {
        return "Random Liked Song:\n" + showRandomMusic();
    },
    helpDesc: "Type 'help' to see all commands.",
    exit: function() {
        window.close();
        window.history.back(); // if the windows didn't close, we back to the previous page
    },
    liked: function() {
        const alreadyHasPlayer = terminalOutput.querySelector('iframe');
        if (alreadyHasPlayer) {
            processCommand('clear');
            appendOutput(`<span class="path">lucaohost@bash:~$</span> liked`);
        }
        appendOutput(`My Liked Songs Playlist:\n`);
        inputField.innerText = '';
        return '<iframe style="border-radius:12px" src="https://open.spotify.com/embed/playlist/2kO4SQsSzH2wYMkNB9lVEC?utm_source=generator" width="50%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>';
    }
};

document.addEventListener('DOMContentLoaded', function() {
    appendOutput("Welcome to my online terminal!\nType 'help' to see all commands.");
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
            if (command === 'share') {
                const shareButton = document.getElementById('shareButton');
                shareButton.addEventListener('click', function() {
                    if (navigator.share) {
                        navigator.share({
                            title: 'Lucas Reginatto de Lima',
                            text: 'Software Engineer',
                            url: 'https://lucaohost.github.io',
                        })
                        .then(() => console.log('Successful share'))
                        .catch((error) => console.log('Error sharing', error));
                    } else {
                        alert('This feature is not supported in your browser.');
                    }
                });
            }
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

function buildTable(items, cols = 2) {
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
    { musicId: "7cwTQ1psgGDuX1eBqrKonZ", musicName: "Chris Bandi - Would Have Loved Her" },
    { musicId: "7221xIgOnuakPdLqT0F3nP", musicName: "Post Malone - I Had Some Help" },
    { musicId: "3CRDbSIZ4r5MsZ0YwxuEkn", musicName: "Twenty One Pilots - Stressed Out" },
    { musicId: "1A5V1sxyCLpKJezp75tUXn", musicName: "Semisonic - Closing Time" },
    { musicId: "5DiXcVovI0FcY2s0icWWUu", musicName: "Counting Crows - Mr. Jones" },
    { musicId: "0UFDKFqW2oGspYeYqo9wjA", musicName: "Bleed It Out - Linkin Park" },
    { musicId: "4dyx5SzxPPaD8xQIid5Wjj", musicName: "Young Folks - Peter Bjorn and John" },
    { musicId: "1Ame8XTX6QHY0l0ahqUhgv", musicName: "Maneskin - THE LONELIEST" },
    { musicId: "7EkWXAI1wn8Ii883ecd9xr", musicName: "Surf Curse - Freaks" },
    { musicId: "3NLrRZoMF0Lx6zTlYqeIo4", musicName: "3 Doors Down - Here Without You" },
    { musicId: "2VSbEXqs6NbNiZSTcHlIDR", musicName: "Creed - My Sacrifice" },
];


function showRandomMusic(width = 560, height = 315) {
    const alreadyHasPlayer = terminalOutput.querySelector('iframe');
    if (alreadyHasPlayer) {
        processCommand('clear');
        appendOutput(`<span class="path">lucaohost@bash:~$</span> music`);
    }
    inputField.innerText = '';
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

    const spotifyIframe = document.createElement('iframe');
    spotifyIframe.style.borderRadius = '12px';
    spotifyIframe.src = `https://open.spotify.com/embed/track/${selectedMusic.musicId}?utm_source=generator&theme=0`;
    spotifyIframe.width = '50%';
    spotifyIframe.height = '152';
    spotifyIframe.frameBorder = '0';
    spotifyIframe.allowFullscreen = true;
    spotifyIframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    spotifyIframe.loading = 'lazy';

    return spotifyIframe.outerHTML;
}
