# ♠️ Poker Pro Analytics

O **Poker Pro Analytics** é um Software as a Service (SaaS) focado na evolução técnica e gestão financeira de jogadores de Texas Hold'em. Desenvolvido para atuar como uma central de estudos de GTO (Game Theory Optimal) e acompanhamento de Bankroll.

## ✨ Funcionalidades

- **🔐 Autenticação Segura**: Sistema de Login/Cadastro com banco de dados em nuvem (Supabase).
- **💰 Gestão de Bankroll**: 
  - Cálculo automático de ROI e Winrate (Lucro/Hora).
  - Gráficos de evolução financeira gerados dinamicamente com Chart.js.
  - Exportação de histórico de sessões em formato `.csv` (Excel).
  - Filtros de resultados (Sessões Online vs Ao Vivo).
  - Sincronização entre abas e persistência offline.
- **🎯 Visualizador GTO (9-Max)**: 
  - Renderização geométrica de uma mesa completa (9 posições) com seleção interativa.
  - Matriz 13x13 (Heatmap) com frequências mistas (Gradientes indicando % de Raise/Call/Fold).
  - Ranges baseadas em estratégia GTO.
- **🧠 Modo Treinador (GTO Quiz)**: 
  - Motor de simulação que sorteia cenários pós e pré-flop.
  - Valida a tomada de decisão do usuário com base nas tabelas GTO.
  - Sistema de gamificação com salvamento de *High Score* em LocalStorage.
  - Feedback imediato sobre decisões.

## 💻 Tecnologias Utilizadas

- **Front-end**: HTML5, CSS3, JavaScript (ES6+ Vanilla).
- **Design System**: Dark Mode nativo, CSS Grid/Flexbox, UI em 3 colunas, Glassmorphism.
- **Back-end (BaaS)**: Supabase (Autenticação PostgreSQL).
- **Visualização de Dados**: Chart.js.
- **Persistência**: localStorage + IndexedDB (fallback).

## 🚀 Como Começar

### 1️⃣ Pré-requisitos
- Navegador moderno (Chrome, Firefox, Safari)
- Conta Supabase (gratuita em https://supabase.com)
- Git (opcional)

### 2️⃣ Instalação Local

```bash
# Clone o repositório
git clone https://github.com/eumatheussantiago/Poker-PRO.git
cd Poker-PRO

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais Supabase
```

### 3️⃣ Configurar Supabase

1. Crie um novo projeto em https://supabase.com
2. Copie **Project URL** e **Anon Key** para `.env.local`
3. Crie a tabela `sessoes` via SQL Editor:

```sql
CREATE TABLE sessoes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local TEXT NOT NULL,
  buy_in NUMERIC NOT NULL,
  cash_out NUMERIC NOT NULL,
  lucro NUMERIC NOT NULL,
  horas NUMERIC NOT NULL,
  data_sessao TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;

-- Política: Usuários veem apenas suas sessões
CREATE POLICY user_sessions ON sessoes
  FOR ALL USING (auth.uid() = user_id);
```

### 4️⃣ Executar Localmente

```bash
# Opção 1: Abrir diretamente no navegador
open index.html
# ou
firefox index.html

# Opção 2: Usar servidor local (Python)
python3 -m http.server 8000
# Abrir http://localhost:8000

# Opção 3: Usar Node.js
npx http-server
```

## 📖 Guia de Uso

### 🔑 Autenticação
1. Na tela inicial, clique em **"Cadastre-se"** para criar conta
2. Confirme seu e-mail via link enviado
3. Faça login com suas credenciais
4. Pronto! Você está no Dashboard

### 📊 Bankroll Manager
1. No módulo **"📊 Bankroll"**, preencha:
   - Local da sessão (Online ou Ao Vivo)
   - Buy-in (R$)
   - Cash-out (R$)
   - Horas jogadas
2. Clique em **"Salvar Sessão"**
3. Veja os stats em tempo real:
   - Lucro Total
   - ROI (Return on Investment)
   - Winrate (R$/hora)
   - Total de Sessões

**💡 Dica**: Use o filtro para analisar Online vs Ao Vivo separadamente.

### 🎯 Estudo GTO
1. Acesse o módulo **"🎯 Estudo GTO"**
2. Selecione uma posição na mesa (clicando no círculo)
3. Escolha a ação:
   - **RFI**: Raise First In (mesa folda)
   - **vs_Raise**: Contra um raise do oponente
4. A matriz 13x13 mostra a frequência:
   - 🔴 Vermelho = Raise
   - 🟢 Verde = Call
   - 🔵 Azul = Fold

### 🧠 Treinador
1. Acesse o módulo **"🧠 Treinador"**
2. Veja o cenário: posição, ação e mão sorteada
3. Escolha sua ação: **Raise**, **Call** ou **Fold**
4. Receba feedback imediato
5. Continue para a próxima pergunta
6. Seu high score é salvo automaticamente

## 🔒 Segurança

- ✅ Validação rigorosa de entrada
- ✅ Sanitização de texto (XSS prevention)
- ✅ Autenticação via Supabase
- ✅ Row Level Security (RLS) no banco de dados
- ⚠️ **TODO**: Mover credenciais para variáveis de ambiente

## 🛠️ Estrutura do Projeto

```
Poker-PRO/
├── index.html           # Estrutura principal
├── style.css           # Estilos (Dark Mode)
├── app.js              # Lógica da aplicação
├── README.md           # Este arquivo
├── API.md              # Documentação de API
├── IMPROVEMENTS.md     # Relatório de melhorias
├── .env.example        # Exemplo de configuração
├── .gitignore          # Arquivos ignorados no git
└── assets/             # (Futuro) Imagens, ícones
```

## 📈 Roadmap (Futuro)

- [ ] Relatórios avançados (gráficos customizáveis)
- [ ] Histórico de mãos (hand tracking)
- [ ] Integração com PokerStars/888Poker
- [ ] Mobile app (React Native)
- [ ] Comunidade (compartilhamento de ranges)
- [ ] IA para análise de sessões
- [ ] Suporte para variantes (PLO, Mixed Games)

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Add: NovaFuncionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença **MIT**. Veja [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- 📧 Email: suporte@pokerpro.com
- 🐦 Twitter: @PokerProApp
- 💬 Discord: [Community Server](https://discord.gg/pokerpro)

## 🙏 Agradecimentos

- [Supabase](https://supabase.com) - Backend as a Service
- [Chart.js](https://www.chartjs.org/) - Gráficos
- [Google Fonts](https://fonts.google.com/) - Tipografia
- Comunidade Poker Brasil 🇧🇷

---

**Versão**: 4.2  
**Última Atualização**: 18 de Agosto de 2026  
**Status**: ✅ Ativo e em Desenvolvimento

**♠️ Suba de nível em seu jogo!**