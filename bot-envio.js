import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

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

async function formatMessage(template, booking) {
  if (!template) return "";
  return template
    .replace(/{cliente}/g, booking.userName || 'Cliente')
    .replace(/{data}/g, booking.date ? booking.date.split('-').reverse().join('/') : '')
    .replace(/{horario}/g, booking.time || '')
    .replace(/{servico}/g, booking.descricao_servico || 'tatuagem')
    .replace(/{profissional}/g, booking.artistId || 'nosso profissional');
}

async function sendWhatsApp(baseUrl, instance, apikey, number, text) {
  try {
    const response = await fetch(`${baseUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': apikey },
      body: JSON.stringify({ number, text })
    });
    return response.ok;
  } catch (e) {
    return false;
  }
}

async function startBot() {
  console.log("🤖 Inativando fila...");
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

      const phone = b.userPhone.replace(/\D/g, '');
      const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;

      // 1. CONFIRMAÇÃO
      if (settings.automation.confirmationEnabled && !b.confirmationSent) {
        const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || Date.now());
        if ((now.getTime() - createdAt.getTime()) < 3600000) {
          const msg = await formatMessage(settings.whatsappTemplates?.confirmacao, b);
          if (await sendWhatsApp(evolutionBaseUrl, evolutionInstance, evolutionApiKey, fullPhone, msg)) {
            await updateDoc(doc(db, 'bookings', b.id), { confirmationSent: true });
            console.log(`✅ Enviado Confirmação: ${b.userName}`);
          }
        }
      }

      // 2. LEMBRETE / 3. FOLLOW-UP (Lógica baseada em tempo)
      const bookingDate = new Date(`${b.date}T${b.time}`);
      if (!isNaN(bookingDate.getTime())) {
         // Lembrete
         if (settings.automation.reminderEnabled && !b.reminderSent) {
            const diff = bookingDate.getTime() - now.getTime();
            const limit = (settings.automation.reminderValue || 24) * 60 * 60 * 1000;
            if (diff > 0 && diff <= limit) {
               const msg = await formatMessage(settings.whatsappTemplates?.lembrete, b);
               if (await sendWhatsApp(evolutionBaseUrl, evolutionInstance, evolutionApiKey, fullPhone, msg)) {
                  await updateDoc(doc(db, 'bookings', b.id), { reminderSent: true });
               }
            }
         }
         // Follow-up
         if (settings.automation.followUpEnabled && !b.followUpSent) {
            const diff = now.getTime() - bookingDate.getTime();
            const limit = (settings.automation.followUpValue || 7) * 60 * 60 * 1000;
            if (diff >= limit && diff < (limit + 86400000)) {
               const msg = await formatMessage(settings.whatsappTemplates?.followup, b);
               if (await sendWhatsApp(evolutionBaseUrl, evolutionInstance, evolutionApiKey, fullPhone, msg)) {
                  await updateDoc(doc(db, 'bookings', b.id), { followUpSent: true });
               }
            }
         }
      }
    }
  } catch (err) {
    console.error("Erro:", err);
  }
}

startBot();
