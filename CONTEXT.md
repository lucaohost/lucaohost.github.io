# Ranking de Sinuca

Ranking das temporadas do grupo que joga sinuca. O terminal do site usa a mesma sessão e o mesmo banco.

## Language

**Temporada**:
Um ano do ranking.
_Avoid_: ano

**Temporada fechada**:
Temporada cujo ranking não recebe mais partidas. 2024 e 2025 são temporadas fechadas.
_Avoid_: temporada simples, arquivo

**Temporada atual**:
Temporada em que partidas ainda são registradas. 2026 é a temporada atual.
_Avoid_: temporada aberta

**Jogador**:
Pessoa que faz parte do elenco de uma temporada.

**Jogador oculto**:
Jogador da temporada atual que continua no elenco, no histórico de partidas e nos cálculos de classificação e de estatísticas, mas fica de fora do ranking e do ranking de aproveitamento. Duplas e sequências continuam citando o nome. Pode voltar a aparecer.
_Avoid_: jogador removido, jogador banido, jogador inativo

**Ranking**:
Tabela pública de classificação da temporada, ordenada pelo aproveitamento.
_Avoid_: tabela principal, scoreboard

**Ranking de aproveitamento**:
Tabela de estatísticas que lista o aproveitamento de cada jogador no período escolhido.
_Avoid_: tabela de ranking das estatísticas

**Aproveitamento**:
Vitórias divididas pelos jogos, no mesmo formato em todas as temporadas.
_Avoid_: percentual, pontuação

**Critério de classificação**:
Para se classificar é preciso ter pelo menos metade das vitórias do jogador com mais vitórias. As vitórias de um jogador oculto entram nessa conta.
_Avoid_: corte

**Histórico de partidas**:
Lista das partidas registradas. Um jogador oculto continua nomeado ali.
_Avoid_: log

### Acesso

**Visitante**:
Quem usa o site sem sessão.
_Avoid_: anônimo, usuário

**Sessão**:
Um jogador ou o operador autenticado neste navegador.
_Avoid_: login, anônimo

**PIN**:
Palavra de 4 letras ou números de um jogador, usada para abrir a sessão dele.
_Avoid_: senha, password, pin numérico

**Operador**:
A conta do Lucas.
_Avoid_: admin, usuário admin

**Lista do operador**:
Histórico de músicas randomizadas gravado na sessão do operador.
_Avoid_: lista do Lucas

**Lista de visitantes**:
Histórico de músicas randomizadas gravado fora da sessão do operador.
_Avoid_: lista pública
