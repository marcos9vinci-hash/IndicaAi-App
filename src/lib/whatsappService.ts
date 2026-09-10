import { Booking, StudioSettings } from '../types';
import { db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const whatsappService = {
  async sendMessage(to: string, text: string, settings: StudioSettings) {
    if (!settings.automation?.enabled || !settings.automation.evolutionBaseUrl) {
      console.warn("WhatsApp: Configuração ausente.");
      return false;
    }

    const { evolutionBaseUrl, evolutionApiKey, evolutionInstance } = settings.automation;
    const phone = to.replace(/\D/g, '');
    const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;

    const baseUrl = evolutionBaseUrl.replace(/\/$/, '');
    const url = `${baseUrl}/message/sendText/${evolutionInstance}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey
        },
        body: JSON.stringify({
          number: formattedPhone,
          text: text,
          linkPreview: true
        })
      });

      return response.ok;
    } catch (err: any) {
      console.error("❌ Erro WhatsApp:", err.message);
      return false;
    }
  },

  formatMessage(template: string, booking: Booking) {
    if (!template) return "";
    return template
      .replace(/{cliente}/g, booking.userName || 'Cliente')
      .replace(/{data}/g, booking.date ? booking.date.split('-').reverse().join('/') : '')
      .replace(/{horario}/g, booking.time || '')
      .replace(/{servico}/g, booking.descricao_servico || 'tatuagem')
      .replace(/{profissional}/g, booking.artistId || 'nosso profissional');
  },

  async sendBookingConfirmation(booking: Partial<Booking> & { id?: string; userPhone?: string; userName?: string; date?: string; time?: string }, customSettings?: StudioSettings) {
    try {
      if (!booking.userPhone) return false;
      let settings = customSettings;
      if (!settings) {
        const snap = await getDoc(doc(db, 'studio_settings', 'main'));
        if (snap.exists()) settings = snap.data() as StudioSettings;
      }
      if (!settings?.automation?.enabled) return false;

      const template = settings.whatsappTemplates?.confirmacao || "✅ Olá {cliente}, agendamento confirmado para {data} às {horario}!";
      const success = await this.sendMessage(booking.userPhone, this.formatMessage(template, booking as Booking), settings);

      if (success && booking.id) {
        await updateDoc(doc(db, 'bookings', booking.id), { confirmationSent: true });
      }
      return success;
    } catch (err) {
      return false;
    }
  }
};
