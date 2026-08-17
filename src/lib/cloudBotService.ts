export const cloudBotService = {
  async triggerBot() {
    // Configurações do seu repositório
    const owner = 'marcos9vinci-hash';
    const repo = 'IndicaAi-App';
    const token = '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';

    console.log("🚀 Notificando robô na nuvem para ação imediata...");

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'trigger-whatsapp-bot'
        })
      });

      if (response.ok) {
        console.log("✅ Robô acordado com sucesso!");
      } else {
        console.error("❌ Falha ao acordar o robô:", await response.text());
      }
    } catch (err) {
      console.error("❌ Erro na comunicação com o GitHub:", err);
    }
  }
};
