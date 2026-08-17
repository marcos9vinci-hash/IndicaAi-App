import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

console.log("🚀 INICIANDO BOT DE WHATSAPP...");

// Configurações do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAhIXcG4ReuncxNBZSqjXYOu7Exka_TNo0",
  authDomain: "memorizeai-7b8fd.firebaseapp.com",
  projectId: "memorizeai-7b8fd",
  storageBucket: "memorizeai-7b8fd.firebasestorage.app",
  messagingSenderId: "287874618983",
  appId: "1:287874618983:web:30718f0f4f5ad68cb4e6c2"
};

try {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  console.log("✅ Firebase inicializado com sucesso.");

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
    console.log(`   -> Enviando para ${number}...`);
    try {
      const url = `${baseUrl}/message/sendText/${instance}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': apikey },
        body: JSON.stringify({ number, text })
      });

      if (response.ok) {
        console.log(`   -> ✅ Sucesso!`);
        return true;
      } else {
        const errTxt = await response.text();
        console.error(`   -> ❌ Erro API (${response.status}): ${errTxt}`);
        return false;
      }
    } catch (e) {
      console.error(`   -> 💥 Erro de Conexão: ${e.message}`);
      return false;
    }
  }

  async function startBot() {
    console.log("📡 Buscando dados do Firestore...");
    const settingsSnap = await getDocs(collection(db, 'studio_settings'));
    const settings = settingsSnap.docs.find(d => d.id === 'main')?.data();

    if (!settings?.automation?.enabled) {
      console.log("⚠️ Automação desativada nas configurações do app.");
      return;
    }

    const { evolutionBaseUrl, evolutionApiKey, evolutionInstance } = settings.automation;
    const now = new Date();

    const getMs = (value, unit) => {
      const v = Number(value) || 0;
      if (unit === 'minutes') return v * 60 * 1000;
      if (unit === 'hours') return v * 60 * 60 * 1000;
      return v * 24 * 60 * 60 * 1000;
    };

    const bookingsSnap = await getDocs(collection(db, 'bookings'));
    const bookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`📊 Analisando ${bookings.length} agendamentos...`);

    for (const b of bookings) {
      try {
        const phone = b.userPhone;
        if (!phone) continue;

        const cleanPhone = phone.replace(/\D/g, '');
        const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

        // 1. CONFIRMAÇÃO
        if (settings.automation.confirmationEnabled && !b.confirmationSent && b.status !== 'rejected') {
          const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || Date.now());
          const ageMs = now.getTime() - createdAt.getTime();

          if (ageMs < 3600000) { // Janela de 1 hora para novos
            console.log(`🚀 [CONFIRMAÇÃO] Ativado para ${b.userName}`);
            const msg = await formatMessage(settings.whatsappTemplates?.confirmacao, b);
            if (await send(evolutionBaseUrl, evolutionInstance, evolutionApiKey, fullPhone, msg)) {
              await updateDoc(doc(db, 'bookings', b.id), { confirmationSent: true });
            }
          }
        }

        // 2. LEMBRETE
        const bookingDate = new Date(`${b.date}T${b.time}`);
        if (!isNaN(bookingDate.getTime())) {
          if (settings.automation.reminderEnabled && !b.reminderSent && b.status !== 'rejected' && b.status !== 'completed') {
            const diff = bookingDate.getTime() - now.getTime();
            const limit = getMs(settings.automation.reminderValue, settings.automation.reminderUnit);
            if (diff > 0 && diff <= limit) {
              console.log(`🚀 [LEMBRETE] Ativado para ${b.userName}`);
              const msg = await formatMessage(settings.whatsappTemplates?.lembrete, b);
              if (await send(evolutionBaseUrl, evolutionInstance, evolutionApiKey, fullPhone, msg)) {
                await updateDoc(doc(db, 'bookings', b.id), { reminderSent: true });
              }
            }
          }

          // 3. FOLLOW-UP
          if (settings.automation.followUpEnabled && !b.followUpSent && b.status !== 'rejected') {
            const diff = now.getTime() - bookingDate.getTime();
            const limit = getMs(settings.automation.followUpValue, settings.automation.followUpUnit);
            if (diff >= limit && diff < (limit + 86400000)) { // Janela de 24h
              console.log(`🚀 [FOLLOW-UP] Ativado para ${b.userName}`);
              const msg = await formatMessage(settings.whatsappTemplates?.followup, b);
              if (await send(evolutionBaseUrl, evolutionInstance, evolutionApiKey, fullPhone, msg)) {
                await updateDoc(doc(db, 'bookings', b.id), { followUpSent: true });
              }
            }
          }
        }
      } catch (err) {
        console.error(`❌ Erro no agendamento ${b.id}:`, err.message);
      }
    }
    console.log("🏁 Verificação concluída com sucesso.");
  } catch (err) {
    console.error("💥 ERRO NO FLUXO PRINCIPAL:", err);
  }
}

startBot();
