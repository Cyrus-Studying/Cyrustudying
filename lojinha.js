import { auth, db } from "./firebase.js";
import {
  ref,
  get,
  set,
  push,
  onValue
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";


// REDIRECIONA O BOTÃO MENU

document.getElementById("voltarparaomenulojinha").addEventListener("click", () => {
  window.location.href = "menu.html";
});


// CARREGA OS Tp E OS ITENS COMPRADOS

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const userId = user.uid;
      console.log("Usuário autenticado, UID:", userId);
      
      try {
        // Carregar os Tp do usuário
        const tpRef = ref(db, `usuarios/${userId}/Tp`);
        const tpSnapshot = await get(tpRef);
        let tpValue = tpSnapshot.exists() ? Number(tpSnapshot.val()) : 0;

        console.log("Pontos encontrados:", tpValue);
        
        const tpElement = document.getElementById("tp");
        if (tpElement) {
            tpElement.innerText = `Tp: ${tpValue}`;
        } else {
            console.error("Elemento 'tp' não encontrado!");
        }
        
      } catch (error) {
        console.error("Erro ao buscar/salvar Tp:", error);
      }
      
      try {
        // Carregar os itens comprados do usuário
        const itensCompradosRef = ref(db, `usuarios/${userId}/itensComprados`);
        const comprasSnapshot = await get(itensCompradosRef);
        
        const containerComprados = document.getElementById("itensComprados");
        if (!containerComprados) {
            console.error("Elemento 'itensComprados' não encontrado!");
            return;
        }
        
        containerComprados.innerHTML = ""; // Limpa o container
      
        if (comprasSnapshot.exists()) {
          const compras = comprasSnapshot.val();
          
          for (const key in compras) {
            if (Object.hasOwnProperty.call(compras, key)) {
              const compra = compras[key];
              let conteudo = "";
              
              if (compra.tipo === "documento") {
                  conteudo = `<p class="item-comprado-doc">${compra.nome} - 
                                <button onclick="window.open('${compra.link}', '_blank')">Baixar Documento</button></p>`;
              } else if (compra.tipo === "video") {
                  conteudo = `<p class="item-comprado-video">${compra.nome} - 
                                <button onclick="window.open('${compra.link}', '_blank')">Assistir Vídeo</button></p>`;
              } else {
                  conteudo = `<p class="item-comprado-sucesso">${compra.nome} - Compra realizada com sucesso!</p>`;
              }
              
              containerComprados.innerHTML += conteudo;
            }
          }
          
          containerComprados.classList.add("estilo-itens-comprados");
          
        } else {
          console.log("Nenhum item comprado encontrado.");
        }
        
      } catch (error) {
        console.error("Erro ao carregar itens comprados:", error);
      }
      
    } else {
      console.log("Nenhum usuário autenticado!");
    }
  });
  
  
  // CARREGA OS ITENS DISPONÍVEIS DO NÓ "itens" NO FIREBASE
  
  const containerDisponiveis = document.getElementById("itensDisponiveis");
  if (!containerDisponiveis) {
      console.error("Elemento 'itensDisponiveis' não encontrado!");
      return;
  }

  const itensRef = ref(db, "itens");
  
  onValue(itensRef, (snapshot) => {
    containerDisponiveis.innerHTML = ""; // Limpa o container
    const itens = snapshot.val();
    
    if (!itens) {
      containerDisponiveis.innerHTML = "<p>Nenhum item disponível.</p>";
      return;
    }
    
    for (const id in itens) {
      if (Object.hasOwnProperty.call(itens, id)) {
        const item = itens[id];
        const divItem = document.createElement("div");
        divItem.classList.add("lj-item", "noborder");
        divItem.innerHTML = `
          <h3 class="menu-texto" style="font-size:130%;">${item.nome}</h3>
          <p class="menu-texto" style="font-size:90%;">${item.descricao || ""} - ${item.preco} Tp</p>
          ${item.link ? `<p><a href="${item.link}" target="_blank">Acessar conteúdo</a></p>` : ""}
          <button class="button-menu" data-item-id="${id}">Comprar</button>
        `;
        containerDisponiveis.appendChild(divItem);
      }
    }
    
    containerDisponiveis.querySelectorAll(".button-menu").forEach((button) => {
      button.addEventListener("click", () => {
        const itemId = button.getAttribute("data-item-id");
        comprarItem(itemId);
      });
    });
  });
});
