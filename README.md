# INN Lounge Bar · Reserva de camarotes

App web de reserva de camarotes para o **INN Lounge Bar** (R. Gen. Osório, 951 · Hamburgo Velho, Novo Hamburgo/RS). Desenvolvido pela Flypi Enterprise.

O cliente escolhe a noite, vê o **mapa do salão e da cobertura** com os camarotes livres em tempo real, manda os dados e a lista da turma. A equipe do INN confirma pelo painel e o cliente recebe o **QR Code** de entrada. Não há valores nem pagamento no fluxo.

> **Fase atual: só front-end.** Não há banco nem backend ainda. Os dados são de demonstração (line-ups e nomes de clientes fictícios) e ficam no `localStorage` do navegador. Cada ação de `src/lib/store.ts` corresponde a uma rota/RPC do backend futuro.

## Duas marcas, um código

O mesmo app serve duas marcas no mesmo local (INN Lounge Bar, R. Gen. Osório, 951):

| Marca | Comando | Endereço local |
|---|---|---|
| **INN Lounge Bar** (padrão) | `npm run dev` | http://localhost:3000 |
| **MOVVE** (festa que acontece no INN) | `npm run dev:movve` | http://localhost:3001 |

A marca é escolhida pela variável `NEXT_PUBLIC_BRAND` (`inn` ou `movve`). Mapa, camarotes, reservas, painel, portaria e logins são os mesmos; mudam nome, logo, cores, textos, contatos e noites. Cada marca guarda os próprios dados no navegador e compila na própria pasta, então as duas rodam ao mesmo tempo.

- Configuração de cada marca: `src/brand/inn.ts` e `src/brand/movve.ts`
- Cores da MOVVE: bloco `[data-brand="movve"]` em `src/app/globals.css`
- Logos e ícones: `src/components/brand.tsx` e `public/brand/`
- Para publicar, crie um projeto na Vercel por marca, com `NEXT_PUBLIC_BRAND` definida (`build:movve` faz o build da MOVVE)

Na MOVVE, a data da **MOVVE Blackout (09/10, 3 anos)** vem do Instagram oficial; as outras edições, os line-ups e o WhatsApp (por enquanto o do INN) são de demonstração e precisam ser confirmados com eles.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000 (ou `npm run dev:movve` para a MOVVE em http://localhost:3001).

## Telas

| Quem usa | Rota | O que tem |
|---|---|---|
| Cliente | `/` | Página do INN: próximas noites, mapa ao vivo, como funciona, os camarotes, localização, regras e FAQ |
| Cliente | `/noite/[slug]` | Mapa interativo (salão + cobertura, zoom com pinça), camarote separado por 10 min, dados, ocasião especial, lista de convidados |
| Cliente | `/reserva/[id]` | Status da solicitação → QR Code quando confirmada, lista do camarote, cancelamento |
| Convidado | `/convite/[código]` | Link que o titular manda no grupo para cada um entrar na lista |
| Cliente | `/entrar` | Login sem senha: código de 6 dígitos pelo WhatsApp ou e-mail |
| Cliente | `/minhas-reservas` | Próximas e anteriores (da conta logada) |
| Casa | `/equipe/entrar` | Login da equipe (e-mail e senha) |
| Casa | `/painel` | Solicitações para confirmar/recusar, ocupação das noites, pessoas esperadas |
| Casa | `/painel/reservas` | Todas as reservas, filtros, lista de convidados, reserva por telefone, exportar lista |
| Casa | `/painel/eventos` | Criar noites, programação, bloquear camarotes |
| Casa | `/painel/mapa` | Editor drag-and-drop dos camarotes, vários ambientes, planta de fundo |
| Entrada | `/portaria` | Leitor de QR pela câmera, busca por nome, tela verde/amarela/vermelha |

Para testar: faça uma reserva em `/`, confirme em `/painel` e veja o QR aparecer em **Minhas reservas**. Em **Configurações → Restaurar demonstração** tudo volta ao estado inicial.

## Logins

**Clientes** entram sem senha: informam o WhatsApp ou o e-mail e digitam o código de 6 dígitos. Na primeira vez, informam o nome. É preciso estar logado para separar um camarote; "Minhas reservas" e o QR Code ficam na conta. Na demonstração, o código aparece numa notificação na tela, simulando a mensagem.

**Equipe do INN** entra em `/equipe/entrar` (link "Acesso da equipe" no rodapé) com e-mail e senha. Perfis:

| Perfil | Pode abrir |
|---|---|
| Dono | Tudo: dashboard, reservas, noites, mapa, configurações, equipe e portaria |
| Gerente | Dashboard, reservas, noites e portaria |
| Portaria | Só o leitor de QR Code |

O dono cadastra, troca o perfil, desativa ou remove acessos em **Configurações → Equipe e acessos**. Após 5 senhas erradas, o login trava por 1 minuto.

### Acessos de demonstração

| Perfil | E-mail | Senha |
|---|---|---|
| Dono | dono@inn.demo | InnDono#2026 |
| Gerente | gerente@inn.demo | InnGerente#2026 |
| Portaria | portaria@inn.demo | InnPortaria#2026 |

Na versão MOVVE, os e-mails terminam em `@movve.demo` e as senhas são `MovveDono#2026`, `MovveGerente#2026` e `MovvePortaria#2026`.

A tela de login também tem botões "Entrar como". Para tirá-los, deixe `demoLogins` vazio na configuração da marca (`src/brand/`).

> **Atenção:** sem backend, contas e sessões ficam no navegador. Isso organiza a demonstração, mas **não protege de verdade** o painel. Antes de colocar no ar, o login precisa ir para o servidor (Supabase Auth com OTP para clientes, e-mail e senha para a equipe, proxy do Next e RLS no banco).

## Fotos reais

Use só fotos oficiais, com autorização do INN.

- **Imagem e fotos de cada noite**: em **Painel → Noites → Editar**.
- **Logo oficial**: coloque o arquivo em `public/brand/` e aponte em `LOGO_SRC` (por marca) em `src/components/brand.tsx`.

Enquanto não há backend, o que é enviado pelo painel fica salvo só no navegador de quem enviou.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui (Base UI) · Motion · Recharts · qrcode.react · @yudiel/react-qr-scanner · Zustand

## Próximos passos

1. Backend (Supabase): login de verdade (Auth), reservas com garantia de um camarote por noite, RLS
2. Confirmação automática por WhatsApp e e-mail
3. QR Code assinado no servidor e check-in offline com sincronização
4. Logo e fotos oficiais do INN
