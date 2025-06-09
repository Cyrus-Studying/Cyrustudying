// Importações do Firebase Database e Authentication
import { ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";
import { GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { app, analytics, auth, db } from "./firebase.js"; // Certifique-se de que o caminho para firebase.js está correto

// Debug: Verifica se os módulos estão carregados
console.log("Auth:", auth);
console.log("DB:", db);

// Exemplo de verificação de adm (para um usuário específico)
// Troque "UID_DO_USUARIO" pelo UID desejado para validar o valor da flag
const usuarioRef = ref(db, `usuarios/UID_DO_USUARIO/adm`);
get(usuarioRef).then(snapshot => console.log("Valor de adm:", snapshot.val()));

let currentUserId = null;

// Redirect dos botões do menu
document.getElementById("irparavcards").addEventListener("click", () => {
  window.location.href = "VCards.html";
});
document.getElementById("irparalojinha").addEventListener("click", () => {
  window.location.href = "Lojinha.html";
});

// Carregar os Tp quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUserId = user.uid;
      console.log("Usuário autenticado, UID:", currentUserId);

      // Buscar os Tp do usuário no Firebase
      try {
        const snapshot = await get(ref(db, `usuarios/${currentUserId}/Tp`));
        if (snapshot.exists()) {
          console.log("Pontos encontrados:", snapshot.val());
          document.getElementById("tp").innerText = `Tp: ${snapshot.val()}`;
        } else {
          console.log("Nenhum ponto encontrado para esse usuário.");
          document.getElementById("tp").innerText = "Tp: 0";

          // Armazenar Tp = 0 no Firebase (caso ainda não tenha sido salvo)
          await update(ref(db, `usuarios/${currentUserId}`), { Tp: 0 });
          console.log("Pontos Tp salvos com sucesso!");
        }
      } catch (error) {
        console.error("Erro ao buscar/salvar Tp:", error);
      }

      // Carregar as VCards
      carregarVCards();
    } else {
      console.log("Nenhum usuário autenticado!");
      // Tenta o login com popup se nenhum usuário estiver autenticado
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log("Login bem-sucedido:", user);
      } catch (error) {
        console.error("Erro ao fazer login:", error);
        alert("Erro ao fazer login: " + error.message);
        document.getElementById("tp").innerText = "Tp: 0";
      }
    }
  });
});

// Função para carregar e exibir as VCards do Firebase
function carregarVCards() {
  const vcardsRef = ref(db, "vcards");

  // Cria um ouvinte para atualizações automáticas
  onValue(vcardsRef, (snapshot) => {
    const vcardsData = snapshot.val();
    exibirVCardsNoHTML(vcardsData);
  });
}

// Renderizar as VCards no HTML
function exibirVCardsNoHTML(vcardsData) {
  const container = document.getElementById("vcardsContainer");
  container.innerHTML = ""; // Limpa o container antes de exibir as novas VCards

  if (!vcardsData) {
    container.innerHTML = "<p>Nenhuma VCard encontrada.</p>";
    return;
  }

  // Itera sobre as VCards e cria os elementos HTML
  for (const cardId in vcardsData) {
    const card = vcardsData[cardId];

    // Verifica se "alternativas" existe, se sim, cria os botões; caso contrário, exibe mensagem
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
  const vcard = event.target.closest(".vcard"); // Encontra a VCard relacionada ao botão clicado
  if (vcard) {
    if (event.target.classList.contains("certo")) {
      pontosAcumulados += 10;
      console.log("Pontos acumulados:", pontosAcumulados);
      alert("Você acertou! Parabéns!");
    } else if (event.target.classList.contains("errado")) {
      alert("Resposta errada!");
    }
    // Remove a VCard após a resposta
    vcard.remove();
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

// Verificação de administrador para opções de criação/edição de VCards
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const usuarioAdmRef = ref(db, `usuarios/${user.uid}/adm`);

    try {
      const snapshot = await get(usuarioAdmRef);
      const isAdmin = snapshot.exists() ? snapshot.val() : false;

      if (isAdmin) {
        console.log("Usuário é administrador! Exibindo opções.");
        // Aqui você pode chamar uma função para exibir o menu de administração, ex:
        // mostrarMenuParaAdmin();
      } else {
        console.log("Usuário comum. Acesso restrito.");
      }
    } catch (error) {
      console.error("Erro ao verificar administrador:", error);
    }
  }
});

// Função para criar ou editar uma VCard
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
