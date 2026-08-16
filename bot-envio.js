import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';

// Configurações do Firebase (Puxadas do seu .env)
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
  return template
    .replace(/{cliente}/g, booking.userName || 'Cliente')
    .replace(/{data}/g, booking.date.split('-').reverse().join('/'))
    .replace(/{horario}/g, booking.time)
    .replace(/{servico}/g, booking.descricao_servico || 'tatuagem')
    .replace(/{profissional}/g, booking.artistId || 'nosso profissional');
}

async function startBot() {
  console.log("🤖 Robô IndicaAi: Iniciando verificação...");

  try {
    // 1. Pegar Configurações
    const settingsSnap = await getDocs(collection(db, 'studio_settings'));
    const settings = settingsSnap.docs.find(d => d.id === 'main')?.data();

    if (!settings?.automation?.enabled) {
      console.log("⚠️ Automação desativada nas configurações.");
      return;
    }

    const { evolutionBaseUrl, evolutionApiKey, evolutionInstance } = settings.automation;
    const now = new Date();

    const getMs = (value, unit) => {
      if (unit === 'minutes') return value * 60 * 1000;
      if (unit === 'hours') return value * 60 * 60 * 1000;
      return value * 24 * 60 * 60 * 1000;
    };

    // 2. Pegar Agendamentos
    const bookingsSnap = await getDocs(collection(db, 'bookings'));
    const bookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    for (const b of bookings) {
      const bookingDate = new Date(`${b.date}T${b.time}`);
      if (isNaN(bookingDate.getTime())) continue;

      const phone = b.userPhone;
      if (!phone) continue;

      const formattedPhone = phone.replace(/\D/g, '').startsWith('55') ? phone.replace(/\D/g, '') : `55${phone.replace(/\D/g, '')}`;

      // --- LÓGICA DE LEMBRETE ---
      if (settings.automation.reminderEnabled && !b.reminderSent && b.status !== 'rejected') {
        const diff = bookingDate.getTime() - now.getTime();
        const limit = getMs(settings.automation.reminderValue, settings.automation.reminderUnit);
        if (diff > 0 && diff <= limit) {
          console.log(`✉️ Enviando LEMBRETE para ${b.userName}...`);
          const text = await formatMessage(settings.whatsappTemplates?.lembrete || "Oi {cliente}, lembrando da sua tattoo!", b);
          await send(evolutionBaseUrl, evolutionInstance, evolutionApiKey, formattedPhone, text);
          await updateDoc(doc(db, 'bookings', b.id), { reminderSent: true });
        }
      }

      // --- LÓGICA DE FOLLOW-UP ---
      if (settings.automation.followUpEnabled && !b.followUpSent && b.status !== 'rejected') {
        const diff = now.getTime() - bookingDate.getTime();
        const limit = getMs(settings.automation.followUpValue, settings.automation.followUpUnit);
        if (diff >= limit) {
          console.log(`✉️ Enviando FOLLOW-UP para ${b.userName}...`);
          const text = await formatMessage(settings.whatsappTemplates?.followup || "Olá {cliente}, como está a cicatrização?", b);
          await send(evolutionBaseUrl, evolutionInstance, evolutionApiKey, formattedPhone, text);
          await updateDoc(doc(db, 'bookings', b.id), { followUpSent: true });
        }
      }
    }
    console.log("✅ Verificação concluída.");
  } catch (err) {
    console.error("❌ Erro no robô:", err);
  }
}

async function send(baseUrl, instance, apikey, number, text) {
  try {
    await fetch(`${baseUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': apikey },
      body: JSON.stringify({ number, text })
    });
  } catch (e) {
    console.error("Erro fetch:", e);
  }
}

startBot();
