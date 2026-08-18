# 🎯 Poker PRO - Roadmap Estratégico

> Transformação de MVP funcional em SaaS comercializável completo

**Versão Atual:** v4.1 (MVP - Deploy e Validação)  
**Status:** 🟢 Em Produção  
**Última Atualização:** 2026-08-18

---

## 📋 Índice de Fases

1. [🚀 Fase 1: Deploy e Validação](#fase-1-deploy-e-validação)
2. [🗄️ Fase 2: Arquitetura de Banco de Dados Avançada](#fase-2-arquitetura-de-banco-de-dados-avançada)
3. [🐍 Fase 3: Engenharia de Dados (Parser)](#fase-3-engenharia-de-dados-parser)
4. [🧠 Fase 4: Algoritmo Analítico (Leak Finder)](#fase-4-algoritmo-analítico-leak-finder)
5. [💰 Fase 5: Estrutura Comercial (SaaS)](#fase-5-estrutura-comercial-saas)

---

## 🚀 Fase 1: Deploy e Validação

**Objetivo:** Colocar o código atual na internet para uso real e validar com usuários iniciais.

**Status:** ⏳ EM PROGRESSO (60%)

### ✅ Completadas

- [x] **Controle de Versão:** Código commitado e disponível no GitHub
- [x] **Hospedagem Front-end:** Conectado ao Vercel com deploy automático
- [x] **Testes de Funcionalidade:** Autenticação, Bankroll e Quiz validados
- [x] **Correções de Bugs:** 8+ bugs críticos corrigidos (Auth, graphs, data loss)

### ⏳ Em Progresso

- [ ] **Testes de Qualidade (QA):**
  - [ ] Responsividade em celulares (iPhone, Android)
  - [ ] Mesa interativa 9-Max em dispositivos móveis
  - [ ] Gráficos Chart.js em telas pequenas
  - [ ] Testes em navegadores (Chrome, Safari, Firefox)

- [ ] **Soft Launch:**
  - [ ] Selecionar 10-20 usuários iniciais
  - [ ] Coletar feedback via formulário
  - [ ] Documentar bugs e sugestões
  - [ ] Implementar top 5 sugestões

### 📊 Métricas de Sucesso

- ✅ Deploy automático funcionando
- ⏳ 95%+ disponibilidade (uptime)
- ⏳ Tempo de carregamento < 2s
- ⏳ 5+ usuários testadores ativos

---

## 🗄️ Fase 2: Arquitetura de Banco de Dados Avançada

**Objetivo:** Migrar a inteligência GTO do Front-end para o banco de dados em nuvem.

**Status:** 📌 PLANEJADO

### 📐 Arquitetura Proposta

```
┌─────────────────────────────────────────┐
│         FRONTEND (Next.js)              │
│  Mesa 9-Max + Formulários + Dashboards  │
└────────────────┬────────────────────────┘
                 │ API REST
                 ↓
┌─────────────────────────────────────────┐
│      BACKEND (Supabase Functions)       │
│  Lógica de negócio + Validações         │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│   DATABASE (PostgreSQL via Supabase)    │
│  Tables: Scenarios, Actions, Frequencies│
│  GTO Ranges armazenados em JSON         │
└─────────────────────────────────────────┘
```

### 🗂️ Esquema de Tabelas

```sql
-- Tabela: gto_scenarios
CREATE TABLE gto_scenarios (
    id SERIAL PRIMARY KEY,
    position VARCHAR(3),      -- BTN, SB, BB, UTG, etc
    action_type VARCHAR(20),  -- RFI (Raise First In), vs_Raise
    hole_cards VARCHAR(4),    -- AA, AKs, QJo, etc
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: gto_decisions
CREATE TABLE gto_decisions (
    id SERIAL PRIMARY KEY,
    scenario_id INT REFERENCES gto_scenarios(id),
    decision VARCHAR(10),     -- raise, call, fold
    frequency INT,            -- percentage (0-100)
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: user_hands
CREATE TABLE user_hands (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    position VARCHAR(3),
    hole_cards VARCHAR(4),
    action_taken VARCHAR(10),
    result VARCHAR(10),       -- win, loss, split
    amount_won DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 📝 Tarefas

- [ ] **Modelagem ER:** Criar diagrama entidade-relacionamento
- [ ] **Criação de Tabelas:** SQL no console do Supabase
- [ ] **Migração de Dados:** Script para popular `arvoreGTO` no banco
- [ ] **RLS (Row Level Security):** Configurar permissões por usuário
- [ ] **API Endpoints:** Criar 4-5 funções Edge no Supabase
  - [ ] `GET /api/gto-range?position=BTN&action=RFI`
  - [ ] `POST /api/user-hands` (inserir mão jogada)
  - [ ] `GET /api/leaks` (primeiros leaks detectados)

---

## 🐍 Fase 3: Engenharia de Dados (Parser)

**Objetivo:** Extrair dados de históricos de poker e convertê-los em formato estruturado.

**Status:** 📌 PLANEJADO

### 🔄 Fluxo de Processamento

```
PokerStars/GG Histórico (.txt)
        ↓
   [Python Script]
        ↓
  Regex Extraction
        ↓
  JSON Structured
        ↓
   Supabase API
        ↓
  Database (user_hands)
```

### 📦 Tech Stack Proposto

| Componente | Tecnologia | Razão |
|-----------|-----------|-------|
| **Linguagem** | Python 3.9+ | Processamento de texto robusto |
| **Parsing** | `regex` + `pandas` | Extração e transformação de dados |
| **Hospedagem** | Supabase Edge Functions | Serverless, paga por uso |
| **Integração** | REST API | Comunicação com Frontend |

### 🎯 Requisitos de Parsing

Extrair de um histórico de poker:
- ✅ Posição do jogador (BTN, SB, BB, etc)
- ✅ Hole cards (suas cartas)
- ✅ Ação realizada (Raise, Call, Fold)
- ✅ Valor da ação (em chips/dinheiro)
- ✅ Stack size antes e depois
- ✅ Resultado final (ganho/perda)

### 📝 Exemplo de Input/Output

**Input (PokerStars Hand History):**
```
PokerStars Hand #12345678: Tournament #123456 - Level I (10/20)
Button is seat #1
Seat 1: Hero (1500 in chips)
Seat 2: Villain (1500 in chips)
...
Hero has [Ac Kd]
Hero raises 40 to 60
...
```

**Output (JSON):**
```json
{
  "hand_id": "12345678",
  "timestamp": "2026-08-18T14:30:00Z",
  "position": "BTN",
  "hole_cards": "AcKd",
  "action": "raise",
  "amount": 60,
  "stack_before": 1500,
  "stack_after": 1440,
  "result": "win",
  "amount_won": 120
}
```

### 📝 Tarefas

- [ ] **Setup Python:** 
  - [ ] Poetry ou venv para dependências
  - [ ] requirements.txt com: `regex`, `pandas`, `python-dotenv`
  
- [ ] **Regex Patterns:**
  - [ ] Pattern para posições
  - [ ] Pattern para hole cards
  - [ ] Pattern para ações
  - [ ] Pattern para resultados
  
- [ ] **Validação:**
  - [ ] Unit tests para cada padrão regex
  - [ ] Testes com históricos reais PokerStars/GG
  
- [ ] **Edge Function:**
  - [ ] Deploy no Supabase Edge Functions
  - [ ] Endpoint: `POST /api/parse-history`
  
- [ ] **Frontend Integration:**
  - [ ] Upload de arquivo no dashboard
  - [ ] Feedback em tempo real do parsing
  - [ ] Armazenar mãos no banco

---

## 🧠 Fase 4: Algoritmo Analítico (Leak Finder)

**Objetivo:** Identificar erros de decisão (leaks) do jogador comparando com GTO.

**Status:** 📌 PLANEJADO

### 💡 Conceito Chave: EV Loss

**EV = Expected Value (Valor Esperado)**

```
EV Loss = (Ação Real - Ação Ótima) × Lucro Esperado

Exemplo:
- Hero tem QJo no BTN
- GTO diz: fold 100%
- Hero jogou: raise
- EV Loss = ~2BB (blinds grandes)
```

### 📊 Tipos de Leaks Detectáveis

| Leak | Exemplo | Impacto |
|------|---------|--------|
| **Over-Opening** | Abrir muitas mãos fracas | Alto |
| **Under-3betting** | Não re-raisar o suficiente | Alto |
| **Wrong Sizes** | Tamanhos de bet incorretos | Médio |
| **Position Confusion** | Errar posição da mesa | Alto |
| **Continuation Bet** | C-bet de forma ilógica | Médio |

### 🔢 Fórmula do Cálculo

```javascript
function calcularEVLoss(maoJogada, gtoOtima) {
  const decisaoReal = maoJogada.action;      // "raise", "call", "fold"
  const frequenciaOtima = gtoOtima[decisaoReal]; // 0-100%
  
  // Se jogou corretamente (frequencia >= 50%), sem leak
  if (frequenciaOtima >= 50) return 0;
  
  // Se jogou errado, quantificar o erro
  const evPerMao = (maoJogada.stackBefore / 100); // Simplificado
  const evLoss = evPerMao * (100 - frequenciaOtima) / 100;
  
  return evLoss;
}
```

### 📊 Dashboard de Relatórios

**Nova Aba: "Leaks Report"**

```
┌─────────────────────────────────────────┐
│         MEUS MAIORES LEAKS              │
├─────────────────────────────────────────┤
│ 1. Over-opening UTG: -$12.50/mão        │
│    (Jogou raise em 8% das mãos fracas)  │
├─────────────────────────────────────────┤
│ 2. Wrong 3bet Size BB: -$5.20/mão       │
│    (Betou 3.5x em vez de 2.5x)          │
├─────────────────────────────────────────┤
│ 3. Under-folding CO: -$3.15/mão         │
│    (Foldeou apenas 20% das piores mãos) │
└─────────────────────────────────────────┘

Impacto Total: -$20.85 por 100 mãos
```

### 📝 Tarefas

- [ ] **Backend Logic:**
  - [ ] Função `compareWithGTO(maoJogada, gtoOtima)`
  - [ ] Função `calcularEVLoss()`
  - [ ] Função `categorizarLeak()`
  
- [ ] **Frontend Dashboard:**
  - [ ] Nova aba "Leaks"
  - [ ] Cards com top 10 leaks
  - [ ] Gráfico de tendências
  - [ ] Filtro por posição/ação
  
- [ ] **Cálculos Estatísticos:**
  - [ ] EV Loss total (soma de todos os erros)
  - [ ] EV Loss por posição
  - [ ] EV Loss por tipo de mão
  
- [ ] **Exportação:**
  - [ ] Relatório PDF com leaks
  - [ ] CSV para análise externa

---

## 💰 Fase 5: Estrutura Comercial (SaaS)

**Objetivo:** Transformar a ferramenta em um negócio viável com monetização.

**Status:** 📌 PLANEJADO

### 🌐 Landing Page

**Estrutura:**
```
[Header]
  Logo | Pricing | Docs | Login

[Hero Section]
  "Encontre Seus Leaks no Poker"
  "Análise GTO-powered em tempo real"
  [CTA: Comece Grátis]

[Features]
  ✨ Bankroll Tracker
  ✨ GTO Ranges
  ✨ Leak Finder
  ✨ Hand Analyzer

[Pricing Table]
  Gratuito | Pro | Premium

[FAQ]
[Social Proof]
[Footer]
```

### 💳 Planos de Monetização

| Plano | Preço | Funcionalidades | Objetivo |
|-------|-------|-----------------|----------|
| **Free** | $0/mês | Bankroll, Quiz, Mesa 9-Max | Adquisição de usuários |
| **Pro** | $9.99/mês | + Leak Finder, Report PDF | Conversão de power users |
| **Premium** | $29.99/mês | + API acesso, Custom Reports, Suporte | Enterprise/Coaching |

### 📱 PWA (Progressive Web App)

**Objetivo:** Instalar como app nativo no celular.

**Arquivo: `manifest.json`**
```json
{
  "name": "Poker PRO Analytics",
  "short_name": "Poker PRO",
  "description": "Análise GTO e Leak Detection",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#3b82f6",
  "background_color": "#0f1115",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshot-1.png",
      "sizes": "540x720",
      "form_factor": "narrow"
    }
  ]
}
```

### 🔐 Estrutura de Autenticação Avançada

```javascript
// Após login, verificar:
const plano = await supabase
  .from('user_subscriptions')
  .select('plan')
  .eq('user_id', AppState.usuario.id)
  .single();

// Controlar acesso a features
if (plano.data.plan === 'free') {
  document.getElementById('leak-finder').classList.add('disabled');
  document.getElementById('leak-finder').innerHTML += 
    '<div class="upgrade-banner">Upgrade para Pro →</div>';
}
```

### 📝 Tarefas

**Landing Page:**
- [ ] Design em Figma (desktop + mobile)
- [ ] Implementar em React (Next.js)
- [ ] SEO optimization (meta tags, schema.org)
- [ ] Testes de conversão (A/B testing)

**Pagamentos:**
- [ ] Integrar Stripe API
- [ ] Webhooks para mudanças de plano
- [ ] Automatizar upgrade/downgrade
- [ ] Invoices automáticas

**PWA:**
- [ ] Criar manifesto JSON
- [ ] Gerar ícones responsivos
- [ ] Service Worker para offline
- [ ] Testar em iOS/Android

**Análise:**
- [ ] Google Analytics
- [ ] Tracking de funil de conversão
- [ ] Dashboard de métricas SaaS (MRR, churn, LTV)

---

## 📊 Timeline Estimado

| Fase | Duração | Data Estimada |
|------|---------|---------------|
| **Fase 1** | 2-3 semanas | ✅ Ago 2026 |
| **Fase 2** | 3-4 semanas | Set 2026 |
| **Fase 3** | 4-5 semanas | Out 2026 |
| **Fase 4** | 3-4 semanas | Nov 2026 |
| **Fase 5** | 4-6 semanas | Dez 2026 |
| **Total** | ~4-5 meses | **🎯 Jan 2027** |

---

## 📚 Stack Técnico Completo

```yaml
Frontend:
  - React 18+ / Next.js 13+
  - TypeScript
  - Tailwind CSS
  - Chart.js
  - React Query

Backend:
  - Supabase (PostgreSQL + Auth)
  - Edge Functions (TypeScript)
  - Python (Parser)

DevOps:
  - Vercel (Frontend)
  - Docker (Parser)
  - GitHub Actions (CI/CD)

Pagamentos:
  - Stripe / Mercado Pago

Analytics:
  - Google Analytics 4
  - Mixpanel / Amplitude

Monitoring:
  - Sentry (Error tracking)
  - New Relic (Performance)
```

---

## 🎯 Métricas de Sucesso Finais

### Fase 1 (Deploy)
- ✅ 95%+ uptime
- ✅ < 2s load time
- ✅ 5+ beta testers satisfeitos

### Fase 2 (DB)
- ✅ API response < 200ms
- ✅ 10,000+ mãos armazenadas
- ✅ 100% dados integridade

### Fase 3 (Parser)
- ✅ 95%+ parsing accuracy
- ✅ < 5s processing time
- ✅ Suporte para 3+ sites

### Fase 4 (Leak Finder)
- ✅ EV Loss cálculos validados
- ✅ Relatórios entendíveis
- ✅ Feedback positivo de jogadores

### Fase 5 (SaaS)
- ✅ 100+ paid subscribers
- ✅ MRR > $1,000
- ✅ Churn rate < 5%/mês

---

## 📖 Documentação Relacionada

- [API.md](./API.md) - Especificação técnica
- [IMPROVEMENTS.md](./IMPROVEMENTS.md) - Melhorias implementadas
- [REVIEW_SUMMARY.md](./REVIEW_SUMMARY.md) - Resumo da revisão

---

## 💬 Contribuições

Feedback é bem-vindo! Abra uma issue no GitHub ou entre em contato.

**Criado com 💜 para a comunidade de poker e desenvolvimento de software.**

---

*Última atualização: 2026-08-18*  
*Versão: 1.0*
