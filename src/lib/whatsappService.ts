import { Booking, StudioSettings } from '../types';
import { format } from 'date-fns';

export const whatsappService = {
  async sendMessage(to: string, text: string, settings: StudioSettings) {
    if (!settings.automation?.enabled || !settings.automation.evolutionBaseUrl) {
      console.warn("Automação de WhatsApp desativada ou não configurada.");
      return false;
    }

    const { evolutionBaseUrl, evolutionApiKey, evolutionInstance } = settings.automation;

    // Limpar o número
    const phone = to.replace(/\D/g, '');
    const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;

    try {
      const response = await fetch(`${evolutionBaseUrl}/message/sendText/${evolutionInstance}`, {
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao enviar mensagem via Evolution API');
      }

      return true;
    } catch (err) {
      console.error("Erro no envio de WhatsApp:", err);
      return false;
    }
  },

  formatMessage(template: string, booking: Booking) {
    return template
      .replace(/{cliente}/g, booking.userName || 'Cliente')
      .replace(/{data}/g, booking.date.split('-').reverse().join('/'))
      .replace(/{horario}/g, booking.time)
      .replace(/{servico}/g, booking.descricao_servico || 'tatuagem')
      .replace(/{profissional}/g, booking.artistId || 'nosso profissional');
  }
};
