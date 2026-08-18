# 📚 Documentação de API - Poker Pro Analytics

## Funções Principais

### Autenticação

#### `fazerLogin()`
Realiza login do usuário com email e senha.
- **Validações**: Email válido, senha não vazia
- **Salva**: Usuário em `AppState.usuario`
- **Redireciona**: Para `entrarNoApp()` se sucesso

```javascript
// Chamado via: <button onclick="fazerLogin()">
// Campos necessários:
// - #login-email (input email)
// - #login-senha (input password)
```

#### `fazerCadastro()`
Cria nova conta de usuário.
- **Validações**: Email, senha (6-128 chars), nome (máx 100 chars)
- **Mensagens**: Feedback sobre duplicação de email
- **Redireciona**: Para aba login após sucesso

```javascript
// Chamado via: <button onclick="fazerCadastro()">
// Campos necessários:
// - #signup-nome (input text)
// - #signup-email (input email)
// - #signup-senha (input password)
```

#### `fazerLogout()`
Encerra sessão do usuário.
- **Limpa**: `AppState.usuario` e sessão Supabase
- **Redireciona**: Para tela de login

---

### Gerenciamento de Sessões (Bankroll)

#### `registrarSessao()`
Registra uma nova sessão de poker.
- **Validações**: Buy-in, Cash-out (0-999999), Horas (0.5-24)
- **Calcula**: Lucro automaticamente
- **Persiste**: Supabase + localStorage
- **Atualiza**: Gráfico e tabela de histórico

```javascript
// Chamado via: <button onclick="registrarSessao()">
// Campos necessários:
// - #tipo-local (select: "Online" ou "Ao Vivo")
// - #buy-in (input number)
// - #cash-out (input number)
// - #horas-jogadas (input number, step=0.5)
```

#### `carregarSessoesNuvem()`
Carrega sessões do Supabase (com fallback localStorage).
- **Sincronização**: Nuvem → App
- **Fallback**: Se Supabase falhar, usa localStorage
- **Atualiza**: Dashboard após carregar

```javascript
// Chamado automaticamente em: entrarNoApp()
// Sem parâmetros necessários
```

#### `calcularEAtualizarTela(filtro)`
Calcula estatísticas e atualiza UI.
- **Parâmetro**: `filtro` = "Todos", "Online", ou "Ao Vivo"
- **Calcula**: Lucro total, ROI, Winrate, Sessões
- **Atualiza**: Gráfico, tabela e stat boxes

```javascript
calcularEAtualizarTela('Todos');     // Todas as sessões
calcularEAtualizarTela('Online');    // Apenas online
calcularEAtualizarTela('Ao Vivo');  // Apenas ao vivo
```

#### `exportarCSV()`
Exporta histórico de sessões em CSV.
- **Formato**: Data, Local, Horas, Buy-in, Cash-out, Lucro
- **Download**: Automático com nome `historico_poker_pro.csv`

```javascript
// Chamado via: <button onclick="exportarCSV()">
// Sem parâmetros
```

---

### Visualização GTO

#### `renderizarMesa(containerId, isVisualizador, heroPos, villainPos)`
Renderiza mesa de 9 posições (BTN, SB, BB, UTG, etc).
- **Parâmetros**:
  - `containerId`: ID do div para renderizar
  - `isVisualizador`: Se true, clique muda posição
  - `heroPos`: Posição do hero (ex: "BTN")
  - `villainPos`: Posição do vilão (ex: "UTG")

```javascript
renderizarMesa('mesa-visualizador', true);        // Selecionável
renderizarMesa('mesa-treinador', false, 'BTN', 'UTG');  // Não selecionável
```

#### `gerarMatrizPoker()`
Gera matriz 13x13 de mãos de poker.
- **Formato**: AA, AKs, AQs, AJs, ATs, A9s, A8s, A7s, A6s, A5s, A4s, A3s, A2s (linhas)
- **Cores**: Fade vermelho (raise), verde (call), azul escuro (fold)
- **Container**: `#matriz-grid`

```javascript
gerarMatrizPoker();  // Sem parâmetros
// Preconiza: aplicarRangeAvancadoUI()
```

#### `aplicarRangeAvancadoUI()`
Aplica cores à matriz baseado em range GTO.
- **Fonte**: `arvoreGTO[posicao][acao]`
- **Ações**: "RFI" (raise first in) ou "vs_Raise"
- **Cores**: Gradientes para % play (raise/call/fold)

```javascript
// Chamada automática em:
// - gerarMatrizPoker()
// - Quando muda posição na mesa
// - Quando muda ação (select #acao-vilao)
```

---

### Treinador (Quiz GTO)

#### `inicializarQuiz()`
Inicia o modo de treino GTO.
- **Carrega**: High score do localStorage
- **Gera**: Primeira pergunta

```javascript
inicializarQuiz();  // Sem parâmetros
// Chamada automática em: entrarNoApp()
```

