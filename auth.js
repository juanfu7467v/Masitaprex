// Importa las funciones necesarias de los SDKs de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  onAuthStateChanged, sendPasswordResetEmail, 
  // ¡NUEVO! Importaciones para Google Auth
  GoogleAuthProvider, signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, doc, setDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// Tu configuración de Firebase para la aplicación web
const firebaseConfig = {
  apiKey: "AIzaSyAvzBfVUN_xRw-fuBEZdhoTasTMws1yERg", 
  authDomain: "consulta-pe-abf99.firebaseapp.com",
  projectId: "consulta-pe-abf99",
  storageBucket: "consulta-pe-abf99.firebasestorage.app",
  messagingSenderId: "610275972424",
  appId: "1:610275972424:web:01a90ea3b00fcb1fc64f7d", 
  measurementId: "G-G5MS9N3PCH" 
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); 
const db = getFirestore(app); 

// --- Referencias a elementos del DOM ---
const formMessageTooltip = document.getElementById('form-message-tooltip'); 
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const recoverPasswordForm = document.getElementById('recover-password-form');
const loadingIndicator = document.getElementById('loading-indicator'); 
const avatar = document.querySelector('.avatar');

// --- Funciones de utilidad ---
function showMessage(msg, type) {
    if (formMessageTooltip) {
        formMessageTooltip.textContent = msg;
        formMessageTooltip.className = `form-message-tooltip active ${type}`; 
        setTimeout(() => {
            formMessageTooltip.classList.remove('active'); 
        }, 5000);
    }
}

function showLoadingOverlay() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }
}

function hideLoadingOverlay() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

function hideAllForms() {
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'none';
    if (recoverPasswordForm) recoverPasswordForm.style.display = 'none';
    if (avatar) avatar.style.display = 'none';
    if (formMessageTooltip) formMessageTooltip.classList.remove('active'); 
}

// --- Funciones de vista (exportadas al scope global) ---
window.showRegisterForm = () => {
    hideAllForms();
    if (avatar) avatar.style.display = 'block'; 
    if (registerForm) registerForm.style.display = 'flex';
    hideLoadingOverlay(); 
};

window.showLoginForm = () => {
    hideAllForms();
    if (avatar) avatar.style.display = 'block'; 
    if (loginForm) loginForm.style.display = 'flex';
    hideLoadingOverlay(); 
};

window.showRecoverPasswordForm = () => {
    hideAllForms();
    if (avatar) avatar.style.display = 'block'; 
    if (recoverPasswordForm) recoverPasswordForm.style.display = 'flex';
    hideLoadingOverlay(); 
};

window.togglePasswordVisibility = (inputId, iconId) => {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(iconId);

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.textContent = 'visibility_off';
    } else {
        passwordInput.type = 'password';
        toggleIcon.textContent = 'visibility';
    }
};

// --- FUNCIÓN NUEVA: INICIO DE SESIÓN CON GOOGLE ---
window.loginWithGoogle = async () => {
    showLoadingOverlay();
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log("Inicio de sesión con Google exitoso:", user);

        await saveUserProfile(user, user.displayName);

        showMessage(`Bienvenido, ${user.displayName || user.email}!`, 'success');
        redirectToNextPage(); // Redirige al dashboard
    } catch (error) {
        hideLoadingOverlay();
        let errorMessage = 'Error al iniciar sesión con Google. Inténtalo de nuevo.';
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Ventana de inicio de sesión de Google cerrada.';
        }
        showMessage(errorMessage, 'error');
        console.error("Error al iniciar sesión con Google:", error.message);
    }
};
// --- FIN FUNCIÓN NUEVA ---

