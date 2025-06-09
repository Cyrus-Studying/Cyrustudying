import { ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";
import { db } from "./firebase.js"; // Importa db corretamente

// Agora você pode usar `ref(db, "caminho")`
const usuarioRef = ref(db, `usuarios/UID_DO_USUARIO/adm`);
get(usuarioRef).then(snapshot => console.log("Valor de adm:", snapshot.val()));


// Redirect dos botões do menu

document.getElementById("irparavcards").addEventListener("click", () => {
  window.location.href = "VCards.html"; // Vá para as VCards
});

document.getElementById("irparalojinha").addEventListener("click", () => {
  window.location.href = "Lojinha.html"; // Vá para a Lojinha
});


// Carregar os Tp

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async (user) => { 
    if (user) {
      const userId = user.uid;
      console.log("Usuário autenticado, UID:", userId);


      // Buscar os Tp no Firebase

      try {
        const snapshot = await get(ref(db, `usuarios/${userId}/Tp`));
        if (snapshot.exists()) {
          console.log("Pontos encontrados:", snapshot.val());
          document.getElementById("tp").innerText = `Tp: ${snapshot.val()}`;
        } else {
          console.log("Nenhum ponto encontrado para esse usuário.");
          document.getElementById("tp").innerText = "Tp: 0";


          // Armazenar Tp = 0 no Firebase (caso ainda não tenha sido salvo)

          await update(ref(db, `usuarios/${userId}`), { Tp: 0 });
          console.log("Pontos Tp salvos com sucesso!");
        }
      } catch (error) {
        console.error("Erro ao buscar/salvar Tp:", error);
      }
      

      //Não achei o user - Vamos fazer o login denovo!
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
        if (snapshot.exists()) {
          console.log("Pontos encontrados:", snapshot.val());
          document.getElementById("tp").innerText = `Tp: ${snapshot.val()}`;
        } else {
          console.log("Nenhum ponto encontrado para esse usuário.");
          document.getElementById("tp").innerText = "Tp: 0";
      }
    }
  };
});})


function mostrarMenuParaAdmin() {
  const dbRef = firebase.database().ref("/menu");
  
  dbRef.once("value")
    .then(snapshot => {
      const menuData = snapshot.val();
      const menuContainer = document.getElementById("menu");

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


firebase.auth().onAuthStateChanged(user => {
  if (user) {
    user.getIdTokenResult().then(idTokenResult => {
      if (idTokenResult.claims.adm) {
        console.log("Usuário administrador. Exibindo menu.");
        mostrarMenuParaAdmin(); 
      } else {
        console.log("Usuário comum. Menu restrito.");
      }
    });
  }
});
