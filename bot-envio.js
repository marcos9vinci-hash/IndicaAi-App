import { initializeApp, terminate } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';

const firebaseConfig = {
  apiKey: "AIzaSyAhIXcG4ReuncxNBZSqjXYOu7Exka_TNo0",
  authDomain: "memorizeai-7b8fd.firebaseapp.com",
  projectId: "memorizeai-7b8fd",
  storageBucket: "memorizeai-7b8fd.firebasestorage.app",
  messagingSenderId: "287874618983",
  appId: "1:287874618983:web:30718f0f4f5ad68cb4e6c2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function logAutomation(msg, type = 'info') {
  try {
    await addDoc(collection(db, 'automation_logs'), {
      message: msg,
      type: type,
      timestamp: serverTimestamp()
    });
    console.log(`[LOG]: ${msg}`);
  } catch (e) { console.error("Erro ao logar:", e); }
}

async function startBot() {
  await logAutomation("🤖 Robô na nuvem iniciado.");
  try {
    const settingsSnap = await getDocs(collection(db, 'studio_settings'));
    const settings = settingsSnap.docs.find(d => d.id === 'main')?.data();

    if (!settings?.automation?.enabled) {
      await logAutomation("🛑 Automação desativada nas configs.", "warn");
      return;
    }

    const { evolutionBaseUrl, evolutionApiKey, evolutionInstance } = settings.automation;
    const bookingsSnap = await getDocs(collection(db, 'bookings'));
    const now = new Date();

    for (const d of bookingsSnap.docs) {
      const b = { id: d.id, ...d.data() };
      if (!b.userPhone || b.confirmationSent || b.status === 'rejected') continue;

      const phone = b.userPhone.replace(/\D/g, '');
      const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;

      const msg = `✅ Olá ${b.userName}, seu agendamento está confirmado!`;
      const url = `${evolutionBaseUrl.replace(/\/$/, '')}/message/sendText/${evolutionInstance}`;

      try {
        await axios.post(url, { number: fullPhone, text: msg }, { headers: { 'apikey': evolutionApiKey }, timeout: 8000 });
        await updateDoc(doc(db, 'bookings', b.id), { confirmationSent: true });
        await logAutomation(`✅ Mensagem enviada para ${b.userName}`);
      } catch (err) {
        await logAutomation(`❌ Falha ao enviar para ${b.userName}: ${err.response?.data?.message || err.message}`, "error");
      }
    }
  } catch (e) {
    await logAutomation(`💥 Erro Crítico: ${e.message}`, "error");
  } finally {
    await logAutomation("🏁 Robô finalizou a tarefa.");
    process.exit(0);
  }
}
startBot();
