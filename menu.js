// Importações (supondo que firebase.js está corretamente configurado)
import { ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";
import { GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { app, analytics, auth, db } from "./firebase.js";

// Debug: Verifica se os módulos estão carregados
console.log("Auth:", auth);
console.log("DB:", db);

// Validação de adm para um exemplo de usuário (troque o UID conforme necessário)
const usuarioRef = ref(db, `usuarios/UID_DO_USUARIO/adm`);
get(usuarioRef).then(snapshot => console.log("Valor de adm:", snapshot.val()));

// Redirect dos botões do menu
const irParaVcardsElement = document.getElementById("irparavcards");
if (irParaVcardsElement) {
  irParaVcardsElement.addEventListener("click", () => {
    window.location.href = "VCards.html";
  });
} else {
  console.warn("Elemento 'irparavcards' não encontrado.");
}

const irParaLojinhaElement = document.getElementById("irparalojinha");
if (irParaLojinhaElement) {
  irParaLojinhaElement.addEventListener("click", () => {
    window.location.href = "Lojinha.html";
  });
} else {
  console.warn("Elemento 'irparalojinha' não encontrado.");
}

let currentUserId = null;

// Carregar os Tp após o DOM estar pronto
document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUserId = user.uid;
      console.log("Usuário autenticado, UID:", currentUserId);

      // Buscar os Tp do usuário no Firebase
      try {
        const snapshot = await get(ref(db, `usuarios/${currentUserId}/Tp`));
        const tpElement = document.getElementById("tp");
        if (tpElement) {
          if (snapshot.exists()) {
            console.log("Pontos encontrados:", snapshot.val());
            tpElement.innerText = `Tp: ${snapshot.val()}`;
          } else {
            console.log("Nenhum ponto encontrado para esse usuário.");
            tpElement.innerText = "Tp: 0";
            await update(ref(db, `usuarios/${currentUserId}`), { Tp: 0 });
            console.log("Pontos Tp salvos com sucesso!");
          }
        } else {
          console.warn("Elemento 'tp' não encontrado.");
        }
      } catch (error) {
        console.error("Erro ao buscar/salvar Tp:", error);
      }

      // Carregar as VCards (se estiver na página apropriada)
      if (document.getElementById("vcardsContainer")) {
        carregarVCards();
      }
    } else {
      console.log("Nenhum usuário autenticado!");
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        console.log("Login bem-sucedido:", result.user);
      } catch (error) {
        console.error("Erro ao fazer login:", error);
        alert("Erro ao fazer login: " + error.message);
        const tpElement = document.getElementById("tp");
        if (tpElement) tpElement.innerText = "Tp: 0";
      }
    }
  });
});

// Função para carregar e exibir as VCards do Firebase
function carregarVCards() {
  const vcardsRef = ref(db, "vcards");
  onValue(vcardsRef, (snapshot) => {
    exibirVCardsNoHTML(snapshot.val());
  });
}

function exibirVCardsNoHTML(vcardsData) {
  const container = document.getElementById("vcardsContainer");
  if (!container) {
    console.warn("Elemento 'vcardsContainer' não encontrado.");
    return;
  }
  
  container.innerHTML = ""; // Limpa o container

  if (!vcardsData) {
    container.innerHTML = "<p>Nenhuma VCard encontrada.</p>";
    return;
  }

  // Cria os elementos para cada VCard
  for (const cardId in vcardsData) {
    const card = vcardsData[cardId];
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

// Definição de pontos ao clicar nas respostas
let pontosAcumulados = 0;
document.addEventListener("click", (event) => {
  const vcard = event.target.closest(".vcard");
  if (vcard) {
    if (event.target.classList.contains("certo")) {
      pontosAcumulados += 10;
      console.log("Pontos acumulados:", pontosAcumulados);
      alert("Você acertou! Parabéns!");
    } else if (event.target.classList.contains("errado")) {
      alert("Resposta errada!");
    }
    vcard.remove(); // Remove a VCard após clicar
  }
});

// Botão final de entrega
const entregarVcardsEl = document.getElementById("entregarvcards");
if (entregarVcardsEl) {
  entregarVcardsEl.addEventListener("click", async function() {
    if (currentUserId && pontosAcumulados > 0) {
      await adicionarTp(currentUserId, pontosAcumulados);
      pontosAcumulados = 0;
    }
    let today = new Date().toISOString().split("T")[0];
    await set(ref(db, `usuarios/${currentUserId}/btnFinalClicadoData`), today);
    this.style.display = "none";
  });
} else {
  console.warn("Elemento 'entregarvcards' não encontrado.");
}

// Função para adicionar pontos ao banco
async function adicionarTp(userId, pontos = 0) {
  if (!userId) {
    console.error("Erro: userId está indefinido!");
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

// Verificação de administrador para opções extras
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const usuarioAdmRef = ref(db, `usuarios/${user.uid}/adm`);
    try {
      const snapshot = await get(usuarioAdmRef);
      const isAdmin = snapshot.exists() ? snapshot.val() : false;
      if (isAdmin) {
        console.log("Usuário é administrador! Exibindo opções.");
        // Chame sua função de menu de admin, por exemplo: mostrarMenuParaAdmin();
      } else {
        console.log("Usuário comum. Acesso restrito.");
      }
    } catch (error) {
      console.error("Erro ao verificar administrador:", error);
    }
  }
});

// Se houver uma função para criar/editar VCards:
function criarOuEditarVCard(cardId, novaPergunta, novasAlternativas, novaRespostaCerta) {
  const vcardRef = ref(db, `vcards/${cardId}`);
  const vcardData = {
    pergunta: novaPergunta,
    alternativas: novasAlternativas.split(",").map(item => item.trim()),
    respostaCerta: novaRespostaCerta
  };

  set(vcardRef, vcardData)
    .then(() => console.log("VCard criado/atualizado com sucesso!", vcardData))
    .catch((error) => console.error("Erro ao criar/editar VCard:", error));
}
