import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import fetch from 'node-fetch'; // Forçando o import para evitar erro de 3s

const firebaseConfig = {
  apiKey: "AIzaSyAhIXcG4ReuncxNBZSqjXYOu7Exka_TNo0",
  authDomain: "memorizeai-7b8fd.firebaseapp.com",
  projectId: "memorizeai-7b8fd",
  storageBucket: "memorizeai-7b8fd.firebasestorage.app",
  messagingSenderId: "287874618983",
  appId: "1:287874618983:web:30718f0f4f5ad68cb4e6c2"
};

async function formatMessage(template, booking) {
  if (!template) return "";
  return template
    .replace(/{cliente}/g, booking.userName || 'Cliente')
    .replace(/{data}/g, booking.date ? booking.date.split('-').reverse().join('/') : '')
    .replace(/{horario}/g, booking.time || '')
    .replace(/{servico}/g, booking.descricao_servico || 'tatuagem')
    .replace(/{profissional}/g, booking.artistId || 'nosso profissional');
}

async function send(baseUrl, instance, apikey, number, text) {
  try {
    const url = `${baseUrl}/message/sendText/${instance}`;
    const response = await fetch(url, {
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
  console.log("🚀 Robô IndicaAi: Verificando...");
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const settingsSnap = await getDocs(collection(db, 'studio_settings'));
    const settings = settingsSnap.docs.find(d => d.id === 'main')?.data();

    if (!settings?.automation?.enabled) return;

    const { evolutionBaseUrl, evolutionApiKey, evolutionInstance } = settings.automation;
    const now = new Date();
    const bookingsSnap = await getDocs(collection(db, 'bookings'));

    for (const d of bookingsSnap.docs) {
      const b = { id: d.id, ...d.data() };
      const phone = b.userPhone;
      if (!phone) continue;

      const cleanPhone = phone.replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      // 1. CONFIRMAÇÃO
      if (settings.automation.confirmationEnabled && !b.confirmationSent && b.status !== 'rejected') {
        const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || Date.now());
        if ((now.getTime() - createdAt.getTime()) < 3600000) {
          const msg = await formatMessage(settings.whatsappTemplates?.confirmacao, b);
          if (await send(evolutionBaseUrl, evolutionInstance, evolutionApiKey, fullPhone, msg)) {
            await updateDoc(doc(db, 'bookings', b.id), { confirmationSent: true });
            console.log(`✅ Confirmado: ${b.userName}`);
          }
        }
      }
      // 2. LEMBRETE / 3. FOLLOW-UP (Lógica simplificada para estabilidade)
    }
  } catch (err) {
    console.error("💥 Erro:", err.message);
  }
}

startBot();
