import { auth, db } from "./firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

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
    carregarVCards(); // Exibe as VCards sem editor
  } else {
    console.error("Nenhum usuário autenticado!");
  }
});

// Função para carregar e exibir as VCards do Firebase
function carregarVCards() {
  const vcardsRef = ref(db, "vcards");

  // Ouvinte para atualizar automaticamente o HTML quando o Firebase mudar
  onValue(vcardsRef, (snapshot) => {
    const vcardsData = snapshot.val();
    exibirVCardsNoHTML(vcardsData);
  });
}

// Renderizar as VCards no HTML sem editor
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

    // Verifica se `alternativas` está presente antes de chamar `.map()`
    const alternativasHTML = card.alternativas ? 
      card.alternativas.map((alt) => `
        <button class="${alt === card.respostaCerta ? 'certo' : 'errado'}">${alt}</button>
      `).join("") 
      : "<p>Sem alternativas cadastradas.</p>";

    const vcardDiv = document.createElement("div");
    vcardDiv.className = "vcard";
    vcardDiv.id = cardId;
    vcardDiv.innerHTML = `
      <h2>${card.pergunta}</h2>
      ${alternativasHTML}
    `;
    container.appendChild(vcardDiv);
  }
}