// --- Funciones de autenticación existentes ---
window.loginWithEmail = async () => {
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');

  const email = emailInput ? emailInput.value : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!email || !password) {
      showMessage('Por favor, ingresa tu correo y contraseña.', 'error');
      return; 
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
      showMessage('Por favor, ingresa un formato de correo electrónico válido.', 'error');
      return;
  }

  showLoadingOverlay(); 
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Inicio de sesión con correo exitoso:", userCredential.user);
    
    await saveUserProfile(userCredential.user);
    
    showMessage('Inicio de sesión exitoso!', 'success'); 
    redirectToNextPage(); 
  } catch (error) {
    hideLoadingOverlay();
    let errorMessage = 'Error al iniciar sesión. Verifica tu correo y contraseña.';
    if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuario no encontrado. ¿Necesitas registrarte?';
    } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta.';
    } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del correo es inválido.';
    }
    showMessage(errorMessage, 'error');
    console.error("Error al iniciar sesión con correo:", error.message);
  }
};

window.registerNewAccount = async () => {
  const nameInput = document.getElementById('register-name');
  const emailInput = document.getElementById('register-email');
  const passwordInput = document.getElementById('register-password');
  const confirmPasswordInput = document.getElementById('register-confirm-password');

  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';
  const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

  if (!name || !email || !password || password.length < 6 || password !== confirmPassword || !/\S+@\S+\.\S+/.test(email)) {
      showMessage('Por favor, verifica todos los campos. La contraseña debe tener al menos 6 caracteres y coincidir.', 'error');
      return;
  }

  showLoadingOverlay();
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Registro con correo exitoso:", userCredential.user);
    
    await saveUserProfile(userCredential.user, name); 

    showMessage(`¡Cuenta creada exitosamente para ${userCredential.user.email}!`, 'success');
    redirectToNextPage();
  } catch (error) {
    hideLoadingOverlay();
    let errorMessage = 'Error al registrarse. Intenta con otro correo.';
    if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo ya está en uso. ¿Deseas iniciar sesión?';
    } else if (error.code === 'auth/weak-password') {
         errorMessage = 'La contraseña es demasiado débil. Necesita al menos 6 caracteres.';
    }
    showMessage(errorMessage, 'error');
    console.error("Error al registrarse:", error.message);
  }
};

window.recoverPassword = async () => {
    const emailInput = document.getElementById('recover-email');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        showMessage('Por favor, ingresa un formato de correo electrónico válido.', 'error');
        return;
    }

    showLoadingOverlay();
    try {
        await sendPasswordResetEmail(auth, email);
        hideLoadingOverlay();
        showMessage('Se ha enviado un correo de recuperación a tu dirección. Por favor, revisa tu bandeja de entrada.', 'success');
        setTimeout(() => {
            showLoginForm(); 
        }, 3000); 
    } catch (error) {
        hideLoadingOverlay();
        let errorMessage = 'Error al enviar el correo de recuperación. Asegúrate de que el correo sea válido.';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No se encontró una cuenta con ese correo electrónico.';
        }
        showMessage(errorMessage, 'error');
        console.error("Error al recuperar contraseña:", error.message);
    }
};

// Función para guardar o actualizar el perfil del usuario en Firestore
async function saveUserProfile(user, name = null) {
  try {
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      email: user.email,
      name: name || user.displayName || user.email.split('@')[0],
      createdAt: serverTimestamp(),
      photoURL: user.photoURL || user.photoURL 
    }, { merge: true });
    console.log("Perfil de usuario guardado/actualizado en Firestore:", user.uid);
  } catch (error) {
    console.error("Error al guardar el perfil en Firestore:", error);
  }
}

// --- Función para la redirección (Ajustada al dashboard.html) ---
function redirectToNextPage() {
    window.location.href = "dashboard.html"; // Redirige a la página de la aplicación
}

// --- Comprobación inicial del estado de autenticación ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    redirectToNextPage();
  } else {
    setTimeout(() => {
        // La lógica de redirección a "go:rapidas" o "action_exit" es específica de ciertas plataformas
        // Para el ambiente web, si no está autenticado, simplemente se muestra el login.
        if (window.location.hash === '#recover') {
            showRecoverPasswordForm();
        } else {
            showLoginForm(); 
        }
        hideLoadingOverlay();
    }, 500);
  }
});

// Al cargar la página, ocultar formularios y mostrar el loading
document.addEventListener('DOMContentLoaded', () => {
    hideAllForms();
    showLoadingOverlay();
});
