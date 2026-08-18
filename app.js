/**
 * POKER PRO ANALYTICS - Core Engine (V4.1)
 * Architecture: Modular Frontend (Supabase Auth/DB, Bankroll, GTO, Trainer)
 */

// ==========================================
// CONFIGURAÇÃO SUPABASE
// ==========================================
const supabaseUrl = 'https://ubghaezyotvhyrszylyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZ2hhZXp5b3R2aHlyc3p5bHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwMTk2MTgsImV4cCI6MjEwMjU5NTYxOH0.0t_JMNv_AhtJsAGqwY-Fee96BCLvVQD2xnVC0fNuKMg';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// ESTADO GLOBAL
// ==========================================
const AppState = {
    usuario: null,
    sessoes: [],
    graficoInstancia: null,
    posicaoVisualizador: 'BTN',
    quiz: { score: 0, highScore: 0, cenarioAtual: null },
    rngInterval: null
};

const posicoes9Max = ['BTN', 'SB', 'BB', 'UTG', 'UTG1', 'UTG2', 'MP', 'HJ', 'CO'];

// Formatação de Moeda Brasileira Nativa
const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// ==========================================
// UTILITÁRIOS (Toasts e Validação)
// ==========================================
function showToast(message, type = 'success') {
    try {
        const container = document.getElementById('toast-container');
        if (!container) {
            console.warn('Toast container não encontrado. Mensagem:', message);
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        // Sanitizar para prevenir XSS
        toast.textContent = message;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    } catch (err) {
        console.error('Erro em showToast():', err);
    }
}

// Validação segura de entrada
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(String(email).toLowerCase()) && email.length <= 254;
}

function validarSenha(senha) {
    return senha.length >= 6 && senha.length <= 128;
}

function validarNumero(valor, min = 0, max = Infinity) {
    const num = parseFloat(valor);
    return !isNaN(num) && num >= min && num <= max;
}

// Gerenciamento de loading states
function setLoadingState(buttonId, isLoading) {
    const btn = document.getElementById(buttonId);
    if (!btn) {
        console.warn(`Botão com ID "${buttonId}" não encontrado`);
        return;
    }
    
    if (isLoading) {
        // Salvar texto original na primeira vez
        if (!btn.getAttribute('data-original-text')) {
            btn.setAttribute('data-original-text', btn.innerText);
        }
        btn.disabled = true;
        btn.classList.add('loading');
        btn.innerHTML = '<span class="spinner"></span> Processando...';
    } else {
        btn.disabled = false;
        btn.classList.remove('loading');
        const originalText = btn.getAttribute('data-original-text') || 'Enviar';
        btn.innerText = originalText;
        btn.removeAttribute('data-original-text');
    }
}

function gerarRNG() {
    const rngDisplay = document.getElementById('rng-value');
    if (AppState.rngInterval) clearInterval(AppState.rngInterval);
    
    let count = 0;
    rngDisplay.style.color = "var(--texto-secundario)";
    
    AppState.rngInterval = setInterval(() => {
        rngDisplay.innerText = Math.floor(Math.random() * 100) + 1;
        count++;
        if (count > 10) {
            clearInterval(AppState.rngInterval);
            rngDisplay.innerText = Math.floor(Math.random() * 100) + 1;
            rngDisplay.style.color = "var(--sucesso)";
        }
    }, 30);
}

// ==========================================
// MÓDULO 1: AUTENTICAÇÃO E NAVEGAÇÃO
// ==========================================
function mostrarAbaAuth(aba) {
    try {
        const abaValida = ['login', 'signup'].includes(aba) ? aba : 'login';
        
        // Esconder todos os formulários
        document.getElementById('form-login').classList.add('hidden');
        document.getElementById('form-signup').classList.add('hidden');
        document.getElementById('tab-login').classList.remove('active-tab');
        document.getElementById('tab-signup').classList.remove('active-tab');

        // Mostrar a aba selecionada
        document.getElementById(`form-${abaValida}`).classList.remove('hidden');
        document.getElementById(`tab-${abaValida}`).classList.add('active-tab');
    } catch (err) {
        console.error('Erro em mostrarAbaAuth():', err);
    }
}

