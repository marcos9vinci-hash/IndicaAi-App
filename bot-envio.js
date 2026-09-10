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

async function formatMessage(template, b) {
  if (!template) return "";
  return template.replace(/{cliente}/g, b.userName || 'Cliente')
    .replace(/{data}/g, b.date ? b.date.split('-').reverse().join('/') : '')
    .replace(/{horario}/g, b.time || '')
    .replace(/{servico}/g, b.descricao_servico || 'tatuagem')
    .replace(/{profissional}/g, b.artistId || 'nosso profissional');
}

async function startBot() {
  console.log("🚀 Iniciando disparo Evolution API...");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    const settingsSnap = await getDocs(collection(db, 'studio_settings'));
    const settings = settingsSnap.docs.find(d => d.id === 'main')?.data();
    if (!settings?.automation?.enabled) return;

    const { evolutionBaseUrl, evolutionApiKey, evolutionInstance } = settings.automation;
    const now = new Date();
    const bookingsSnap = await getDocs(collection(db, 'bookings'));

    const baseUrl = evolutionBaseUrl.replace(/\/$/, '');

    for (const d of bookingsSnap.docs) {
      try {
        const b = { id: d.id, ...d.data() };
        if (!b.userPhone || b.status === 'rejected') continue;

        const phoneClean = b.userPhone.replace(/\D/g, '');
        const fullPhone = phoneClean.startsWith('55') ? phoneClean : `55${phoneClean}`;

        // 1. CONFIRMAÇÃO
        if (settings.automation.confirmationEnabled && !b.confirmationSent) {
            const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || Date.now());
            if ((now.getTime() - createdAt.getTime()) < 3600000) {
              const msg = formatMessage(settings.whatsappTemplates?.confirmacao || "✅ Olá {cliente}, agendamento confirmado!", b);
              await axios.post(`${baseUrl}/message/sendText/${evolutionInstance}`,
                { number: fullPhone, text: msg },
                { headers: { 'apikey': evolutionApiKey }, timeout: 8000 }
              );
              await updateDoc(doc(db, 'bookings', b.id), { confirmationSent: true });
              console.log(`✅ Enviado Confirmação: ${b.userName}`);
            }
        }

        // 2. LEMBRETE / 3. FOLLOW-UP (Lógica simplificada)
        const bookingDate = new Date(`${b.date}T${b.time}`);
        if (!isNaN(bookingDate.getTime())) {
            // Lembrete
            if (settings.automation.reminderEnabled && !b.reminderSent) {
                const diff = bookingDate.getTime() - now.getTime();
                const unitMs = settings.automation.reminderUnit === 'minutes' ? 60000 : settings.automation.reminderUnit === 'hours' ? 3600000 : 86400000;
                if (diff > 0 && diff <= (settings.automation.reminderValue * unitMs)) {
                    const msg = formatMessage(settings.whatsappTemplates?.lembrete || "Oi {cliente}, passando para lembrar!", b);
                    await axios.post(`${baseUrl}/message/sendText/${evolutionInstance}`, { number: fullPhone, text: msg }, { headers: { 'apikey': evolutionApiKey } });
                    await updateDoc(doc(db, 'bookings', b.id), { reminderSent: true });
                }
            }
            // Follow-up
            if (settings.automation.followUpEnabled && !b.followUpSent) {
                const diff = now.getTime() - bookingDate.getTime();
                const unitMs = settings.automation.followUpUnit === 'minutes' ? 60000 : settings.automation.followUpUnit === 'hours' ? 3600000 : 86400000;
                if (diff >= (settings.automation.followUpValue * unitMs) && diff < (settings.automation.followUpValue * unitMs + 86400000)) {
                    const msg = formatMessage(settings.whatsappTemplates?.followup || "Olá {cliente}, como está a cicatrização?", b);
                    await axios.post(`${baseUrl}/message/sendText/${evolutionInstance}`, { number: fullPhone, text: msg }, { headers: { 'apikey': evolutionApiKey } });
                    await updateDoc(doc(db, 'bookings', b.id), { followUpSent: true });
                }
            }
        }
      } catch (itemErr) {
        console.warn(`⚠️ Erro no item ${d.id}:`, itemErr.message);
      }
    }
  } catch (e) {
    console.error("❌ Erro geral:", e.message);
  } finally {
    try { await terminate(db); } catch (_) {}
    process.exit(0);
  }
}
startBot();
