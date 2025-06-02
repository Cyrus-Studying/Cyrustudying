import { auth, db } from "./firebase.js";
import { ref, get, set, push } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";


// Array com os itens da loja com propriedades extras: tipo e link

const itensLoja = [
  { nome: "Curso de Shifting", preco: 100, tipo: "documento", link: window.location.origin + "/shiftingcurso.pdf" },
  { nome: "Cartela de 10 adesivos 28 mm x 28 mm", preco: 10, tipo: "documento", link: "cyrustudying@gmail.com" },
  { nome: "Outro PDF", preco: 150, tipo: "video", link: "https://exemplo.com/outro.pdf" }
];


// Redirect do botão Menu

document.getElementById("voltarparaomenulojinha").addEventListener("click", () => {
  window.location.href = "menu.html";
});


// Carregar os Tp e os itens comprados quando o DOM estiver pronto

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
        // Carregar os itens comprados
        const itensCompradosRef = ref(db, `usuarios/${userId}/itensComprados`);
        const comprasSnapshot = await get(itensCompradosRef);
        
        const containerComprados = document.getElementById("itensComprados");
        containerComprados.innerHTML = ""; // Limpa o container
      
        if (comprasSnapshot.exists()) {
          const compras = comprasSnapshot.val();
          
          // Itera sobre os itens comprados e exibe-os
          for (const key in compras) {
            if (compras.hasOwnProperty(key)) {
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
          
          // Opcionalmente, adicione uma classe ao container para aplicar um estilo geral
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
});


// Adiciona eventos de compra aos botões de cada item

document.querySelectorAll(".button-menu").forEach((botao, index) => {
  botao.addEventListener("click", () => {
    comprarItem(index);
  });
});


// Função para realizar a compra de um item

async function comprarItem(index) {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    alert("Usuário não autenticado!");
    return;
  }
  
  // Obtém os Tp atuais do usuário
  
  const tpRef = ref(db, `usuarios/${userId}/Tp`);
  const snapshot = await get(tpRef);
  const tpAtual = snapshot.exists() ? Number(snapshot.val()) : 0;
  const precoItem = itensLoja[index].preco;
  
  if (tpAtual < precoItem) {
    alert("Pontos insuficientes para comprar este item!");
    return;
  }
  
  const novoTp = tpAtual - precoItem;
  
  // Atualiza os Tp's no Firebase
  
  await set(tpRef, novoTp);
  
  // Atualiza o display dos Tp's
  
  document.getElementById("tp").innerText = `Tp: ${novoTp}`;
  
  // Salva os detalhes da compra na nuvem (histórico)
  
  const compraRef = ref(db, `usuarios/${userId}/itensComprados`);
  const compraObj = {
    nome: itensLoja[index].nome,
    preco: precoItem,
    tipo: itensLoja[index].tipo,
    link: itensLoja[index].link,
    dataCompra: new Date().toISOString()
  };
  
  try {
    await push(compraRef, compraObj);
    console.log("Dados da compra salvos com sucesso.");
  } catch (error) {
    console.error("Erro ao salvar dados no Realtime Database:", error);
  }
  
  // Exibe o item comprado na tela, no container "itensComprados", utilizando classes para o estilo
  
  const containerComprados = document.getElementById("itensComprados");
  if (containerComprados) {
    let conteudo = "";
    
    if (itensLoja[index].tipo === "documento") {
      conteudo = `<p class="item-comprado-doc">${itensLoja[index].nome} - 
                    <a href="${itensLoja[index].link}" target="_blank" download>Baixar Documento</a></p>`;
    } else if (itensLoja[index].tipo === "video") {
      conteudo = `<p class="item-comprado-video">${itensLoja[index].nome} - 
                    <a href="${itensLoja[index].link}" target="_blank">Assistir Vídeo</a></p>`;
    } else {
      conteudo = `<p class="item-comprado-sucesso">${itensLoja[index].nome} - Compra realizada com sucesso!</p>`;
    }
    
    containerComprados.innerHTML += conteudo;
    
    // Você pode também modificar o estilo do container adicionando ou removendo classes:
    containerComprados.classList.add("estilo-itens-comprados");
    
  } else {
    console.log("Container para itens comprados não encontrado!");
  }
}
