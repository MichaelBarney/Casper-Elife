// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
 

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://elife:elife@cluster0-rojfb.gcp.mongodb.net/test?retryWrites=true&w=majority";

var fetch = require("node-fetch");

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
// Dialogflow Webhook
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });


    let intentMap = new Map();
    intentMap.set('News Intent', getNews);
    agent.handleRequest(intentMap);


    async function getNewsFromDB(theme){
        const client = await MongoClient.connect(uri, { useNewUrlParser: true })
        .catch(err => { console.log(err); });

        if (!client) {
            return null;
        }

        try {
            const db = client.db("casper");
            let collection = db.collection('news');
            let query = { theme: theme }
            let res = await collection.find(query).toArray();
            console.log(res);
            return res;
        } catch (err) {
            console.log(err);
        } finally {
            client.close();
        }
    }

    async function getNews(agent) {
    const theme = agent.parameters.theme;

    agent.add("Estas são as notícias sobre " + theme + " que encontrei:");

    // Request data from MongoDB
    const client = new MongoClient(uri, { useNewUrlParser: true });
    console.log("a: " + theme);
    const newsGroup = await getNewsFromDB(theme);
    console.log("b");

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
        agent.setFollowupEvent("no_news_found");
    }

    const quickReplies = new Suggestion({
        title: "Você quer ver mais notícias?",
        reply: "⚽ Esportes"
    })
    quickReplies.addReply_("⚖️ Política")
    quickReplies.addReply_("🎥 Entretenimento")
    quickReplies.addReply_("🤩 Famosos")

    agent.add(quickReplies);

    }
});

// News Updater
exports.newsUpdate = functions.pubsub.schedule('1 0 * * *')
    .timeZone('America/Sao_Paulo')
    .onRun(async (context) => {  
    const client = await MongoClient.connect(uri, { useNewUrlParser: true })
    .catch(err => { console.log(err); });

    if (!client) {
        return null;
    }
    try {
        const db = client.db("casper");
        let collection = db.collection('news');
        //get all news
        let allNews = await getAllNews()

        // clear the collection
        collection.deleteMany({})
        console.log(allNews);
        collection.insertMany(allNews)

    } catch (err) {
        console.log(err);
    } finally {
        client.close();
    }

    async function getAllNews(){
        const themes = ["esportes", "entretenimento", "famosos", "política"];

        var result = [];

        for (let theme of themes){
            console.log("******"+theme+"**********")
            const news = await getNews(theme)
            for (let i in  news.articles){
                if(i < 10){
                    let article = news.articles[i];
                    console.log("title: " + article.title)
                    result.push({
                        title: article.title,
                        imageUrl: article.urlToImage,
                        description: article.description,
                        link: await getURL(article.url),
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

    async function getURL(longURL){
        let queryURL = "https://api.rebrandly.com/v1/links/new?destination="+longURL+"&apikey=c95033066865402eb6d1dc40a4c4547f";
        try {
            const response = await fetch(queryURL);
            const json = await response.json();
            return "http://www."+json.shortURL;
        } catch (error) {
            console.log(error)
            return "";
        }
    }

    async function getNews(theme){
        // Get news from API
        var url = "https://newsapi.org/v2/everything?q="+theme.replace("í","i")+"&sortBy=publishedAt&language=pt&apiKey=c94f6bc4f1154d60b02095acecf75815";
        console.log("url: " + url);
        try {
            const response = await fetch(url);
            const json = await response.json();
            return json;
        } catch (error) {
            return {};
        }
    }

    return null;
});