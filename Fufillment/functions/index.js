/**
 * Firebase Function do Casper Chatbot
 * Michael Barney - 2019
 */

'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const MongoClient = require('mongodb').MongoClient;
var fetch = require("node-fetch");
var probe = require('probe-image-size');
process.env.DEBUG = 'dialogflow:debug';
 


/**
 *  Firebase Funcion
 *  Chamada após receber um Request do Dialogflow na URL específicada.
 *  Retorna uma resposta ao Agente do Dialogflow.
*/
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {

    // Analisar a mensagem recebida e delegar a função correta à ser executada de acordo com seu Intent.
    const agent = new WebhookClient({ request, response });
    let intentMap = new Map();
    intentMap.set('News Intent', getNews);
    agent.handleRequest(intentMap);

    /**
     * Função para o intent getNews.
     * Retorna um carrousel de notícias.
     * @param {Dialogflow Agent} agent 
     */
    async function getNews(agent) {
        // Receber o tema da notícia
        const theme = agent.parameters.theme;
        agent.add("Estas são as notícias sobre " + theme + " que encontrei:");

        // Requisitar notícias do Banco de Dados
        const newsGroup = await getNewsFromDB(theme);

        // Montar o Carrousel de Notícias
        if (newsGroup.length > 0 ){
            for (let news of newsGroup){
                agent.add(new Card({
                    title: news.title,
                    imageUrl: news.imageUrl,
                    text: news.description,
                    buttonText: 'Saiba Mais', 
                    buttonUrl: news.link
                    })
                );
            }
        }
        else{
            // Nenhuma notícia foi encontrada
            agent.setFollowupEvent("no_news_found");
        }

        // Montar o menu de temas de notícias
        const quickReplies = new Suggestion({
            title: "Você quer ver mais notícias?",
            reply: "⚽ Esportes"
        })
        quickReplies.addReply_("⚖️ Política")
        quickReplies.addReply_("🎥 Entretenimento")
        quickReplies.addReply_("🤩 Famosos")
        agent.add(quickReplies);
    }

    /**
     * Pesquisa no Banco de Dados as notícias de dado tema.
     * @param {string} theme - O tema das notícias à serem pesquisadas
     */
    async function getNewsFromDB(theme){
        const client = await MongoClient.connect(functions.config().mongodb.uri, { useNewUrlParser: true })
        .catch(err => { console.log(err); });

        if (!client) {
            return null;
        }

        try {
            const db = client.db("casper");
            let collection = db.collection('news');
            let query = { theme: theme }
            let res = await collection.find(query).toArray();
            return res;
        } catch (err) {
            console.log(err);
        } finally {
            client.close();
        }
    }
});

/**
 *  Firebase Funcion
 *  Chamada diariamente às 00:01
 *  Preenche o banco de dados com notícias coletadas de uma API extrarna. 
*/
exports.newsUpdate = functions.pubsub.schedule('1 0 * * *')
    .timeZone('America/Sao_Paulo')
    .onRun(async () => {  

    const client = await MongoClient.connect(functions.config().mongodb.uri, { useNewUrlParser: true })
    .catch(err => { console.log(err); });

    if (!client) {
        return null;
    }
    try {
        const db = client.db("casper");
        let collection = db.collection('news');

        //Coletar notícias
        let allNews = await getAllNews()

        //Limpar a coleção
        collection.deleteMany({})

        // Preencher as notícias
        collection.insertMany(allNews)

    } catch (err) {
        console.log(err);
    } finally {
        client.close();
    }

    /**
     * Coleta 10 notícias de cada tema através da NewsAPI
     * Retorna um array com objetos representando as notícias.
     */
    async function getAllNews(){
        const themes = ["esportes", "entretenimento", "famosos", "política"];

        var result = [];

        // Primeiro, remover os links que foram minificados previamente
        deleteAll()

        // Em seguida, preencher 'result' com objetos representando as notícias
        for (let theme of themes){
            const news = await getNews(theme)
            
            for (let i in  news.articles){
                if(i < 10){
                    let article = news.articles[i];

                    var imageUrl = article.urlToImage
   
                    // Imagens grandes travam o messenger, então é ncesessário verificar seu tamanho antes de adicionála.
                    let dimensions = await probe(imageUrl, { timeout: 5000 }).catch(() => imageUrl = "");
                    let size = dimensions.width * dimensions.height;
                    console.log(size);
                    if (size > 1000000){
                        imageUrl = ""
                    }

                    result.push({
                        title: article.title,
                        imageUrl: imageUrl,
                        description: article.description,
                        link: await minifyURL(article.url), // Url minificado, pois alguns podem entrar em conflito com o messenger.
                        theme: theme
                    })
                }
                else{
                    break;
                }
            }
        }

        return result;
    }

    /**
     * Requere à NewsAPI notícias em português do tema específicado.
     * Retorna um objeto com as informações da notícia.
     * @param {String} theme  - O tema da notícia à ser pesquisada.
     */
    async function getNews(theme){
        var url = "https://newsapi.org/v2/everything?q="+theme.replace("í","i")+"&sortBy=publishedAt&language=pt&apiKey=" + functions.config().newsapi.key;
        try {
            const response = await fetch(url);
            const json = await response.json();
            return json;
        } catch (error) {
            return {};
        }
    }

    /**
     * Minifica urls através da API da Rebrangly
     * Returna o url minificado.
     * @param {String} longURL 
     * @returns {String}
     */
    async function minifyURL(longURL){
        let queryURL = "https://api.rebrandly.com/v1/links/new?destination="+longURL+"&apikey="+functions.config().rebrandly.key;
        try {
            const response = await fetch(queryURL);
            const json = await response.json();
            return "http://www."+json.shortURL;
        } catch (error) {
            console.log(error)
            return "";
        }
    }
    /**
     * Deleta urls minificados previamente pelo rebrandly
     */
    async function deleteAll(){
        var running = true;
    
        while(running){
            console.log(running);
            let links_raw = await fetch("https://api.rebrandly.com/v1/links?apikey="+functions.config().rebrandly.key)
            let links = await links_raw.json();
            if (links.length == 0){
                running = false;
            }
            else{
                for (link of links){
                    console.log(link.id);
                    await fetch("https://api.rebrandly.com/v1/links/" + link.id + "?apikey="+functions.config().rebrandly.key, {
                        method: "delete"
                    })
                }  
            }  
        }
    }
    return null;
});