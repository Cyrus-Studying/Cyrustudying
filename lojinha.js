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


// CARREGA OS Tp E OS ITENS COMPRADOS (mantendo o que não é relacionado à exibição dos itens disponíveis)

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const userId = user.uid;
      console.log("Usuário autenticado, UID:", userId);
      
      try {
        // Carregar os Tp do usuário
        const tpRef = ref(db, `usuarios/${userId}/Tp`);
        const tpSnapshot = await get(tpRef);
        let tpValue = 0;
        
        if (tpSnapshot.exists()) {
          tpValue = Number(tpSnapshot.val());
          console.log("Pontos encontrados:", tpValue);
        } else {
          console.log("Nenhum ponto encontrado, inicializando com 0.");
          await set(tpRef, 0);
        }
        
        document.getElementById("tp").innerText = `Tp: ${tpValue}`;
        
      } catch (error) {
        console.error("Erro ao buscar/salvar Tp:", error);
      }
      
      try {
        // Carregar os itens comprados do usuário
        const itensCompradosRef = ref(db, `usuarios/${userId}/itensComprados`);
        const comprasSnapshot = await get(itensCompradosRef);
        
        const containerComprados = document.getElementById("itensComprados");
        containerComprados.innerHTML = ""; // Limpa o container
      
        if (comprasSnapshot.exists()) {
          const compras = comprasSnapshot.val();
          
          // Itera sobre os itens comprados e exibe-os
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
          
          // Opcional: Adiciona uma classe ao container para aplicar um estilo geral
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
  const itensRef = ref(db, "itens");
  
  // Observa as alterações no nó "itens" e atualiza a exibição
  onValue(itensRef, (snapshot) => {
    containerDisponiveis.innerHTML = ""; // Limpa o container
    const itens = snapshot.val();
    
    if (!itens) {
      containerDisponiveis.innerHTML = "<p>Nenhum item disponível.</p>";
      return;
    }
    
    // Itera sobre os itens e gera o HTML dinamicamente
    for (const id in itens) {
      if (Object.hasOwnProperty.call(itens, id)) {
        const item = itens[id];
        const divItem = document.createElement("div");
        divItem.classList.add("lj-item", "noborder");
        divItem.innerHTML = `
          <h3 class="menu-texto" style="font-size:130%;">${item.nome}</h3>
          <p class="menu-texto" style="font-size:90%;">${item.descricao || ""} - ${item.preco} Tp</p>
          <button class="button-menu" data-item-id="${id}">Comprar</button>
        `;
        containerDisponiveis.appendChild(divItem);
      }
    }
    
    // Adiciona eventos de clique para cada botão de "Comprar"
    containerDisponiveis.querySelectorAll(".button-menu").forEach((button) => {
      button.addEventListener("click", () => {
        const itemId = button.getAttribute("data-item-id");
        comprarItem(itemId);
      });
    });
  });
});


// FUNÇÃO PARA REALIZAR A COMPRA DE UM ITEM

async function comprarItem(itemId) {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    alert("Usuário não autenticado!");
    return;
  }
  
  // Recupera os detalhes do item disponível via itemId
  const itemRef = ref(db, `itens/${itemId}`);
  const itemSnapshot = await get(itemRef);
  if (!itemSnapshot.exists()) {
    alert("Item não encontrado!");
    return;
  }
  const item = itemSnapshot.val();
  const precoItem = item.preco;
  
  // Obtém os Tp atuais do usuário
  const tpRef = ref(db, `usuarios/${userId}/Tp`);
  const tpSnapshot = await get(tpRef);
  const tpAtual = tpSnapshot.exists() ? Number(tpSnapshot.val()) : 0;
  if (tpAtual < precoItem) {
    alert("Pontos insuficientes para comprar este item!");
    return;
  }
  
  // Deduz o preço do item dos Tp do usuário
  const novoTp = tpAtual - precoItem;
  await set(tpRef, novoTp);
  document.getElementById("tp").innerText = `Tp: ${novoTp}`;
  
  // Registra a compra no histórico de itens comprados do usuário
  const compraRef = ref(db, `usuarios/${userId}/itensComprados`);
  const compraObj = {
    nome: item.nome,
    preco: precoItem,
    tipo: item.tipo || "documento",
    link: item.link || "",
    dataCompra: new Date().toISOString()
  };
  await push(compraRef, compraObj);
  alert(`Compra realizada: ${item.nome}`);
}
