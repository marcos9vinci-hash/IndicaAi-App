
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAhIXcG4ReuncxNBZSqjXYOu7Exka_TNo0",
  projectId: "memorizeai-7b8fd",
  appId: "1:287874618983:web:30718f0f4f5ad68cb4e6c2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-dcd3cc7e-f58b-453b-a948-88e194766ac9");

async function seed() {
  try {
    await setDoc(doc(db, 'invites', 'STUDIOVIP'), {
      code: "STUDIOVIP",
      active: true,
      maxUses: 100,
      usesCount: 0,
      createdAt: new Date().toISOString()
    });
    console.log("✅ Convite STUDIOVIP criado com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao criar convite:", error);
    process.exit(1);
  }
}

seed();
