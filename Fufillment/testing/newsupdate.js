const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://elife:elife@cluster0-rojfb.gcp.mongodb.net/test?retryWrites=true&w=majority";

var fetch = require("node-fetch");
var probe = require('probe-image-size');

myFunc();

async function myFunc(){

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
            const news = await getNews(theme)
            
            for (let i in  news.articles){
                if(i < 10){
                    let article = news.articles[i];

                    var imageUrl = article.urlToImage
   
                    if (imageUrl){
                        let dimensions = await probe(imageUrl, { timeout: 5000 }).catch(() => imageUrl = "");
                        let size = dimensions.width * dimensions.height;
                        console.log(size);
                        if (size > 1000000){
                            imageUrl = ""
                        }
                    }

                    result.push({
                        title: article.title,
                        imageUrl: imageUrl,
                        description: article.description,
                        link: await minifyURL(article.url),
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

    async function minifyURL(longURL){
        let queryURL = "https://api.rebrandly.com/v1/links/new?destination="+longURL+"&apikey=c95033066865402eb6d1dc40a4c4547f";
        try {
            const response = await fetch(queryURL);
            const json = await response.json();
            return "http://www."+json.shortURL;
        } catch (error) {
            console.log(error)
            return "https://www.google.com/";
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
}