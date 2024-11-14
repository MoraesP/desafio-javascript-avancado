import { dados } from "./videos.js";

const API_KEY = "AIzaSyDI45iLWM_lyHq0pSuTQcIUwutqYvSEHwU";
const MAX_RESULTADO = 200;
const MAX_POR_PAGINA = 50;
let videos = [];

const DIAS_DA_SEMANA = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

function carregarCliente() {
  // gapi.client.setApiKey(API_KEY);
  // return gapi.client.load("youtube", "v3").then(
  //   async function () {
  console.log("YouTube API carregada");
  videos = dados;
  // const videosIds = await searchVideos("javascript");
  console.log(videos);
  //   },
  //   function (error) {
  //     console.error("Erro ao carregar a API", error);
  //   }
  // );
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

function converterParaSegundos(tempo) {
  const partes = tempo.split(":");

  const horas = parseInt(partes[0], 10) || 0;
  const minutos = parseInt(partes[1], 10) || 0;
  const segundos = parseInt(partes[2], 10) || 0;

  return horas * 3600 + minutos * 60 + segundos;
}

function verificarCampos() {
  const inputs = document.querySelectorAll('input[type="number"]');
  const botaoEnviar = document.getElementById("btnEnviar");

  const todosPreenchidos = Array.from(inputs).every(
    (input) => input.value !== ""
  );

  botaoEnviar.disabled = !todosPreenchidos;
}

function enviarFormulario(event) {
  event.preventDefault();
  const inputs = document.querySelectorAll('input[type="number"]');
  const valores = Array.from(inputs).map((input) => input.value);
  let index = 0;
  const videosNaSemana = [];
  valores.forEach((tempo) => {
    let proximo = false;
    let tempoTotalVideos = 0;
    const videosParaAssistir = [];
    const tempoLivreNoDiaEmSegundos = tempo * 60;
    if (index < videos.length) {
      do {
        proximo = false;
        const video = videos[index];
        const tempoVideo = converterParaSegundos(video.duracao);
        if (tempoTotalVideos + tempoVideo < tempoLivreNoDiaEmSegundos) {
          tempoTotalVideos += tempoVideo;
          videosParaAssistir.push(video);
          proximo = true;
          index++;
        }
      } while (proximo);
    }
    videosNaSemana.push(videosParaAssistir);
  });

  const resultadoElement = document.getElementById("resultado");
  resultadoElement.innerHTML = ""; // Limpa o conteúdo anterior
  videosNaSemana.forEach((videosDoDia, i) => {
    const diaDiv = document.createElement("div");
    diaDiv.classList.add("dia-videos");
    const diaTitulo = document.createElement("h3");
    diaTitulo.textContent = `${DIAS_DA_SEMANA[i]}:`;
    diaDiv.appendChild(diaTitulo);

    if (videosDoDia.length > 0) {
      videosDoDia.forEach((video) => {
        const videoElement = document.createElement("div");
        videoElement.classList.add("video-item");

        const thumbnailImg = document.createElement("img");
        thumbnailImg.src = video.thumbnail.url;
        thumbnailImg.alt = video.titulo;
        thumbnailImg.classList.add("thumbnail");

        const videoInfo = document.createElement("p");
        videoInfo.innerHTML = `<a href="${video.url}" target="_blank">${video.titulo}</a> (Duração: ${video.duracao})`;

        videoElement.appendChild(thumbnailImg);
        videoElement.appendChild(videoInfo);

        diaDiv.appendChild(videoElement);
      });
    } else {
      const semVideo = document.createElement("h3");
      semVideo.textContent = "Sem vídeos";
      diaDiv.appendChild(semVideo);
    }

    resultadoElement.appendChild(diaDiv);
  });
}

function inicializarFormulario() {
  const inputs = document.querySelectorAll('input[type="number"]');
  inputs.forEach((input) => {
    input.addEventListener("input", verificarCampos);
  });
  const formulario = document.querySelector("form");
  formulario.addEventListener("submit", enviarFormulario);
}

document.addEventListener("DOMContentLoaded", inicializarFormulario);

gapi.load("client", carregarCliente);