#### `gerarPerguntaQuiz()`
Gera um novo cenário de quiz.
- **Sorteia**: Posição, ação (RFI/vs_Raise), mão
- **Renderiza**: Mesa com hero/vilão destacados
- **Exibe**: Contexto (folded ou após raise)

```javascript
gerarPerguntaQuiz();  // Sem parâmetros
```

#### `responderQuiz(acao)`
Valida resposta do usuário (raise/call/fold).
- **Parâmetro**: `acao` = "raise", "call", ou "fold"
- **Compara**: Com GTO ideal
- **Atualiza**: Score, high score, feedback
- **Permite**: Próxima pergunta após resposta

```javascript
// Chamado via: <button onclick="responderQuiz('raise')">
responderQuiz('raise');
responderQuiz('call');
responderQuiz('fold');
```

---

### Utilitários

#### `showToast(message, type)`
Exibe notificação temporária.
- **Parâmetros**:
  - `message`: Texto a exibir (string, sanitizado)
  - `type`: "success", "error", "info" (default: "success")
- **Duração**: 3 segundos

```javascript
showToast('Sucesso!', 'success');
showToast('Erro na operação', 'error');
showToast('Informação', 'info');
```

#### `validarEmail(email)`
Valida formato de email.
- **Retorna**: `true` se válido, `false` caso contrário
- **Limite**: Máximo 254 caracteres

```javascript
if (!validarEmail('test@example.com')) {
    showToast('Email inválido', 'error');
}
```

#### `validarSenha(senha)`
Valida comprimento de senha.
- **Retorna**: `true` se entre 6-128 caracteres
- **Retorna**: `false` caso contrário

```javascript
if (!validarSenha(senha)) {
    showToast('Senha deve ter 6-128 caracteres', 'error');
}
```

#### `validarNumero(valor, min, max)`
Valida se valor está em range.
- **Parâmetros**: `min` (default 0), `max` (default Infinity)
- **Retorna**: `true` se número válido no range

```javascript
if (!validarNumero(valor, 0, 100)) {
    showToast('Valor deve estar entre 0-100', 'error');
}
```

#### `setLoadingState(buttonId, isLoading)`
Ativa/desativa estado de loading em botão.
- **Parâmetro**: `isLoading` = true/false
- **Efeito**: Desabilita botão, exibe spinner

```javascript
setLoadingState('btn-login', true);  // Ativa loading
// ... requisição assíncrona ...
setLoadingState('btn-login', false); // Desativa loading
```

#### `salvarSessoesLocalmente()`
Persiste sessões em localStorage.
- **Chave**: `pokerPro_sessoes`
- **Formato**: JSON stringificado

```javascript
salvarSessoesLocalmente();  // Sem parâmetros
```

#### `carregarSessoesLocais()`
Carrega sessões do localStorage.
- **Retorna**: `true` se sucesso, `false` se falho

```javascript
if (carregarSessoesLocais()) {
    calcularEAtualizarTela('Todos');
}
```

---

## 📊 Estrutura de Dados

### AppState
```javascript
{
    usuario: null,              // Objeto usuário Supabase
    sessoes: [],                // Array de sessões
    graficoInstancia: null,     // Instância Chart.js
    posicaoVisualizador: 'BTN', // Posição selecionada
    quiz: {
        score: 0,               // Score atual
        highScore: 0,           // Melhor score
        cenarioAtual: null      // Cenário em andamento
    },
    rngInterval: null           // ID do interval RNG
}
```

### Sessão (Bankroll)
```javascript
{
    user_id: "uuid",
    local: "Online" | "Ao Vivo",
    buy_in: number,
    cash_out: number,
    lucro: number,              // cash_out - buy_in
    horas: number,
    data_sessao: "ISO-8601"     // Timestamp
}
```

### Mão de Poker
Notação: `[Rank][Rank][s|o]`
- Ranks: A, K, Q, J, T, 9-2
- Suited (s): AKs, QJs
- Offsuit (o): AKo, QJo
- Pares: AA, KK, QQ, etc

### Range GTO (Árvore)
```javascript
arvoreGTO[posicao][acao] = {
    'mao': 'raise'|'call'|'fold'|{raise: %, call: %, fold: %}
}
```

---

## 🔧 Configuração Necessária

### Supabase Requisitos
- [ ] Tabela `sessions` com colunas:
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `local` (text)
  - `buy_in` (numeric)
  - `cash_out` (numeric)
  - `lucro` (numeric)
  - `horas` (numeric)
  - `data_sessao` (timestamp)

- [ ] RLS Policies:
  ```sql
  -- Usuários podem ver apenas suas sessões
  CREATE POLICY user_sessions 
    ON sessions FOR ALL 
    USING (auth.uid() = user_id);
  ```

---

## 📱 Browser Compatibility
- Chrome/Edge: ✅ Completo
- Firefox: ✅ Completo
- Safari: ✅ Completo (iOS 12+)
- IE11: ❌ Não suportado (Promise, ES6)

---

**Última atualização**: 18 de Agosto de 2026  
**Versão**: V4.2
