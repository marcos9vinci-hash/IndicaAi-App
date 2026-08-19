export const cloudBotService = {
  async triggerBot() {
    const owner = 'marcos9vinci-hash';
    const repo = 'IndicaAi-App';
    const token = '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';

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event_type: 'trigger-whatsapp-bot' })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("❌ GitHub Dispatch Error:", response.status, error);
      } else {
        console.log("🚀 SINAL ENVIADO PARA O GITHUB!");
      }
    } catch (err: any) {
      console.error("❌ Falha na conexão:", err.message);
    }
  }
};
