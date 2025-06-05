import { auth, db } from "./firebase.js";
import { ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

let currentUserId = null;

// Redirect do botão menu das VCards
document.getElementById("irparaomenuvcards").addEventListener("click", () => {
  window.location.href = "menu.html";
});

// Autenticação: Ao detectar o usuário autenticado, armazena o UID e carrega as VCards
auth.onAuthStateChanged((user) => {
  if (user && user.uid) {
    console.log("Usuário autenticado! UID:", user.uid);
    currentUserId = user.uid;
    carregarVCards(); // Exibe as VCards direto do Firebase
  } else {
    console.error("Nenhum usuário autenticado!");
  }
});

// Função para carregar e exibir as VCards do Firebase
function carregarVCards() {
  const vcardsRef = ref(db, "vcards");

  // Ouvinte para atualizações automáticas no HTML
  onValue(vcardsRef, (snapshot) => {
    const vcardsData = snapshot.val();
    exibirVCardsNoHTML(vcardsData);
  });
}

// Renderizar as VCards no HTML usando os dados do Firebase
function exibirVCardsNoHTML(vcardsData) {
  const container = document.getElementById("vcardsContainer");
  container.innerHTML = ""; // Limpa antes de renderizar

  if (!vcardsData) {
    container.innerHTML = "<p>Nenhuma VCard encontrada.</p>";
    return;
  }

  // Para cada VCard no Firebase, cria elementos no HTML
  for (const cardId in vcardsData) {
    const card = vcardsData[cardId];

    const vcardDiv = document.createElement("div");
    vcardDiv.className = "vcard";
    vcardDiv.id = cardId;
    vcardDiv.innerHTML = `
      <h2>${card.pergunta}</h2>
      ${card.alternativas.map((alt) => `
        <button class="${alt === card.respostaCerta ? 'certo' : 'errado'}">${alt}</button>
      `).join("")}
    `;
    container.appendChild(vcardDiv);
  }
}

// Definição de pontos ao clicar nas respostas certas
let pontosAcumulados = 0;
document.addEventListener("click", (event) => {
  if (event.target.classList.contains("certo")) {
    event.target.closest(".vcard").remove();
    pontosAcumulados += 10;
    console.log("Pontos acumulados:", pontosAcumulados);
  } else if (event.target.classList.contains("errado")) {
    event.target.closest(".vcard").remove();
  }
});

// Botão final de entrega
document.getElementById("entregarvcards").addEventListener("click", async function() {
  if (currentUserId && pontosAcumulados > 0) {
    await adicionarTp(currentUserId, pontosAcumulados);
    pontosAcumulados = 0;
  }
  let today = new Date().toISOString().split("T")[0];
  const btnRef = ref(db, `usuarios/${currentUserId}/btnFinalClicadoData`);
  await set(btnRef, today);

  this.style.display = "none";
});

// Função para adicionar pontos ao banco
async function adicionarTp(userId, pontos = 0) {
  if (!userId) {
    console.error("Erro: userId está indefinido! Aguardando autenticação...");
    return;
  }
  try {
    const usuarioRef = ref(db, `usuarios/${userId}/Tp`);
    const snapshot = await get(usuarioRef);
    let TpAtual = snapshot.exists() && !isNaN(snapshot.val()) ? Number(snapshot.val()) : 0;
    let novoTp = TpAtual + pontos;
    await set(usuarioRef, novoTp);
    console.log(`Tp atualizado corretamente para: ${novoTp}`);
  } catch (error) {
    console.error("Erro ao atualizar Tp:", error);
  }
}