async function fazerCadastro() {
    try {
        const nome = document.getElementById('signup-nome')?.value?.trim();
        const email = document.getElementById('signup-email')?.value?.trim();
        const senha = document.getElementById('signup-senha')?.value;

        // Validações
        if (!email || !nome || !senha) {
            showToast("Preencha todos os campos.", "error");
            return;
        }
        if (!validarEmail(email)) {
            showToast("E-mail inválido.", "error");
            return;
        }
        if (!validarSenha(senha)) {
            showToast("Senha deve ter entre 6 e 128 caracteres.", "error");
            return;
        }
        if (nome.length > 100) {
            showToast("Nome muito longo (máx 100 caracteres).", "error");
            return;
        }

        setLoadingState('btn-signup', true);

        // Criar conta
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: senha,
            options: { data: { name: nome } }
        });

        if (error) {
            const msg = error.message === 'User already registered' 
                ? 'Este e-mail já está cadastrado.' 
                : error.message || 'Erro desconhecido ao criar conta';
            console.error('Erro no cadastro (Supabase):', error);
            showToast(msg, "error");
            setLoadingState('btn-signup', false);
            return;
        }

        // Sucesso: limpar formulário
        document.getElementById('signup-nome').value = '';
        document.getElementById('signup-email').value = '';
        document.getElementById('signup-senha').value = '';
        
        showToast("Conta criada! Verifique seu e-mail para confirmar.", "success");
        setLoadingState('btn-signup', false);
        
        // Aguardar um pouco antes de trocar de aba
        setTimeout(() => mostrarAbaAuth('login'), 1500);
        
    } catch (err) {
        console.error('Erro no cadastro (Try-Catch):', err);
        showToast("Erro ao criar conta. Tente novamente.", "error");
        setLoadingState('btn-signup', false);
    }
}

async function fazerLogin() {
    try {
        const email = document.getElementById('login-email')?.value?.trim();
        const senha = document.getElementById('login-senha')?.value;

        // Validações
        if (!email || !senha) {
            showToast('Preencha e-mail e senha.', 'error');
            return;
        }
        if (!validarEmail(email)) {
            showToast("E-mail inválido.", "error");
            return;
        }

        setLoadingState('btn-login', true);

        // Fazer login
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: senha
        });

        if (error) {
            console.error('Erro no login (Supabase):', error);
            const msg = error.message || 'E-mail ou senha incorretos';
            showToast(msg, "error");
            setLoadingState('btn-login', false);
            return;
        }

        if (!data || !data.user) {
            console.error('Login realizado mas sem dados de usuário');
            showToast("Erro: Usuário não encontrado.", "error");
            setLoadingState('btn-login', false);
            return;
        }

        // Sucesso: definir usuário e limpar formulário
        AppState.usuario = data.user;
        document.getElementById('login-email').value = '';
        document.getElementById('login-senha').value = '';
        
        showToast("Login realizado com sucesso!", "success");
        setLoadingState('btn-login', false);
        
        // Aguardar um pouco antes de entrar no app
        setTimeout(() => entrarNoApp(), 500);
        
    } catch (err) {
        console.error('Erro no login (Try-Catch):', err);
        showToast("Erro ao entrar. Verifique sua conexão.", "error");
        setLoadingState('btn-login', false);
    }
}

async function fazerLogout() {
    await supabase.auth.signOut();
    AppState.usuario = null;
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
    showToast('Sessão encerrada.', 'info');
}

function entrarNoApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    
    // Boot Initialization
    gerarMatrizPoker(); 
    renderizarMesa('mesa-visualizador', true); 
    inicializarQuiz();
    gerarRNG();
    
    carregarSessoesNuvem(); // Puxa o Bankroll do DB
}

function navegarApp(modulo) {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    document.querySelectorAll('.module-section').forEach(sec => sec.classList.remove('active-module'));
    document.getElementById(`module-${modulo}`).classList.add('active-module');
}

// ==========================================
// CORREÇÃO: NORMALIZADOR DE DADOS
// (Garante que dados antigos locais e do Supabase conversem)
// ==========================================
function normalizarSessao(s) {
    return {
        buy_in: Number(s.buy_in || s.buyIn || 0),
        cash_out: Number(s.cash_out || s.cashOut || 0),
        lucro: Number(s.lucro || 0),
        horas: Number(s.horas || 1),
        local: s.local || 'Online',
        data_sessao: s.data_sessao || s.data || new Date().toISOString()
    };
}

