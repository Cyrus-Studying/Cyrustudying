// Importações do Firebase Database e Authentication (Firebase Modular)
import { ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";
import { GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { auth, db } from "./firebase.js"; // Verifique se o caminho está correto

// Debug: Verifica se os módulos estão carregados
console.log("Auth:", auth);
console.log("DB:", db);

// Exemplo de verificação de adm para um usuário específico
const usuarioRef = ref(db, `usuarios/UID_DO_USUARIO/adm`);
get(usuarioRef).then(snapshot => console.log("Valor de adm:", snapshot.val()));

// Redirect dos botões do menu
const irParaVcardsElem = document.getElementById("irparavcards");
if (irParaVcardsElem) {
  irParaVcardsElem.addEventListener("click", () => {
    window.location.href = "VCards.html"; // Redireciona para as VCards
  });
} else {
  console.warn("Elemento 'irparavcards' não encontrado.");
}

const irParaLojinhaElem = document.getElementById("irparalojinha");
if (irParaLojinhaElem) {
  irParaLojinhaElem.addEventListener("click", () => {
    window.location.href = "Lojinha.html"; // Redireciona para a Lojinha
  });
} else {
  console.warn("Elemento 'irparalojinha' não encontrado.");
}

// Carregar os Tp após o DOM estar pronto
document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const userId = user.uid;
      console.log("Usuário autenticado, UID:", userId);

      // Buscar os Tp do usuário no Firebase
      try {
        const snapshot = await get(ref(db, `usuarios/${userId}/Tp`));
        const tpElem = document.getElementById("tp");
        if (tpElem) {
          if (snapshot.exists()) {
            console.log("Pontos encontrados:", snapshot.val());
            tpElem.innerText = `Tp: ${snapshot.val()}`;
          } else {
            console.log("Nenhum ponto encontrado para esse usuário.");
            tpElem.innerText = "Tp: 0";

            // Armazenar Tp = 0 no Firebase, se necessário
            await update(ref(db, `usuarios/${userId}`), { Tp: 0 });
            console.log("Pontos Tp salvos com sucesso!");
          }
        } else {
          console.warn("Elemento 'tp' não encontrado.");
        }
      } catch (error) {
        console.error("Erro ao buscar/salvar Tp:", error);
      }
    } else {
      console.log("Nenhum usuário autenticado!");
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log("Login bem-sucedido:", user);
      } catch (error) {
        console.error("Erro ao fazer login:", error);
        alert("Erro ao fazer login: " + error.message);
      }
    }
  });
});

// Função para mostrar o menu para o administrador utilizando Firebase Modular
function mostrarMenuParaAdmin() {
  const dbRef = ref(db, "/menu");
  get(dbRef)
    .then(snapshot => {
      const menuData = snapshot.val();
      const menuContainer = document.getElementById("menu");
      if (!menuContainer) {
        console.warn("Elemento 'menu' não encontrado na página.");
        return;
      }
      if (menuData) {
        Object.keys(menuData).forEach(key => {
          const menuItem = document.createElement("li");
          menuItem.textContent = menuData[key].nome;
          menuContainer.appendChild(menuItem);
        });
      }
    })
    .catch(error => console.error("Erro ao carregar menu:", error));
}

// Verificar se o usuário é administrador e, se sim, exibir o menu
auth.onAuthStateChanged(user => {
  if (user) {
    user.getIdTokenResult()
      .then(idTokenResult => {
        if (idTokenResult.claims.adm) {
          console.log("Usuário administrador. Exibindo menu.");
          mostrarMenuParaAdmin();
        } else {
          console.log("Usuário comum. Menu restrito.");
        }
      })
      .catch(error => console.error("Erro ao obter token:", error));
  }
});
