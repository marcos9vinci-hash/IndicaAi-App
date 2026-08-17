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

async function formatMessage(template, b) {
  if (!template) return "";
  return template.replace(/{cliente}/g, b.userName || 'Cliente')
    .replace(/{data}/g, b.date ? b.date.split('-').reverse().join('/') : '')
    .replace(/{horario}/g, b.time || '')
    .replace(/{servico}/g, b.descricao_servico || 'tatuagem')
    .replace(/{profissional}/g, b.artistId || 'nosso profissional');
}

async function startBot() {
  console.log("🚀 Inativando fila de WhatsApp...");
  try {
    const settingsSnap = await getDocs(collection(db, 'studio_settings'));
    const settings = settingsSnap.docs.find(d => d.id === 'main')?.data();
    if (!settings?.automation?.enabled) return;

    const { evolutionBaseUrl, evolutionApiKey, evolutionInstance } = settings.automation;
    const now = new Date();
    const bookingsSnap = await getDocs(collection(db, 'bookings'));

    for (const d of bookingsSnap.docs) {
      const b = { id: d.id, ...d.data() };
      const phone = b.userPhone;
      if (!phone || b.status === 'rejected') continue;
      const fullPhone = phone.replace(/\D/g, '').startsWith('55') ? phone.replace(/\D/g, '') : `55${phone.replace(/\D/g, '')}`;

      // 1. CONFIRMAÇÃO
      if (settings.automation.confirmationEnabled && !b.confirmationSent) {
        const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || Date.now());
        if ((now.getTime() - createdAt.getTime()) < 3600000) {
          const msg = await formatMessage(settings.whatsappTemplates?.confirmacao, b);
          await fetch(`${evolutionBaseUrl}/message/sendText/${evolutionInstance}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
            body: JSON.stringify({ number: fullPhone, text: msg })
          });
          await updateDoc(doc(db, 'bookings', b.id), { confirmationSent: true });
          console.log(`✅ Confirmado: ${b.userName}`);
        }
      }

      // 2. LEMBRETE / 3. FOLLOW-UP
      const bookingDate = new Date(`${b.date}T${b.time}`);
      if (!isNaN(bookingDate.getTime())) {
        // Lembrete
        if (settings.automation.reminderEnabled && !b.reminderSent && b.status !== 'completed') {
           const diff = bookingDate.getTime() - now.getTime();
           const limit = (settings.automation.reminderValue || 24) * (settings.automation.reminderUnit === 'minutes' ? 60000 : settings.automation.reminderUnit === 'hours' ? 3600000 : 86400000);
           if (diff > 0 && diff <= limit) {
              const msg = await formatMessage(settings.whatsappTemplates?.lembrete, b);
              await fetch(`${evolutionBaseUrl}/message/sendText/${evolutionInstance}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
                body: JSON.stringify({ number: fullPhone, text: msg })
              });
              await updateDoc(doc(db, 'bookings', b.id), { reminderSent: true });
           }
        }
        // Follow-up
        if (settings.automation.followUpEnabled && !b.followUpSent) {
           const diff = now.getTime() - bookingDate.getTime();
           const limit = (settings.automation.followUpValue || 7) * (settings.automation.followUpUnit === 'minutes' ? 60000 : settings.automation.followUpUnit === 'hours' ? 3600000 : 86400000);
           if (diff >= limit && diff < (limit + 86400000)) {
              const msg = await formatMessage(settings.whatsappTemplates?.followup, b);
              await fetch(`${evolutionBaseUrl}/message/sendText/${evolutionInstance}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
                body: JSON.stringify({ number: fullPhone, text: msg })
              });
              await updateDoc(doc(db, 'bookings', b.id), { followUpSent: true });
           }
        }
      }
    }
  } catch (e) { console.error(e); }
}
startBot();
