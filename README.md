# Casper-Elife

Chatbot para reunir notícias. Mini-Projeto realizado como etapa de seleção na Elife.

[**Link para conversar com Casper** ](http://www.m.me/casper.noticias)

## Requisitos
- [x] Para conversar com o Casper, as pessoas devem abrir a página do Facebook do bot e iniciarem um diálogo via Mensagem Privada.
- [x] Ao falarem com o Casper, os usuários receberão uma saudação do bot e um menu com vários temas de notícias em Quick Replies. (Esportes, Entretenimento, Famosos e Política)
- [x] Ao escolherem um tema, os usuários recebem um conjunto de até 10 notícias sobre o tema escolhido.
- [x] Caso não haja notícias sobre esse tema, o bot deverá desculpar-se e
exibir o menu de temas novamente.
- [x] Cada notícia é um Modelo genérico do Facebook Messenger composto por uma imagem, um título, uma descrição e um botão que leva ao link da fonte da notícia.
- [x] As notícias devem ser mostradas ao usuário como um Carrossel de Modelos Genéricos.
- [x] As notícias são obtidas de um banco de dados em MongoDB.
- [x] Para que pessoas externas consigam conversar com seu chatbot, você deve submetê-lo para status de “live” no Facebook.

## Branding e Personalidade
Casper é um fantasma jovem e antenado em tudo de novo, desde futebol até as fofocas das celebridades.

### Assets
<img src="https://github.com/MichaelBarney/Casper-Elife/blob/master/Assets/Casper_Perfil.png?raw=true" width="40%">
<img src="https://github.com/MichaelBarney/Casper-Elife/blob/master/Assets/Casper_Cover.png?raw=true" width="80%">

### Voz e Tom
Descontraído, engraçado e jovem.

👻😱💜😂
⚽ ⚖️ 🎥 🤩

## Fluxograma de Diálogo
<img src="https://github.com/MichaelBarney/Casper-Elife/blob/master/Fluxograma/Casper_Fluxograma.png?raw=true" width="90%">

## Banco de Dados
O banco de dados utilizado foi o MongoDB através do serviço **MongoDB Atlas**.

O banco de dados possui apenas uma coleção (**news**) que possui como documentos todas as notícias coletadas, contendo nelas:
 - **title** - Título da Notícia
 - **imageUrl** - Url da imagem da Notícia
 - **description** - Descrição da Notícia
 - **link** - Url da fonte da notícia
 - **theme** - A categoria da notícia.

## Fufillments
O chatbot foi feito utilizando um agente do Dialogflow diretamente integrado com o Facebook Messenger. Desta maneira, para fazer solicitações ao banco de dados de notícias foi necessário um Webhook de fufillments.

Assim, foi implementado uma Firebase Function, [encontrada aqui](https://github.com/MichaelBarney/Casper-Elife/blob/master/Fufillment/functions/index.js), para receber a chamada, fazer a solicitação ao banco de dados e retornar um carrousel com as notícias do tema escolhido.

## Preenchimento do Bando de Dados
Para preencher o banco de dados, foi implementada uma Firebase Function agendada para executar diariamente às 00:01, [encontrada aqui](https://github.com/MichaelBarney/Casper-Elife/blob/master/Fufillment/functions/index.js).

Para coletar notícias, esta função faz chamadas à [News API](https://newsapi.org/) passando parâmetros para garantir notícias em português e do tema selecionado.

Em seguida, a função conecta ao banco de dados e o preenche com as notícias de maneira à ser utilizada posteriormente pela função de Webhook do Dialogflow.

Além disto, foi observado que algumas URLs estavam entrando em conflito com o Facebook Messenger, como as notícias do website InfoMoney. Assim, foi implementado uma função para minificar as URLs das fontes das notícias utilizando a API do [Rebrandly](https://api.rebrandly.com).

