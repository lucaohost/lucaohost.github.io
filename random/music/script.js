const anchor = document.querySelector("#goToMusic");
const youtubeUrl = "https://www.youtube.com/results?search_query=";
const musicSearch = (genres[Math.floor(Math.random() * (genres.length))]).replace(" ", "+");
const onlyPlaylistsFilter = "&sp=EgIQAw%253D%253D";
anchor.href = `${youtubeUrl}${musicSearch}${onlyPlaylistsFilter}`;
anchor.click();
