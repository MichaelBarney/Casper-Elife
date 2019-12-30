var fetch = require("node-fetch");

deleteAll();

async function deleteAll(){
    var running = true;

    while(running){
        console.log(running);
        let links_raw = await fetch("https://api.rebrandly.com/v1/links?apikey=c95033066865402eb6d1dc40a4c4547f")
        let links = await links_raw.json();
        if (links.length == 0){
            running = false;
        }
        else{
            for (link of links){
                console.log(link.id);
                await fetch("https://api.rebrandly.com/v1/links/" + link.id + "?apikey=c95033066865402eb6d1dc40a4c4547f", {
                    method: "delete"
                })
            }  
        }  
    }
}