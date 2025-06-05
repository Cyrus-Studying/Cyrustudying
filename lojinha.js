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

// CARREGA OS Tp DO USUÁRIO E VERIFICA SE JÁ FOI SALVO NO FIREBASE
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        console.log("Nenhum usuário autenticado!");
        return;
    }

    const userId = user.uid;
    console.log("Usuário autenticado, UID:", userId);

    try {
        const tpRef = ref(db, `usuarios/${userId}/Tp`);
        
        // Monitora mudanças em tempo real para evitar carregamento infinito
        onValue(tpRef, async (snapshot) => {
            let tpValue = snapshot.exists() ? Number(snapshot.val()) : 0;

            // Atualiza a interface apenas se o elemento existir
            const tpElement = document.getElementById("tp");
            if (tpElement) {
                tpElement.innerText = `Tp: ${tpValue}`;
            } else {
                console.error("Elemento 'tp' não encontrado!");
            }

            console.log("Pontos encontrados:", tpValue);

            // Se Tp ainda não existir no banco, inicializa com 0
            if (!snapshot.exists()) {
                await set(tpRef, 0);
                console.log("Tp inicializado com 0.");
            }
        });

    } catch (error) {
        console.error("Erro ao buscar/salvar Tp:", error);
    }
});

// FUNÇÃO PARA REALIZAR A COMPRA DE UM ITEM
async function comprarItem(itemId) {
  const userId = auth.currentUser?.uid;
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

  alert(`Compra realizada: ${item.nome}`);
}
