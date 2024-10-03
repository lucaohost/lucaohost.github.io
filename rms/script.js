const anchor = document.querySelector("#goToMusic");
const spotifyUrl = "https://open.spotify.com/search/";
const musicSearch = (genres[Math.floor(Math.random() * (genres.length))]).replace(" ", "%20");
anchor.href = `${spotifyUrl}${musicSearch}`;
anchor.click();