// ==========================================
// MÓDULO 2: BANKROLL MANAGER (CLOUD + LOCAL)
// ==========================================
async function registrarSessao() {
    const buyIn = parseFloat(document.getElementById('buy-in').value) || 0;
    const cashOut = parseFloat(document.getElementById('cash-out').value) || 0;
    const horas = parseFloat(document.getElementById('horas-jogadas').value) || 1; 
    const local = document.getElementById('tipo-local').value;
    
    if (buyIn === 0 && cashOut === 0) return showToast('Preencha os valores da sessão.', 'error');

    const lucro = cashOut - buyIn;
    
    // Objeto formatado para o Supabase
    let novaSessao = { 
        user_id: AppState.usuario ? AppState.usuario.id : 'usuario_local', 
        local: local,
        buy_in: buyIn, 
        cash_out: cashOut, 
        lucro: lucro, 
        horas: horas 
    };

    if (AppState.usuario) {
        const { data, error } = await supabase.from('sessoes').insert([novaSessao]).select();
        if (error) {
            console.warn("Supabase insert falhou. Salvando via LocalStorage Fallback.");
            salvarSessaoLocalFallback(novaSessao);
        } else {
            AppState.sessoes.push(normalizarSessao(data[0]));
        }
    } else {
        salvarSessaoLocalFallback(novaSessao);
    }
    
    document.getElementById('buy-in').value = ''; 
    document.getElementById('cash-out').value = ''; 
    document.getElementById('horas-jogadas').value = '';
    
    calcularEAtualizarTela('Todos');
    showToast('Sessão registrada!', 'success');
}

function salvarSessaoLocalFallback(novaSessao) {
    novaSessao.data_sessao = new Date().toISOString();
    AppState.sessoes.push(normalizarSessao(novaSessao));
    localStorage.setItem('pokerPro_sessoes', JSON.stringify(AppState.sessoes));
}

async function carregarSessoesNuvem() {
    let dadosBanco = [];

    // Tenta buscar da nuvem primeiro
    if (AppState.usuario) {
        const { data, error } = await supabase
            .from('sessoes')
            .select('*')
            .eq('user_id', AppState.usuario.id)
            .order('data_sessao', { ascending: true }); 

        if (data && data.length > 0) dadosBanco = data;
    }

    // Se falhar ou estiver vazio, busca o Backup do LocalStorage
    if (dadosBanco.length === 0) {
        const salvas = localStorage.getItem('pokerPro_sessoes');
        if (salvas) dadosBanco = JSON.parse(salvas);
    }

    // Normaliza tudo (evita o Bug do NaN)
    AppState.sessoes = dadosBanco.map(normalizarSessao);
    calcularEAtualizarTela('Todos');
}

function calcularEAtualizarTela(filtroLocal) {
    const sFiltradas = filtroLocal === 'Todos' ? AppState.sessoes : AppState.sessoes.filter(s => s.local === filtroLocal);
    let lTotal = 0, invTotal = 0, hTotais = 0, historico = [0];

    sFiltradas.forEach(s => { 
        lTotal += Number(s.lucro); 
        invTotal += Number(s.buy_in); 
        hTotais += Number(s.horas || 1); 
        historico.push(lTotal); 
    });
    
    document.getElementById('lucro-total').innerText = formatadorMoeda.format(lTotal);
    document.getElementById('roi-total').innerText = `${invTotal > 0 ? (lTotal/invTotal*100).toFixed(2) : '0.00'}%`;
    document.getElementById('sessoes-total').innerText = sFiltradas.length;
    document.getElementById('winrate-total').innerText = `${formatadorMoeda.format(hTotais > 0 ? (lTotal/hTotais) : 0)}/h`;
    
    document.getElementById('lucro-total').className = lTotal >= 0 ? 'lucro-positivo' : 'lucro-negativo';
    document.getElementById('winrate-total').className = (lTotal/hTotais) >= 0 ? 'lucro-positivo' : 'lucro-negativo';

    desenharGrafico(historico, filtroLocal);
    renderizarHistoricoTabela(sFiltradas);
}

