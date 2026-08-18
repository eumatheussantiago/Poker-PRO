// ==========================================
// MÓDULO 1: BANKROLL, FINANÇAS E GRÁFICO
// ==========================================
let dadosBankroll = {
    lucroTotal: 0,
    investimentoTotal: 0,
    sessoesJogadas: 0,
    historicoLucro: [0] // Array para alimentar o gráfico
};
let graficoInstancia = null;

function registrarSessao() {
    const buyIn = parseFloat(document.getElementById('buy-in').value) || 0;
    const cashOut = parseFloat(document.getElementById('cash-out').value) || 0;

    if (buyIn === 0 && cashOut === 0) return; // Evita salvar sessão vazia

    const lucroSessao = cashOut - buyIn;
    
    dadosBankroll.lucroTotal += lucroSessao;
    dadosBankroll.investimentoTotal += buyIn;
    dadosBankroll.sessoesJogadas += 1;
    dadosBankroll.historicoLucro.push(dadosBankroll.lucroTotal);

    let roi = 0;
    if (dadosBankroll.investimentoTotal > 0) {
        roi = (dadosBankroll.lucroTotal / dadosBankroll.investimentoTotal) * 100;
    }

    atualizarInterfaceBankroll(roi);
    desenharGrafico();
    
    // Salva no LocalStorage
    localStorage.setItem('pokerPro_dados', JSON.stringify(dadosBankroll));

    // Limpa os inputs
    document.getElementById('buy-in').value = '';
    document.getElementById('cash-out').value = '';
}

function atualizarInterfaceBankroll(roi) {
    document.getElementById('lucro-total').innerText = `R$ ${dadosBankroll.lucroTotal.toFixed(2)}`;
    document.getElementById('roi-total').innerText = `${roi.toFixed(2)}%`;
    document.getElementById('sessoes-total').innerText = dadosBankroll.sessoesJogadas;
}

function desenharGrafico() {
    const ctx = document.getElementById('graficoBankroll').getContext('2d');
    
    if (graficoInstancia) {
        graficoInstancia.destroy();
    }

    const labels = dadosBankroll.historicoLucro.map((_, index) => index === 0 ? 'Início' : `Sessão ${index}`);

    graficoInstancia = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Crescimento do Bankroll (R$)',
                data: dadosBankroll.historicoLucro,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            color: '#fff',
            scales: {
                y: { grid: { color: '#444' } },
                x: { grid: { color: '#444' } }
            }
        }
    });
}

// ==========================================
// MÓDULO 2: MATRIZ DE RANGES (GTO)
// ==========================================
const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

// Base de dados simulada com suporte a frequências mistas
const rangesMock = {
    'UTG': {
        'AA': 'raise', 'KK': 'raise', 'QQ': 'raise', 'JJ': 'raise', 'TT': 'raise',
        'AKs': 'raise', 'AQs': 'raise', 'AJs': 'raise',
        'A5s': { raise: 50, fold: 50 }, // Exemplo de gradiente
        'A4s': { raise: 30, fold: 70 },
        'AKo': 'raise', 'AQo': 'raise',
        '99': 'call', '88': 'call', '77': 'call'
    },
    'BTN': {
        'AA': 'raise', 'KK': 'raise', 'QQ': 'raise', 'JJ': 'raise', 'TT': 'raise', '99': 'raise', '88': 'raise',
        'AKs': 'raise', 'AQs': 'raise', 'AJs': 'raise', 'ATs': 'raise', 'A9s': 'raise', 'A8s': 'raise',
        'AKo': 'raise', 'AQo': 'raise', 'AJo': 'raise', 'KQs': 'raise',
        '77': 'call', '66': 'call', '55': 'call',
        'T9o': { raise: 40, call: 60 }, // Exemplo de gradiente
        'JTs': 'call', 'T9s': 'call', '98s': 'call'
    }
};

function gerarMatrizPoker() {
    const grid = document.getElementById('matriz-grid');
    grid.innerHTML = ''; 

    for (let i = 0; i < ranks.length; i++) {
        for (let j = 0; j < ranks.length; j++) {
            let mao = '';
            
            if (i === j) {
                mao = ranks[i] + ranks[j]; 
            } else if (i < j) {
                mao = ranks[i] + ranks[j] + 's'; 
            } else {
                mao = ranks[j] + ranks[i] + 'o'; 
            }

            const celula = document.createElement('div');
            celula.className = 'celula-mao acao-fold'; // Fold por padrão
            celula.innerText = mao;
            celula.id = `mao-${mao}`;
            
            grid.appendChild(celula);
        }
    }
}

function aplicarRange(posicao) {
    // 1. Reseta o grid inteiro para fold
    document.querySelectorAll('.celula-mao').forEach(celula => {
        celula.className = 'celula-mao acao-fold';
        celula.style.background = ''; 
    });

    if (posicao === 'LIMPAR') return;

    // 2. Aplica o range selecionado
    const rangeSelecionado = rangesMock[posicao];

    for (const mao in rangeSelecionado) {
        const celula = document.getElementById(`mao-${mao}`);
        if (celula) {
            const acao = rangeSelecionado[mao];

            if (typeof acao === 'string') {
                // Ação 100% pura
                celula.className = `celula-mao acao-${acao}`;
            } else if (typeof acao === 'object') {
                // Ação Mista (Gradiente)
                celula.className = 'celula-mao';
                
                const pRaise = acao.raise || 0;
                const pCall = acao.call || 0;
                const pFold = acao.fold || 0;
                
                if (pRaise > 0 && pFold > 0) {
                    celula.style.background = `linear-gradient(135deg, #e74c3c ${pRaise}%, #2c3e50 ${pRaise}%)`;
                } else if (pRaise > 0 && pCall > 0) {
                    celula.style.background = `linear-gradient(135deg, #e74c3c ${pRaise}%, #2ecc71 ${pRaise}%)`;
                } else if (pCall > 0 && pFold > 0) {
                    celula.style.background = `linear-gradient(135deg, #2ecc71 ${pCall}%, #2c3e50 ${pCall}%)`;
                }
            }
        }
    }
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
window.onload = function() {
    gerarMatrizPoker(); 
    
    // Recupera dados salvos
    const saldoSalvo = localStorage.getItem('pokerPro_dados');
    if (saldoSalvo) {
        dadosBankroll = JSON.parse(saldoSalvo);
        
        let roi = 0;
        if (dadosBankroll.investimentoTotal > 0) {
            roi = (dadosBankroll.lucroTotal / dadosBankroll.investimentoTotal) * 100;
        }
        atualizarInterfaceBankroll(roi);
    }
    
    desenharGrafico(); 
};