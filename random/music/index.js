let archor = document.querySelector("#goToMusic");
archor.href = "https://www.youtube.com/results?search_query=" + (genres[Math.floor(Math.random() * (genres.length))]).replace(" ", "+") + "&sp=EgIQAw%253D%253D";
archor.click();
