const API_KEY = "AIzaSyDI45iLWM_lyHq0pSuTQcIUwutqYvSEHwU";
const MAX_RESULTADO = 200;
const MAX_POR_PAGINA = 50;

function carregarCliente() {
  gapi.client.setApiKey(API_KEY);
  return (
    gapi.client
      .load("youtube", "v3")
      .then(
        async function () {
          console.log("YouTube API carregada");
          const videosIds = await searchVideos("javascript");
          console.log(videosIds);
        },
        function (error) {
          console.error("Erro ao carregar a API", error);
        }
      )
  );
}

async function searchVideos(query, totalVideos = [], pageToken = "") {
  if (totalVideos.length >= MAX_RESULTADO) {
    return totalVideos;
  }

  try {
    const response = await gapi.client.youtube.search.list({
      part: "snippet",
      maxResults: MAX_POR_PAGINA,
      q: query,
      pageToken: pageToken,
      type: "video",
    });

    const videoIds = response.result.items.map((item) => item.id.videoId);

    const detailsResponse = await gapi.client.youtube.videos.list({
      part: "snippet,contentDetails",
      id: videoIds,
    });

    const novosVideos = detailsResponse.result.items.map((item) => {
      return {
        id: item.id,
        tituloCanal: item.snippet.channelTitle,
        titulo: item.snippet.title,
        thumbnail: item.snippet.thumbnails.default,
        duracao: formatarDuracao(item.contentDetails.duration),
        url: `https://www.youtube.com/watch?v=${item.id}`,
      };
    });
    totalVideos.push(...novosVideos);

    if (response.result.nextPageToken && totalVideos.length < MAX_RESULTADO) {
      console.log("buscando");
      await searchVideos(query, totalVideos, response.result.nextPageToken);
    }

    return totalVideos;
  } catch (error) {
    console.error("Erro ao buscar vídeos:", error);
  }
}

function formatarDuracao(duracao) {
  const match = duracao.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (match[1] || "0H").slice(0, -1);
  const minutes = (match[2] || "0M").slice(0, -1);
  const seconds = (match[3] || "0S").slice(0, -1);

  return `${hours.padStart(2, "0")}:${minutes.padStart(
    2,
    "0"
  )}:${seconds.padStart(2, "0")}`;
}

gapi.load("client", carregarCliente);
