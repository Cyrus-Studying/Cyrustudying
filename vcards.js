import { auth, db } from "./firebase.js";
import { ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

let currentUserId = null;

// Redirect do botão menu das VCards
document.getElementById("irparaomenuvcards").addEventListener("click", () => {
  window.location.href = "menu.html";
});

// Autenticação: Ao detectar o usuário autenticado, armazena o UID e carrega a interface de edição
auth.onAuthStateChanged((user) => {
  if (user && user.uid) {
    console.log("Usuário autenticado! UID:", user.uid);
    currentUserId = user.uid;
    // Carrega os VCards para edição
    loadVCardsEditor();
  } else {
    console.error("Nenhum usuário autenticado!");
  }
});

// Função para carregar os VCards do Realtime Database e renderizá-los como formulários de edição
function loadVCardsEditor() {
  const vcardsRef = ref(db, "vcards");
  onValue(vcardsRef, (snapshot) => {
    const data = snapshot.val();
    renderVCardsEditor(data);
  });
}

// Função para renderizar a interface de edição dentro do container com id "vcardsContainer"
// Cada VCard exibirá seus detalhes e um botão para salvar possíveis alterações
function renderVCardsEditor(vcardsData) {
  const container = document.getElementById("vcardsContainer");
  container.innerHTML = ""; // Limpa o container

  if (!vcardsData) {
    container.innerHTML = "<p>Nenhuma VCard encontrada.</p>";
    return;
  }

  // Para cada VCard no objeto recuperado do database, cria um bloco de edição
  for (const cardId in vcardsData) {
    const card = vcardsData[cardId];
    const divCard = document.createElement("div");
    divCard.classList.add("vcard-editor");
    divCard.innerHTML = `
      <h2>ID: ${cardId}</h2>
      <label>Pergunta:</label>
      <input type="text" id="pergunta-${cardId}" value="${card.pergunta || ""}" /><br>
      <label>Alternativas (separadas por vírgula):</label>
      <input type="text" id="alternativas-${cardId}" value="${card.alternativas ? card.alternativas.join(", ") : ""}" /><br>
      <label>Resposta Correta:</label>
      <input type="text" id="resposta-${cardId}" value="${card.respostaCerta || ""}" /><br>
      <button data-cardid="${cardId}" class="salvar">Salvar Alterações</button>
      <hr>
    `;
    container.appendChild(divCard);
  }

  // Adiciona evento de clique para cada botão "Salvar Alterações"
  const botoesSalvar = document.getElementsByClassName("salvar");
  Array.from(botoesSalvar).forEach((botao) => {
    botao.addEventListener("click", salvarEdicao);
  });
}

// Função para salvar as edições feitas em um VCard específico no Realtime Database
function salvarEdicao(event) {
  const cardId = event.target.getAttribute("data-cardid");
  const novaPergunta = document.getElementById(`pergunta-${cardId}`).value;
  const novasAlternativasRaw = document.getElementById(`alternativas-${cardId}`).value;
  const novasAlternativas = novasAlternativasRaw.split(",").map(item => item.trim());
  const novaResposta = document.getElementById(`resposta-${cardId}`).value;

  const cardRef = ref(db, `vcards/${cardId}`);
  update(cardRef, {
    pergunta: novaPergunta,
    alternativas: novasAlternativas,
    respostaCerta: novaResposta
  })
  .then(() => {
    console.log(`VCard ${cardId} atualizado com sucesso!`);
  })
  .catch((error) => {
    console.error("Erro ao atualizar o VCard:", error);
  });
}
