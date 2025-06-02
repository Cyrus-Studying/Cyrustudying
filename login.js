// @ts-nocheck
// login.js


// Importações iniciais

import { auth, db, getDatabase, app } from "./firebase.js";
import { GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";


//Encontrando o botão de login no HTML

document.addEventListener("DOMContentLoaded", () => {
  const googleLoginButton = document.getElementById("google-login");

  if (!googleLoginButton) {
    console.error("Erro: O botão de login não foi encontrado no HTML!");
    return;
  }


  //Achou o botão? Função de login com o google

  googleLoginButton.addEventListener("click", async () => {
    console.log("Botão clicado!");
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Login bem-sucedido:", user);
      const db = getDatabase(app);
      const userId = user.uid;
      window.location.href = "menu.html";
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      alert("Erro ao fazer login: " + error.message);
    }
  });
});
