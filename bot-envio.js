import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import axios from 'axios';

// Configurações do Firebase
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

async function formatMessage(template, b) {
  if (!template) return "";
  return template.replace(/{cliente}/g, b.userName || 'Cliente')
    .replace(/{data}/g, b.date ? b.date.split('-').reverse().join('/') : '')
    .replace(/{horario}/g, b.time || '')
    .replace(/{servico}/g, b.descricao_servico || 'tatuagem')
    .replace(/{profissional}/g, b.artistId || 'nosso profissional');
}

async function startBot() {
  console.log("🤖 Iniciando Motor de Disparo IndicaAi...");
  try {
    console.log("📡 Conectando ao Firestore...");
    const settingsSnap = await getDocs(collection(db, 'studio_settings'));
    console.log("✅ Conectado ao Firestore.");

    const settings = settingsSnap.docs.find(d => d.id === 'main')?.data();
    if (!settings?.automation?.enabled) {
        console.log("🛑 Automação desativada.");
        return;
    }

    const { evolutionBaseUrl, evolutionApiKey, evolutionInstance } = settings.automation;
    console.log(`🔗 Usando API: ${evolutionBaseUrl} | Instância: ${evolutionInstance}`);

    const now = new Date();
    console.log("📂 Buscando agendamentos...");
    const bookingsSnap = await getDocs(collection(db, 'bookings'));
    console.log(`📊 Analisando ${bookingsSnap.size} agendamentos...`);

    for (const d of bookingsSnap.docs) {
      const b = { id: d.id, ...d.data() };
      if (!b.userPhone || b.status === 'rejected') continue;

      const phone = b.userPhone.replace(/\D/g, '');
      const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;

      // 1. CONFIRMAÇÃO
      if (settings.automation.confirmationEnabled && !b.confirmationSent) {
          const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || Date.now());
          if ((now.getTime() - createdAt.getTime()) < 3600000) { // Janela de 1 hora
            console.log(`✅ Enviando Confirmação para: ${b.userName}`);
            const msg = await formatMessage(settings.whatsappTemplates?.confirmacao, b);
            await axios.post(`${evolutionBaseUrl}/message/sendText/${evolutionInstance}`,
              { number: fullPhone, text: msg },
              { headers: { 'apikey': evolutionApiKey } }
            );
            await updateDoc(doc(db, 'bookings', b.id), { confirmationSent: true });
          }
      }

      // 2. LEMBRETE / 3. FOLLOW-UP
      const bookingDate = new Date(`${b.date}T${b.time}`);
      if (!isNaN(bookingDate.getTime())) {
          // Lembrete
          if (settings.automation.reminderEnabled && !b.reminderSent && b.status !== 'completed' && b.status !== 'no_show') {
             const diff = bookingDate.getTime() - now.getTime();
             const unitMs = settings.automation.reminderUnit === 'minutes' ? 60000 : settings.automation.reminderUnit === 'hours' ? 3600000 : 86400000;
             const limit = (settings.automation.reminderValue || 24) * unitMs;

             if (diff > 0 && diff <= limit) {
                console.log(`⏰ Enviando Lembrete para: ${b.userName}`);
                const msg = await formatMessage(settings.whatsappTemplates?.lembrete, b);
                await axios.post(`${evolutionBaseUrl}/message/sendText/${evolutionInstance}`, { number: fullPhone, text: msg }, { headers: { 'apikey': evolutionApiKey } });
                await updateDoc(doc(db, 'bookings', b.id), { reminderSent: true });
             }
          }
          // Follow-up
          if (settings.automation.followUpEnabled && !b.followUpSent) {
             const diff = now.getTime() - bookingDate.getTime();
             const unitMs = settings.automation.followUpUnit === 'minutes' ? 60000 : settings.automation.followUpUnit === 'hours' ? 3600000 : 86400000;
             const limit = (settings.automation.followUpValue || 7) * unitMs;

             if (diff >= limit && diff < (limit + 86400000)) {
                console.log(`💬 Enviando Follow-up para: ${b.userName}`);
                const msg = await formatMessage(settings.whatsappTemplates?.followup, b);
                await axios.post(`${evolutionBaseUrl}/message/sendText/${evolutionInstance}`, { number: fullPhone, text: msg }, { headers: { 'apikey': evolutionApiKey } });
                await updateDoc(doc(db, 'bookings', b.id), { followUpSent: true });
             }
          }
      }
    }
    console.log("🏁 Fim do processamento.");
    process.exit(0);
  } catch (e) {
    console.error("❌ ERRO NO MOTOR:", e.message);
    process.exit(1);
  }
}

startBot();
