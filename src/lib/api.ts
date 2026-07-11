const SECRET = import.meta.env.VITE_WEBHOOK_SECRET || '';
const N8N = 'https://n8n.guinevesapi.xyz/webhook';

export async function n8nPost(path: string, body: object) {
  const res = await fetch(`${N8N}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ontrigger-secret': SECRET,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`n8n error ${res.status}`);
  return res.json();
}

export const PLANOS = [
  { id: 'trial',    nome: 'Trial (7 dias)', numeros: 1, msgs: 10,  tem_ia: false, preco: 0    },
  { id: '1_sem_ia', nome: 'Starter',         numeros: 1, msgs: 50,  tem_ia: false, preco: 500  },
  { id: '1_com_ia', nome: 'Starter + IA',    numeros: 1, msgs: 50,  tem_ia: true,  preco: 800  },
  { id: '2_sem_ia', nome: 'Pro',              numeros: 2, msgs: 100, tem_ia: false, preco: 800  },
  { id: '2_com_ia', nome: 'Pro + IA',         numeros: 2, msgs: 100, tem_ia: true,  preco: 1000 },
  { id: '4_sem_ia', nome: 'Business',         numeros: 4, msgs: 200, tem_ia: false, preco: 1000 },
  { id: '4_com_ia', nome: 'Business + IA',    numeros: 4, msgs: 200, tem_ia: true,  preco: 1200 },
  { id: '8_com_ia', nome: 'Enterprise + IA',  numeros: 8, msgs: 400, tem_ia: true,  preco: null },
] as const;

export type PlanoId = typeof PLANOS[number]['id'];

export function getPlano(id: string) {
  return PLANOS.find(p => p.id === id) ?? PLANOS[0];
}
