// ==========================================
// MÓDULO 1: AUTENTICAÇÃO E NAVEGAÇÃO
// ==========================================
function mostrarAba(abaDestino) {
    document.getElementById('form-login').classList.add('hidden');
    document.getElementById('form-signup').classList.add('hidden');
    document.getElementById('tab-login').classList.remove('active-tab');
    document.getElementById('tab-signup').classList.remove('active-tab');

    if (abaDestino === 'login') {
        document.getElementById('form-login').classList.remove('hidden');
        document.getElementById('tab-login').classList.add('active-tab');
    } else {
        document.getElementById('form-signup').classList.remove('hidden');
        document.getElementById('tab-signup').classList.add('active-tab');
    }
}

function fazerCadastro() {
    const nome = document.getElementById('signup-nome').value;
    const email = document.getElementById('signup-email').value;
    if (!email || !nome) return alert("Preencha todos os campos.");
    alert(`Conta criada com sucesso! Bem-vindo(a), ${nome}.`);
    entrarNoApp();
}

function fazerLogin() {
    const email = document.getElementById('login-email').value;
    if (email.length > 0) entrarNoApp();
    else alert('Preencha seu e-mail para entrar.');
}

function entrarNoApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-header').classList.remove('hidden');
    document.getElementById('app-main').classList.remove('hidden');
    
    localStorage.setItem('pokerPro_logado', 'true');
    
    // Boot dos Sistemas
    gerarMatrizPoker(); 
    calcularEAtualizarTela('Todos'); 
    renderizarMesa('mesa-visualizador', true); // Mesa do Módulo 2
    inicializarQuiz(); // Boot do Módulo 3
}

// ==========================================
// MÓDULO 2: BANKROLL E GRÁFICOS
// ==========================================
let sessoes = [];
let graficoInstancia = null;

function registrarSessao() {
    const buyIn = parseFloat(document.getElementById('buy-in').value) || 0;
    const cashOut = parseFloat(document.getElementById('cash-out').value) || 0;
    const horas = parseFloat(document.getElementById('horas-jogadas').value) || 1; 
    const local = document.getElementById('tipo-local').value;
    if (buyIn === 0 && cashOut === 0) return;

    sessoes.push({ buyIn, cashOut, lucro: cashOut - buyIn, horas, local, data: new Date().toISOString() });
    localStorage.setItem('pokerPro_sessoes', JSON.stringify(sessoes));
    
    document.getElementById('buy-in').value = ''; 
    document.getElementById('cash-out').value = ''; 
    document.getElementById('horas-jogadas').value = '';
    
    calcularEAtualizarTela('Todos');
}

function calcularEAtualizarTela(filtroLocal) {
    const sFiltradas = filtroLocal === 'Todos' ? sessoes : sessoes.filter(s => s.local === filtroLocal);
    let lTotal = 0, invTotal = 0, hTotais = 0, historico = [0];

    sFiltradas.forEach(s => { 
        lTotal += s.lucro; 
        invTotal += s.buyIn; 
        hTotais += (s.horas || 1); 
        historico.push(lTotal); 
    });
    
    document.getElementById('lucro-total').innerText = `R$ ${lTotal.toFixed(2)}`;
    document.getElementById('roi-total').innerText = `${invTotal > 0 ? (lTotal/invTotal*100).toFixed(2) : '0.00'}%`;
    document.getElementById('sessoes-total').innerText = sFiltradas.length;
    document.getElementById('winrate-total').innerText = `R$ ${hTotais > 0 ? (lTotal/hTotais).toFixed(2) : '0.00'}/h`;
    
    document.getElementById('lucro-total').className = lTotal >= 0 ? 'lucro-positivo' : 'lucro-negativo';
    document.getElementById('winrate-total').className = (lTotal/hTotais) >= 0 ? 'lucro-positivo' : 'lucro-negativo';

    desenharGrafico(historico, filtroLocal);
    renderizarHistoricoTabela(sFiltradas);
}

