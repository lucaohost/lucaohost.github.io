const anchor = document.querySelector("#goToMusic");
const youtubeMusicUrl = "https://music.youtube.com/search?q=";
const musicSearch = (genres[Math.floor(Math.random() * (genres.length))]).replace(" ", "%20");
anchor.href = `${youtubeMusicUrl}${musicSearch}`;
anchor.click();