db.news.insertMany([
    {
        title: 'Vaca Voadora Avistada',
        imageUrl: "https://m.extra.globo.com/incoming/2446068-75d-e0a/w488h275-PROP/flyingcow.jpg",
        description: 'Did you know that temperature is really just a measure of how fast molecules are vibrating around?! 😱',
        link: 'https://m.extra.globo.com/incoming/2446068-75d-e0a/w488h275-PROP/flyingcow.jpg',
        theme: "famosos"
    }
]);

db.news.find( { theme: "famosos" } );
