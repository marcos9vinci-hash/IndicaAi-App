import { initializeApp, terminate } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import axios from 'axios';

const firebaseConfig = {
  apiKey: "AIzaSyAhIXcG4ReuncxNBZSqjXYOu7Exka_TNo0",
  authDomain: "memorizeai-7b8fd.firebaseapp.com",
  projectId: "memorizeai-7b8fd",
  storageBucket: "memorizeai-7b8fd.firebasestorage.app",
  messagingSenderId: "287874618983",
  appId: "1:287874618983:web:30718f0f4f5ad68cb4e6c2"
};

async function startBot() {
  console.log("🚀 Iniciando disparo via API...");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    const settingsSnap = await getDocs(collection(db, 'studio_settings'));
    const settings = settingsSnap.docs.find(d => d.id === 'main')?.data();
    if (!settings?.automation?.enabled) return;

    const { evolutionBaseUrl, evolutionApiKey, evolutionInstance } = settings.automation;
    const now = new Date();
    const bookingsSnap = await getDocs(collection(db, 'bookings'));

    for (const d of bookingsSnap.docs) {
      const b = { id: d.id, ...d.data() };
      if (!b.userPhone || b.status === 'rejected') continue;

      const fullPhone = b.userPhone.replace(/\D/g, '').startsWith('55') ? b.userPhone.replace(/\D/g, '') : `55${b.userPhone.replace(/\D/g, '')}`;

      // 1. CONFIRMAÇÃO (Novo ou Reagendado)
      if (settings.automation.confirmationEnabled && !b.confirmationSent) {
          const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || Date.now());
          if ((now.getTime() - createdAt.getTime()) < 3600000) {
            await axios.post(`${evolutionBaseUrl}/message/sendText/${evolutionInstance}`,
              { number: fullPhone, text: `✅ Olá ${b.userName}, seu agendamento está confirmado para ${b.date} às ${b.time}!` },
              { headers: { 'apikey': evolutionApiKey }, timeout: 10000 }
            );
            await updateDoc(doc(db, 'bookings', b.id), { confirmationSent: true });
            console.log(`✅ Sucesso: ${b.userName}`);
          }
      }
      // Outras lógicas (Lembrete/Followup) aqui...
    }
  } catch (e) {
    console.error("❌ Erro:", e.message);
  } finally {
    await terminate(db);
    console.log("🏁 Robô finalizado.");
    process.exit(0);
  }
}
startBot();
