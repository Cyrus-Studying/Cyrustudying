import { auth, db } from "./firebase.js";
import {
  ref,
  get,
  set,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

// REDIRECIONA O BOTÃO MENU
document.getElementById("voltarparaomenulojinha").addEventListener("click", () => {
  window.location.href = "menu.html";
});

// FUNÇÃO PARA OBTER ITENS COMPRADOS
async function obterItensComprados(userId) {
    const itensCompradosRef = ref(db, `usuarios/${userId}/itensComprados`);
    const comprasSnapshot = await get(itensCompradosRef);
    
    if (comprasSnapshot.exists()) {
        return Object.keys(comprasSnapshot.val()); // Retorna os IDs dos itens comprados
    }
    return []; // Retorna lista vazia se nenhum item foi comprado
}

// CARREGA OS ITENS DISPONÍVEIS E VERIFICA SE JÁ FORAM COMPRADOS
async function carregarItensDisponiveis(user) {
    if (!user) return;

    const itensComprados = await obterItensComprados(user.uid);
    
    onValue(ref(db, "itens"), (snapshot) => {
        const containerDisponiveis = document.getElementById("itensDisponiveis");
        if (!containerDisponiveis) {
            console.error("Elemento 'itensDisponiveis' não encontrado!");
            return;
        }

        containerDisponiveis.innerHTML = "";
        const itens = snapshot.val();

        if (!itens) {
            containerDisponiveis.innerHTML = "<p>Nenhum item disponível.</p>";
            return;
        }

        for (const id in itens) {
            const item = itens[id];
            const divItem = document.createElement("div");
            divItem.classList.add("lj-item", "noborder");
            
            // Verifica se o usuário já comprou este item
            const jaComprado = itensComprados.includes(id);
            
            divItem.innerHTML = `
                <h3 class="menu-texto" style="font-size:130%;">${item.nome}</h3>
                <p class="menu-texto" style="font-size:90%;">${item.descricao || ""} - ${item.preco} Tp</p>
                ${jaComprado ? `<p><a href="${item.link}" target="_blank">Acessar conteúdo</a></p>` : ""}
                <button class="button-menu" data-item-id="${id}">Comprar</button>
            `;
            
            containerDisponiveis.appendChild(divItem);
        }

        // Adiciona eventos de clique nos botões de compra
        containerDisponiveis.querySelectorAll(".button-menu").forEach((button) => {
            button.addEventListener("click", () => {
                const itemId = button.getAttribute("data-item-id");
                comprarItem(user.uid, itemId);
            });
        });
    });
}

// MONITORA AUTENTICAÇÃO DO USUÁRIO E CARREGA DADOS
auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log("Usuário autenticado, UID:", user.uid);

        // Aqui, por volta da linha 62
        const tpRef = ref(db, `usuarios/${user.uid}/Tp`);
        onValue(tpRef, (snapshot) => {
            const tpElement = document.getElementById("tp");
            if (!tpElement) {
                console.error("Elemento 'tp' não encontrado!");
                return;
            }
            tpElement.innerText = `Tp: ${snapshot.exists() ? snapshot.val() : 0}`;
            console.log("TriPontos carregados:", snapshot.val());
        });

        // Continuar com o carregamento dos itens
        carregarItensDisponiveis(user);
    } else {
        console.log("Nenhum usuário autenticado!");
    }
});


// FUNÇÃO PARA REALIZAR A COMPRA DE UM ITEM
async function comprarItem(userId, itemId) {
  if (!userId) {
    alert("Usuário não autenticado!");
    return;
  }

  const itemRef = ref(db, `itens/${itemId}`);
  const itemSnapshot = await get(itemRef);
  if (!itemSnapshot.exists()) {
    alert("Item não encontrado!");
    return;
  }
  const item = itemSnapshot.val();
  const precoItem = item.preco;

  const tpRef = ref(db, `usuarios/${userId}/Tp`);
  const tpSnapshot = await get(tpRef);
  const tpAtual = tpSnapshot.exists() ? Number(tpSnapshot.val()) : 0;
  if (tpAtual < precoItem) {
    alert("Pontos insuficientes para comprar este item!");
    return;
  }

  const novoTp = tpAtual - precoItem;
  await set(tpRef, novoTp);

  // Registra a compra usando o mesmo ID do item
  const compraRef = ref(db, `usuarios/${userId}/itensComprados/${itemId}`);
  await set(compraRef, {
    nome: item.nome,
    preco: precoItem,
    tipo: item.tipo || "documento",
    link: item.link || "",
    dataCompra: new Date().toISOString()
  });

  alert(`Compra realizada: ${item.nome}`);

  // Atualiza a exibição dos itens comprados
  carregarItensDisponiveis({ uid: userId });
}
