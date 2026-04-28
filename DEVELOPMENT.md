# Guia de Desenvolvimento - Firebase Emulator

Para rodar este projeto localmente e utilizar os emuladores do Firebase para testes (sem precisar gastar cota de SMS real), siga os passos abaixo:

## Prerequisitos

1. Instale o **Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. Faça login no Firebase:
   ```bash
   firebase login
   ```

3. Inicialize os emuladores (se ainda não estiverem):
   ```bash
   firebase init emulators
   ```

## Como rodar o Emulador

No diretório raiz do seu projeto local, execute:

```bash
firebase emulators:start
```

Isso iniciará o **Auth Emulator** na porta 9099 e o **Firestore Emulator** na porta 8080 por padrão.

## Testando Login com Telefone

Os emuladores permitem usar números de teste com códigos fixos. No código atual (`src/lib/firebase.ts`), habilitamos:
`auth.settings.appVerificationDisabledForTesting = true;`

Isso permite que você use os seguintes dados de teste no login:

- **Telefone**: `+5511999999999`
- **Código**: `123456`

## Configuração no Código

O app já está configurado para detectar se você está em `localhost`. 
Em `src/lib/firebase.ts`, descomente as linhas se quiser forçar a conexão com o emulador local mesmo em produção (não recomendado):

```typescript
if (window.location.hostname === 'localhost') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

## Benefícios
- **SMS Ilimitado**: Não gasta cota do Firebase Auth.
- **Banco de Dados Seguro**: O Firestore local limpa os dados ao fechar (ou você pode persistir).
- **Recaptcha Pulado**: O ReCAPTCHA é desativado automaticamente no modo de teste.
