let lucroAcumulado = 0;

function registrarSessao() {
    // Captura os valores digitados no HTML
    const buyIn = parseFloat(document.getElementById('buy-in').value) || 0;
    const cashOut = parseFloat(document.getElementById('cash-out').value) || 0;

    // Calcula o resultado da sessão
    const lucroSessao = cashOut - buyIn;
    lucroAcumulado += lucroSessao;

    // Atualiza o valor na interface
    document.getElementById('lucro-total').innerText = `R$ ${lucroAcumulado.toFixed(2)}`;

    // Salva o dado no navegador do usuário
    localStorage.setItem('pokerPro_lucro', lucroAcumulado);

    // Limpa os campos para a próxima entrada
    document.getElementById('buy-in').value = '';
    document.getElementById('cash-out').value = '';
}

// Carrega o histórico financeiro salvo assim que o app é aberto
window.onload = function() {
    const saldoSalvo = localStorage.getItem('pokerPro_lucro');
    if (saldoSalvo) {
        lucroAcumulado = parseFloat(saldoSalvo);
        document.getElementById('lucro-total').innerText = `R$ ${lucroAcumulado.toFixed(2)}`;
    }
}