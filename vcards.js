import { auth, db } from "./firebase.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

let currentUserId = null;  
let pontosAcumulados = 0;

// Redirect do botão menu das VCards
document.getElementById("irparaomenuvcards").addEventListener("click", () => {
  window.location.href = "menu.html";
});

// Logar o usuário e armazenar o user ID
auth.onAuthStateChanged((user) => {
  if (user && user.uid) {
    console.log("Usuário autenticado! UID:", user.uid);
    currentUserId = user.uid;

    let today = new Date().toISOString().split("T")[0];
    const btnRef = ref(db, `usuarios/${currentUserId}/btnFinalClicadoData`);
    get(btnRef).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() === today) {
        const botao = document.getElementById("entregarvcards");
        if (botao) {
          botao.style.display = "none";
        }
      }
    });
  } else {
    console.error("Nenhum usuário autenticado!");
  }
});

// Botão final
document.getElementById("entregarvcards").addEventListener("click", async function() {
  if (currentUserId && pontosAcumulados > 0) {
    await adicionarTp(currentUserId, pontosAcumulados);
    pontosAcumulados = 0;
  }
  let today = new Date().toISOString().split("T")[0];
  const btnRef = ref(db, `usuarios/${currentUserId}/btnFinalClicadoData`);
  await set(btnRef, today);
  
  // Salvar as VCards coletadas no Realtime Database
  await salvarVcardsNoFirebase();

  this.style.display = "none";
});

// Função para adicionar pontos
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

// Função para salvar os VCards no Realtime Database
async function salvarVcardsNoFirebase() {
  if (!currentUserId) {
    console.error("Usuário não autenticado para salvar VCards.");
    return;
  }
  
  let today = new Date().toISOString().split("T")[0];

  // Captura todas as VCards presentes no HTML
  let vcardElements = document.querySelectorAll(".vcard");
  let vcardsData = {};

  vcardElements.forEach((vcard, index) => {
    let pergunta = vcard.querySelector("h2") ? vcard.querySelector("h2").textContent.trim() : "";
    // Como as VCards definem a resposta certa pelo botão com classe "certo",
    // usamos o seu conteúdo como resposta
    let respostaCerta = vcard.querySelector(".certo") ? vcard.querySelector(".certo").textContent.trim() : "";
    
    vcardsData[`card${index + 1}`] = {
      pergunta: pergunta,
      resposta: respostaCerta
    };
  });

  const vcardsRef = ref(db, `usuarios/${currentUserId}/vcardsEntregues`);
  await set(vcardsRef, { dataEntrega: today, vcards: vcardsData });
  console.log("VCards salvas no Firebase com sucesso!");
}

// Definindo o que está certo e o que está errado
let certos = document.getElementsByClassName("certo");
let errados = document.getElementsByClassName("errado");

// Para respostas certas, removemos o VCard e acumulamos pontos
for (let i = 0; i < certos.length; i++) {
  certos[i].addEventListener("click", function() {
    this.closest(".vcard").remove();
    pontosAcumulados += 10;
    console.log("Pontos acumulados:", pontosAcumulados);
  });
}

// Para respostas erradas, apenas removemos o VCard
for (let i = 0; i < errados.length; i++) {
  errados[i].addEventListener("click", function() {
    this.closest(".vcard").remove();
  });
}
