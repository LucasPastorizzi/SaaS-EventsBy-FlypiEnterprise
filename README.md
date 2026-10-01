# INN Lounge Bar · Reserva de camarotes

App web de reserva de camarotes para o **INN Lounge Bar** (R. Gen. Osório, 951 · Hamburgo Velho, Novo Hamburgo/RS). Desenvolvido pela Flypi Enterprise.

O cliente escolhe a noite, vê o **mapa do salão e da cobertura** com os camarotes livres em tempo real, manda os dados e a lista da turma. A equipe do INN confirma pelo painel e o cliente recebe o **QR Code** de entrada. Não há valores nem pagamento no fluxo.

> **Fase atual: só front-end.** Não há banco nem backend ainda. Os dados são de demonstração (line-ups e nomes de clientes fictícios) e ficam no `localStorage` do navegador. Cada ação de `src/lib/store.ts` corresponde a uma rota/RPC do backend futuro.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Telas

| Quem usa | Rota | O que tem |
|---|---|---|
| Cliente | `/` | Página do INN: próximas noites, mapa ao vivo, como funciona, os camarotes, localização, regras e FAQ |
| Cliente | `/noite/[slug]` | Mapa interativo (salão + cobertura, zoom com pinça), camarote separado por 10 min, dados, ocasião especial, lista de convidados |
| Cliente | `/reserva/[id]` | Status da solicitação → QR Code quando confirmada, lista do camarote, cancelamento |
| Convidado | `/convite/[código]` | Link que o titular manda no grupo para cada um entrar na lista |
| Cliente | `/minhas-reservas` | Próximas e anteriores |
| Casa | `/painel` | Solicitações para confirmar/recusar, ocupação das noites, pessoas esperadas |
| Casa | `/painel/reservas` | Todas as reservas, filtros, lista de convidados, reserva por telefone, exportar lista |
| Casa | `/painel/eventos` | Criar noites, programação, bloquear camarotes |
| Casa | `/painel/mapa` | Editor drag-and-drop dos camarotes, vários ambientes, planta de fundo |
| Entrada | `/portaria` | Leitor de QR pela câmera, busca por nome, tela verde/amarela/vermelha |

Para testar: faça uma reserva em `/`, confirme em `/painel` e veja o QR aparecer em **Minhas reservas**. Em **Configurações → Restaurar demonstração** tudo volta ao estado inicial.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui (Base UI) · Motion · Recharts · qrcode.react · @yudiel/react-qr-scanner · Zustand

## Próximos passos

1. Backend (Supabase): reservas com garantia de um camarote por noite, login da equipe, RLS
2. Confirmação automática por WhatsApp e e-mail
3. QR Code assinado no servidor e check-in offline com sincronização
4. Logo e fotos oficiais do INN