function desenharGrafico(historico, titulo) {
    const ctx = document.getElementById('graficoBankroll').getContext('2d');
    if (AppState.graficoInstancia) AppState.graficoInstancia.destroy(); 
    
    AppState.graficoInstancia = new Chart(ctx, {
        type: 'line', 
        data: { 
            labels: historico.map((_, i) => i === 0 ? 'Início' : `S. ${i}`), 
            datasets: [{ label: `Lucro (${titulo})`, data: historico, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', fill: true, tension: 0.3, borderWidth: 2, pointRadius: 3 }] 
        },
        options: { 
            responsive: true, maintainAspectRatio: false, color: '#94a3b8', 
            scales: { y: { grid: { color: '#333b4d' } }, x: { grid: { display: false } } },
            plugins: { legend: { display: false } }
        }
    });
}

function renderizarHistoricoTabela(sFiltradas) {
    const tbody = document.getElementById('corpo-tabela-historico');
    tbody.innerHTML = ''; 
    [...sFiltradas].reverse().forEach(s => {
        const d = s.data_sessao ? new Date(s.data_sessao) : new Date();
        const dataFormatada = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        
        tbody.innerHTML += `
            <tr>
                <td>${dataFormatada}</td>
                <td>${s.local}</td><td>${s.horas || 1}h</td>
                <td>${formatadorMoeda.format(s.buy_in)}</td>
                <td>${formatadorMoeda.format(s.cash_out)}</td>
                <td class="${s.lucro >= 0 ? 'lucro-positivo' : 'lucro-negativo'}"><strong>${formatadorMoeda.format(s.lucro)}</strong></td>
            </tr>`;
    });
}

function exportarCSV() {
    if (AppState.sessoes.length === 0) return showToast("Nenhuma sessão para exportar.", "error");
    let csvContent = "data:text/csv;charset=utf-8,Data,Local,Horas,Buy-in,Cash-out,Lucro\n";
    AppState.sessoes.forEach(s => {
        const d = s.data_sessao ? new Date(s.data_sessao) : new Date();
        const dataFormatada = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        csvContent += `${dataFormatada},${s.local},${s.horas||1},${s.buy_in},${s.cash_out},${s.lucro}\n`;
    });
    const link = document.createElement("a");
    link.href = encodeURI(csvContent); link.download = "historico_poker_pro.csv";
    document.body.appendChild(link); link.click(); link.remove();
    showToast("Download iniciado.", "success");
}

// ==========================================
// MÓDULO 3: MOTOR GTO (9-MAX)
// ==========================================
const arvoreGTO = {
    'UTG': { 'RFI': { 'AA':'raise','KK':'raise','QQ':'raise','AKs':'raise','A5s':{raise:20,fold:80},'99':'raise' }, 'vs_Raise': { 'AA':'raise','KK':'raise' } },
    'UTG1': { 'RFI': { 'AA':'raise','KK':'raise','QQ':'raise','JJ':'raise','AKs':'raise','AQs':'raise','88':'raise' }, 'vs_Raise': { 'AA':'raise','KK':'raise','QQ':'call' } },
    'UTG2': { 'RFI': { 'AA':'raise','KK':'raise','QQ':'raise','JJ':'raise','TT':'raise','AKs':'raise','AQs':'raise','77':'raise' }, 'vs_Raise': { 'AA':'raise','KK':'raise','QQ':'call' } },
    'MP':  { 'RFI': { 'AA':'raise','KK':'raise','QQ':'raise','JJ':'raise','TT':'raise','99':'raise','AKs':'raise','AJs':'raise' }, 'vs_Raise': { 'AA':'raise','KK':'raise','AKs':'raise','QQ':'call','JJ':'call' } },
    'HJ':  { 'RFI': { 'AA':'raise','KK':'raise','77':'raise','66':'raise','ATs':'raise','KQs':'raise','JTs':'raise' }, 'vs_Raise': { 'AA':'raise','KK':'raise','AKs':'raise','QQ':'call','JJ':'call','TT':'call' } },
    'CO':  { 'RFI': { 'AA':'raise','KK':'raise','55':'raise','A2s':'raise','KJs':'raise','QTs':'raise','T9s':'raise' }, 'vs_Raise': { 'AA':'raise','KK':'raise','QQ':'raise','AKs':'raise','AQo':{raise:50,call:50},'88':'call' } },
    'BTN': { 'RFI': { 'AA':'raise','22':'raise','A2o':'raise','K9o':'raise','T8s':'raise','65s':'raise' }, 'vs_Raise': { 'AA':'raise','KK':'raise','QQ':'raise','AKs':'raise','AQs':'raise','JJ':'call','TT':'call','99':'call','88':'call','77':'call','AQo':'call' } },
    'SB':  { 'RFI': { 'AA':'raise','KK':'raise','A2s':'raise','K2s':'raise','Q8o':'raise' }, 'vs_Raise': { 'AA':'raise','KK':'raise','QQ':'raise','AKs':'raise','JJ':'raise','TT':'call','AQs':'call' } },
    'BB':  { 'RFI': { 'AA':'raise' }, 'vs_Raise': { 'AA':'raise','KK':'raise','QQ':'raise','JJ':'raise','AKs':'raise','A2s':'call','K2s':'call','T9o':'call','87s':'call','72o':'fold' } }
};

function renderizarMesa(containerId, isVisualizador = false, heroPos = null, villainPos = null) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container não encontrado: ${containerId}`);
        return;
    }
    
    container.innerHTML = '<div class="poker-table-shape"></div>'; 
    
    const rx = 45, ry = 45; 
    
    posicoes9Max.forEach((pos, index) => {
        const angle = (index * (360 / 9) - 90) * (Math.PI / 180);
        const x = 50 + Math.cos(angle) * rx;
        const y = 50 + Math.sin(angle) * ry;

        const seat = document.createElement('div');
        seat.className = 'seat';
        seat.textContent = pos;
        seat.style.left = `${x}%`; 
        seat.style.top = `${y}%`;

        if (isVisualizador) {
            if (pos === AppState.posicaoVisualizador) seat.classList.add('active');
            seat.style.cursor = 'pointer';
            seat.onclick = () => {
                AppState.posicaoVisualizador = pos;
                renderizarMesa(containerId, true);
                aplicarRangeAvancadoUI(); 
            };
        } else {
            if (pos === heroPos) seat.classList.add('hero');
            if (pos === villainPos) seat.classList.add('villain');
        }
        container.appendChild(seat);
    });
}

function gerarMatrizPoker() {
    const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const grid = document.getElementById('matriz-grid');
    if (!grid) return;
    grid.innerHTML = ''; 
    for (let i = 0; i < ranks.length; i++) {
        for (let j = 0; j < ranks.length; j++) {
            let mao = i === j ? ranks[i]+ranks[j] : (i < j ? ranks[i]+ranks[j]+'s' : ranks[j]+ranks[i]+'o');
            const celula = document.createElement('div');
            celula.className = 'celula-mao acao-fold';
            celula.innerText = mao; celula.id = `mao-${mao}`;
            grid.appendChild(celula);
        }
    }
    aplicarRangeAvancadoUI(); 
}

function aplicarRangeAvancadoUI() {
    document.querySelectorAll('.celula-mao').forEach(c => { 
        c.className = 'celula-mao acao-fold'; 
        c.style.background = ''; 
        c.style.color = '';
    });
    
    const acaoSelect = document.getElementById('acao-vilao');
    if (!acaoSelect) {
        console.warn('Elemento "acao-vilao" não encontrado');
        return;
    }
    
    const acao = acaoSelect.value;
    const range = arvoreGTO[AppState.posicaoVisualizador]?.[acao];
    if (!range) {
        console.warn(`Range não encontrada para ${AppState.posicaoVisualizador}/${acao}`);
        return;
    }

    const cRaise = '#ef4444', cCall = '#10b981', cFold = '#1e3a8a';

    for (const mao in range) {
        const celula = document.getElementById(`mao-${mao}`);
        if (celula) {
            const dec = range[mao];
            if (typeof dec === 'string') { 
                celula.className = `celula-mao acao-${dec}`; 
            } else {
                celula.className = 'celula-mao';
                const pR = dec.raise || 0, pC = dec.call || 0, pF = dec.fold || 0;
                if (pR > 0 && pF > 0) celula.style.background = `linear-gradient(135deg, ${cRaise} ${pR}%, ${cFold} ${pR}%)`;
                else if (pR > 0 && pC > 0) celula.style.background = `linear-gradient(135deg, ${cRaise} ${pR}%, ${cCall} ${pR}%)`;
                else if (pC > 0 && pF > 0) celula.style.background = `linear-gradient(135deg, ${cCall} ${pC}%, ${cFold} ${pC}%)`;
                celula.style.color = "white"; 
            }
        }
    }
}

// ==========================================
// MÓDULO 4: TREINADOR (QUIZ)
// ==========================================
function inicializarQuiz() {
    const recorde = localStorage.getItem('pokerPro_quizHighScore');
    if (recorde) { 
        AppState.quiz.highScore = parseInt(recorde); 
        document.getElementById('quiz-high-score').innerText = AppState.quiz.highScore; 
    }
    gerarPerguntaQuiz();
}

function gerarPerguntaQuiz() {
    document.getElementById('quiz-feedback').classList.add('hidden');
    document.getElementById('btn-proxima').classList.add('hidden');
    document.getElementById('quiz-controles').classList.remove('hidden');

    const heroPos = posicoes9Max[Math.floor(Math.random() * posicoes9Max.length)];
    const acoes = Object.keys(arvoreGTO[heroPos]);
    
    if (acoes.length === 0) return gerarPerguntaQuiz();
    
    const acao = acoes[Math.floor(Math.random() * acoes.length)];
    const maos = Object.keys(arvoreGTO[heroPos][acao]);
    
    if (maos.length === 0) return gerarPerguntaQuiz();

    const mao = maos[Math.floor(Math.random() * maos.length)];
    AppState.quiz.cenarioAtual = { posicao: heroPos, acao: acao, mao: mao, correta: arvoreGTO[heroPos][acao][mao] };

    let villainPos = null;
    if (acao === 'vs_Raise') {
        const viloesPossiveis = posicoes9Max.filter(p => p !== heroPos);
        villainPos = viloesPossiveis[Math.floor(Math.random() * viloesPossiveis.length)];
    }

    renderizarMesa('mesa-treinador', false, heroPos, villainPos);

    let textoContexto = acao === 'RFI' 
        ? `A mesa rodou em fold. Você é o <strong>${heroPos}</strong> (Azul) com:`
        : `O <strong>${villainPos}</strong> (Vermelho) deu Raise. Você está no <strong>${heroPos}</strong> (Azul) com:`;

    document.getElementById('quiz-texto-acao').innerHTML = textoContexto;
    document.getElementById('quiz-mao').innerText = mao;
}

function responderQuiz(resp) {
    const fb = document.getElementById('quiz-feedback');
    document.getElementById('quiz-controles').classList.add('hidden');
    fb.classList.remove('hidden', 'feedback-acerto', 'feedback-erro');
    document.getElementById('btn-proxima').classList.remove('hidden');

    let acertou = false, txt = "";
    const correta = AppState.quiz.cenarioAtual.correta;

    if (typeof correta === 'string') {
        acertou = (resp === correta);
        txt = `A ação ideal (GTO) é 100% ${correta.toUpperCase()}.`;
    } else {
        const freq = correta[resp];
        if (freq && freq > 0) { acertou = true; txt = `Correto! Essa mão usa ${resp.toUpperCase()} em ${freq}% das vezes.`; } 
        else { acertou = false; txt = `Incorreto. Essa mão não joga de ${resp.toUpperCase()} aqui.`; }
    }

    if (acertou) {
        AppState.quiz.score++;
        if (AppState.quiz.score > AppState.quiz.highScore) {
            AppState.quiz.highScore = AppState.quiz.score;
            localStorage.setItem('pokerPro_quizHighScore', AppState.quiz.highScore);
            document.getElementById('quiz-high-score').innerText = AppState.quiz.highScore;
            txt += "<br>🏆 <strong>Novo Recorde!</strong>";
        }
        fb.innerHTML = `✅ <strong>ACERTOU!</strong><br>${txt}`; fb.classList.add('feedback-acerto');
    } else {
        AppState.quiz.score = 0; 
        fb.innerHTML = `❌ <strong>ERROU.</strong><br>${txt}`; fb.classList.add('feedback-erro');
    }
    document.getElementById('quiz-score').innerText = AppState.quiz.score;
}

// ==========================================
// BOOT INICIAL DO SISTEMA (CONSOLIDADO)
// ==========================================
window.onload = async function() {
    try {
        // Garantir que Supabase foi inicializado
        if (!window.supabase || !supabase) {
            console.error('Supabase não foi carregado!');
            document.getElementById('auth-screen').classList.remove('hidden');
            return;
        }

        // Verificar sessão existente
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.warn("Erro ao verificar sessão:", error);
            document.getElementById('auth-screen').classList.remove('hidden');
            return;
        }

        if (session && session.user) {
            // Usuário já autenticado - entrar no app
            AppState.usuario = session.user;
            console.log('Usuário autenticado encontrado:', AppState.usuario.email);
            entrarNoApp();
        } else {
            // Nenhum usuário autenticado - mostrar tela de login
            document.getElementById('auth-screen').classList.remove('hidden');
            document.getElementById('app-container').classList.add('hidden');
            console.log('Nenhuma sessão ativa. Mostrando tela de autenticação.');
        }
    } catch (error) {
        console.error("Erro crítico no boot do sistema:", error);
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
        showToast("Erro ao inicializar aplicação. Recarregue a página.", "error");
    }
};