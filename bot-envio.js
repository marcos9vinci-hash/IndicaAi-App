import { initializeApp } from 'firebase/app';
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
  console.log("🚀 Iniciando Motor de Disparo IndicaAi...");
  try {
    const settingsSnap = await getDocs(collection(db, 'studio_settings'));
    const settings = settingsSnap.docs.find(d => d.id === 'main')?.data();
    if (!settings?.automation?.enabled) {
        console.log("🛑 Automação desativada.");
        return;
    }

    const { evolutionBaseUrl, evolutionApiKey, evolutionInstance } = settings.automation;
    const now = new Date();
    const bookingsSnap = await getDocs(collection(db, 'bookings'));

    console.log(`🔍 Analisando ${bookingsSnap.size} agendamentos...`);

    for (const d of bookingsSnap.docs) {
      const b = { id: d.id, ...d.data() };
      if (!b.userPhone || b.status === 'rejected') continue;

      const phone = b.userPhone.replace(/\D/g, '');
      const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;

      // 1. CONFIRMAÇÃO
      if (settings.automation.confirmationEnabled && !b.confirmationSent) {
          console.log(`✅ Enviando Confirmação para: ${b.userName}`);
          const msg = await formatMessage(settings.whatsappTemplates?.confirmacao, b);
          await axios.post(`${evolutionBaseUrl}/message/sendText/${evolutionInstance}`,
            { number: fullPhone, text: msg },
            { headers: { 'apikey': evolutionApiKey } }
          );
          await updateDoc(doc(db, 'bookings', b.id), { confirmationSent: true });
      }

      // 2. LEMBRETE / 3. FOLLOW-UP (Lógica de tempo simplificada)
      const bookingDate = new Date(`${b.date}T${b.time}`);
      if (!isNaN(bookingDate.getTime())) {
          // Lembrete
          if (settings.automation.reminderEnabled && !b.reminderSent && b.status !== 'completed') {
             const diff = bookingDate.getTime() - now.getTime();
             const limit = (settings.automation.reminderValue || 24) * 3600000;
             if (diff > 0 && diff <= limit) {
                const msg = await formatMessage(settings.whatsappTemplates?.lembrete, b);
                await axios.post(`${evolutionBaseUrl}/message/sendText/${evolutionInstance}`, { number: fullPhone, text: msg }, { headers: { 'apikey': evolutionApiKey } });
                await updateDoc(doc(db, 'bookings', b.id), { reminderSent: true });
             }
          }
          // Follow-up
          if (settings.automation.followUpEnabled && !b.followUpSent) {
             const diff = now.getTime() - bookingDate.getTime();
             const limit = (settings.automation.followUpValue || 7) * 3600000;
             if (diff >= limit && diff < (limit + 86400000)) {
                const msg = await formatMessage(settings.whatsappTemplates?.followup, b);
                await axios.post(`${evolutionBaseUrl}/message/sendText/${evolutionInstance}`, { number: fullPhone, text: msg }, { headers: { 'apikey': evolutionApiKey } });
                await updateDoc(doc(db, 'bookings', b.id), { followUpSent: true });
             }
          }
      }
    }
    console.log("🏁 Fim do processamento.");
  } catch (e) {
    console.error("❌ ERRO:", e.response?.data || e.message);
  }
}

startBot();
