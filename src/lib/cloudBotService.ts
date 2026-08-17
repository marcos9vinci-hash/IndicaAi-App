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
        console.log("✅ Robô acordado!");
      } else {
        const error = await response.text();
        alert(`Erro ao acordar o robô (GitHub): ${response.status}. Verifique as permissões do seu Token.`);
        console.error("❌ Erro:", error);
      }
    } catch (err) {
      console.error("❌ Erro na comunicação com o GitHub:", err);
    }
  }
};
