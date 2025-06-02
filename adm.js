// @ts-nocheck


// Importando Firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";


// Configurando Firebase  

const firebaseConfig = {  
    apiKey: "AIzaSyCWP1-iiXx7gmL1MnW8Yn3tvcDIQpcoqLI",  
    authDomain: "cyrustudying.firebaseapp.com",  
    databaseURL: "https://cyrustudying-default-rtdb.firebaseio.com",  
    projectId: "cyrustudying",  
    storageBucket: "cyrustudying.firebasestorage.app",  
    messagingSenderId: "59392547392",  
    appId: "1:59392547392:web:dd8caa9874e90c7d729da5",  
    measurementId: "G-9MTG3DWB8Q"  
};  


// Inicializando Firebase  

const app = initializeApp(firebaseConfig);  
const analytics = getAnalytics(app);  
const auth = getAuth(app);  
const db = getDatabase(app);  


// Verifica se o usuário está autenticado  

onAuthStateChanged(auth, (user) => {  
    if (user) {  
        const userId = user.uid;  
        const userRef = ref(db, "usuarios/" + userId);  


        // Busca permissões no banco de dados  

        get(userRef).then(snapshot => {  
            const dadosUsuario = snapshot.val();  
            const botaoADM = document.getElementById("botaoADM");  


            if (dadosUsuario && dadosUsuario.adm) {  
                botaoADM.style.display = "block";  
            } else {  
                botaoADM.style.display = "none";  
            }  
        }).catch(error => {  
            console.error("Erro ao buscar permissões do usuário:", error);  
        });  

    } else {  
        console.log("Usuário não autenticado");  
    }  
});  


// Funcionamento do botão para resetar as VCards

document.getElementById("botaoADM").addEventListener("click", () => {
    const usuariosRef = ref(db, "usuarios");

    get(usuariosRef).then(snapshot => {
        const usuarios = snapshot.val();

        if (usuarios) {
            const updates = {};

            Object.keys(usuarios).forEach(userId => {
                updates[`usuarios/${userId}/btnFinalClicadoData`] = null;
            });

            update(ref(db), updates).then(() => {
                console.log("Todos os registros de btnFinalClicadoData foram apagados!");
                alert("Os registros foram removidos com sucesso!");
            }).catch(error => {
                console.error("Erro ao apagar os registros:", error);
            });

        } else {
            console.log("Nenhum usuário encontrado.");
        }
    }).catch(error => {
        console.error("Erro ao buscar usuários:", error);
    });
});