function desenharGrafico(historico, titulo) {
    const ctx = document.getElementById('graficoBankroll').getContext('2d');
    if (graficoInstancia) graficoInstancia.destroy();
    graficoInstancia = new Chart(ctx, {
        type: 'line', 
        data: { 
            labels: historico.map((_, i) => i === 0 ? 'Início' : `Sessão ${i}`), 
            datasets: [{ label: `Lucro (${titulo})`, data: historico, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.2)', fill: true, tension: 0.3 }] 
        },
        options: { responsive: true, color: '#94a3b8', scales: { y: { grid: { color: '#334155' } }, x: { grid: { color: '#334155' } } } }
    });
}

function renderizarHistoricoTabela(sFiltradas) {
    const tbody = document.getElementById('corpo-tabela-historico');
    tbody.innerHTML = ''; 
    [...sFiltradas].reverse().forEach(s => {
        const d = new Date(s.data);
        tbody.innerHTML += `
            <tr>
                <td>${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}</td>
                <td>${s.local}</td><td>${s.horas || 1}h</td>
                <td>R$ ${s.buyIn.toFixed(2)}</td><td>R$ ${s.cashOut.toFixed(2)}</td>
                <td class="${s.lucro >= 0 ? 'lucro-positivo' : 'lucro-negativo'}"><strong>R$ ${s.lucro.toFixed(2)}</strong></td>
            </tr>`;
    });
}

function exportarCSV() {
    if (sessoes.length === 0) return alert("Nenhuma sessão registrada.");
    let csvContent = "data:text/csv;charset=utf-8,Data,Local,Horas,Buy-in,Cash-out,Lucro\n";
    sessoes.forEach(s => {
        const d = new Date(s.data);
        csvContent += `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()},${s.local},${s.horas||1},${s.buyIn},${s.cashOut},${s.lucro}\n`;
    });
    const link = document.createElement("a");
    link.href = encodeURI(csvContent); link.download = "historico_poker_pro.csv";
    document.body.appendChild(link); link.click(); link.remove();
}

// ==========================================
// MÓDULO 3: GTO VISUALIZADOR 9-MAX
// ==========================================
const posicoes9Max = ['BTN', 'SB', 'BB', 'UTG', 'UTG1', 'UTG2', 'MP', 'HJ', 'CO'];

// Mock Completo de Ranges
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

let posicaoSelecionadaVisualizador = 'BTN';

// Geometria da Mesa
function renderizarMesa(containerId, isVisualizador = false, heroPos = null, villainPos = null) {
    const container = document.getElementById(containerId);
    container.innerHTML = '<div class="poker-table-shape"></div>'; 
    
    const rx = 45; // Raio X (largura oval)
    const ry = 45; // Raio Y (altura oval)
    
    posicoes9Max.forEach((pos, index) => {
        const angle = (index * (360 / 9) - 90) * (Math.PI / 180);
        const x = 50 + Math.cos(angle) * rx;
        const y = 50 + Math.sin(angle) * ry;

        const seat = document.createElement('div');
        seat.className = 'seat';
        seat.innerText = pos;
        seat.style.left = `${x}%`;
        seat.style.top = `${y}%`;

        if (isVisualizador) {
            if (pos === posicaoSelecionadaVisualizador) seat.classList.add('active');
            seat.onclick = () => {
                posicaoSelecionadaVisualizador = pos;
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
    aplicarRangeAvancadoUI(); // Aplica cor inicial (BTN)
}

function aplicarRangeAvancadoUI() {
    document.querySelectorAll('.celula-mao').forEach(c => { c.className = 'celula-mao acao-fold'; c.style.background = ''; c.style.color = '';});
    const acao = document.getElementById('acao-vilao').value;
    const range = arvoreGTO[posicaoSelecionadaVisualizador]?.[acao];
    if (!range) return; 

    for (const mao in range) {
        const celula = document.getElementById(`mao-${mao}`);
        if (celula) {
            const dec = range[mao];
            if (typeof dec === 'string') { celula.className = `celula-mao acao-${dec}`; } 
            else {
                celula.className = 'celula-mao';
                const pR = dec.raise || 0, pC = dec.call || 0, pF = dec.fold || 0;
                if (pR > 0 && pF > 0) celula.style.background = `linear-gradient(135deg, #ef4444 ${pR}%, #0f172a ${pR}%)`;
                else if (pR > 0 && pC > 0) celula.style.background = `linear-gradient(135deg, #ef4444 ${pR}%, #10b981 ${pR}%)`;
                else if (pC > 0 && pF > 0) celula.style.background = `linear-gradient(135deg, #10b981 ${pC}%, #0f172a ${pC}%)`;
                celula.style.color = "white"; 
            }
        }
    }
}

// ==========================================
// MÓDULO 4: MODO TREINADOR (QUIZ)
// ==========================================
let quizScore = 0, quizHighScore = 0, quizCenarioAtual = null;

function inicializarQuiz() {
    const recorde = localStorage.getItem('pokerPro_quizHighScore');
    if (recorde) { quizHighScore = parseInt(recorde); document.getElementById('quiz-high-score').innerText = quizHighScore; }
    gerarPerguntaQuiz();
}

function gerarPerguntaQuiz() {
    document.getElementById('quiz-feedback').classList.add('hidden');
    document.getElementById('btn-proxima').classList.add('hidden');
    document.getElementById('quiz-controles').classList.remove('hidden');

    const heroPos = posicoes9Max[Math.floor(Math.random() * posicoes9Max.length)];
    const acoes = Object.keys(arvoreGTO[heroPos]);
    const acao = acoes[Math.floor(Math.random() * acoes.length)];
    const maos = Object.keys(arvoreGTO[heroPos][acao]);
    
    if (maos.length === 0) return gerarPerguntaQuiz();

    const mao = maos[Math.floor(Math.random() * maos.length)];
    quizCenarioAtual = { posicao: heroPos, acao: acao, mao: mao, correta: arvoreGTO[heroPos][acao][mao] };

    // Sorteia vilão evitando que seja o mesmo do Hero
    let villainPos = null;
    if (acao === 'vs_Raise') {
        const viloesPossiveis = posicoes9Max.filter(p => p !== heroPos);
        villainPos = viloesPossiveis[Math.floor(Math.random() * viloesPossiveis.length)];
    }

    renderizarMesa('mesa-treinador', false, heroPos, villainPos);

    let textoContexto = acao === 'RFI' 
        ? `A mesa rodou em fold. Você é o primeiro a agir no <strong>${heroPos}</strong> (Azul) com:`
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
    if (typeof quizCenarioAtual.correta === 'string') {
        acertou = (resp === quizCenarioAtual.correta);
        txt = `A ação ideal na teoria (GTO) é 100% ${quizCenarioAtual.correta.toUpperCase()}.`;
    } else {
        const freq = quizCenarioAtual.correta[resp];
        if (freq && freq > 0) { acertou = true; txt = `Correto! Essa mão usa ${resp.toUpperCase()} em ${freq}% das vezes.`; } 
        else { acertou = false; txt = `Essa mão não joga de ${resp.toUpperCase()} nesta situação.`; }
    }

    if (acertou) {
        quizScore++;
        if (quizScore > quizHighScore) {
            quizHighScore = quizScore;
            localStorage.setItem('pokerPro_quizHighScore', quizHighScore);
            document.getElementById('quiz-high-score').innerText = quizHighScore;
            txt += "<br>🏆 <strong>Novo Recorde!</strong>";
        }
        fb.innerHTML = `✅ <strong>ACERTOU!</strong><br>${txt}`; fb.classList.add('feedback-acerto');
    } else {
        quizScore = 0; 
        fb.innerHTML = `❌ <strong>ERROU.</strong><br>${txt}`; fb.classList.add('feedback-erro');
    }
    document.getElementById('quiz-score').innerText = quizScore;
}

// ==========================================
// BOOT DO SISTEMA
// ==========================================
window.onload = function() {
    const salvas = localStorage.getItem('pokerPro_sessoes');
    if (salvas) sessoes = JSON.parse(salvas);

    if (localStorage.getItem('pokerPro_logado') === 'true') {
        entrarNoApp();
    }
};