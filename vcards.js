import { auth, db } from "./firebase.js";  // Certifique-se de que o caminho está correto
import { ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";


// Agora você pode usar `ref(db, "caminho")`
const usuarioRef = ref(db, `usuarios/UID_DO_USUARIO/adm`);
get(usuarioRef).then(snapshot => console.log("Valor de adm:", snapshot.val()));

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
    carregarVCards(); // Exibe as VCards do Firebase
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

// Renderizar as VCards no HTML
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

// Definição de pontos ao clicar nas respostas certas
let pontosAcumulados = 0;
document.addEventListener("click", (event) => {
  const vcard = event.target.closest(".vcard"); // Encontra a VCard mais próxima do botão clicado
  if (vcard) {
    if (event.target.classList.contains("certo")) {
      pontosAcumulados += 10;
      console.log("Pontos acumulados:", pontosAcumulados);
      alert("Você acertou! Parabéns!")
    }
    else if (event.target.classList.contains("errado")) {
      alert("Resposta errada!")}
    vcard.remove(); // Remove a VCard do HTML
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

// Cirar/editar as VCards!

auth.onAuthStateChanged(async (user) => {
  if (user) {
    const userId = user.uid;
    const usuarioRef = ref(db, `usuarios/${userId}/adm`);

    try {
      const snapshot = await get(usuarioRef);
      const isAdmin = snapshot.exists() ? snapshot.val() : false;

      if (isAdmin) {
        console.log("Usuário é administrador! Exibindo opções.");
      } else {
        console.log("Usuário comum. Acesso restrito.");
      }
    } catch (error) {
      console.error("Erro ao verificar administrador:", error);
    }
  }
});



function criarOuEditarVCard(cardId, novaPergunta, novasAlternativas, novaRespostaCerta) {
  const vcardRef = ref(db, `vcards/${cardId}`);

  const vcardData = {
    pergunta: novaPergunta,
    alternativas: novasAlternativas.split(","), // Transforma string em array
    respostaCerta: novaRespostaCerta
  };

  set(vcardRef, vcardData)
    .then(() => console.log("VCard criado/atualizado com sucesso!", vcardData))
    .catch((error) => console.error("Erro ao criar/editar VCard:", error));
}
