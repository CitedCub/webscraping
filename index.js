const rp = require('request-promise');
const cheerio = require('cheerio');
const { appendFile } = require('fs');

let challenges = [];

const options = {
    url: `https://www.freecodecamp.org/page-data/learn/page-data.json`,
    json: true
}

rp(options)
    .then((data) => {
        let edgeData = [];
        for (let edge of data.result.data.allChallengeNode.edges) {
            if (edge.node.block === `react`) {
                edgeData.push({ slug: edge.node.fields.slug });
            }
        };
        process.stdout.write('loading');
        getChallenges(edgeData);
    })
    .catch((error) => {
        console.log(error);
    });

function getChallenges(edgeData) {
    let i = 0;
    function next() {
        if (i < edgeData.length) {
            let options = {
                url: `https://www.freecodecamp.org/page-data` + edgeData[i].slug + `/page-data.json`,
                json: true
            }
            console.log(options.url);
            rp(options)
                .then((data) => {
                    process.stdout.write(`.`);
                    challenges.push({
                        title: data.result.data.challengeNode.title,
                        description: data.result.data.challengeNode.description
                    });
                    ++i;
                    return next();
                })
        } else {
            writeData();
        }
    }
    return next();
}

function writeData() {
    console.log('✅');
    challenges.forEach(challenge => {
        appendFile(
            'challenges.html',
            `<h2>${challenge.title}</h2>\n${challenge.description}`,
            () => console.log(`Wrote to file: ${challenge.title}`)
        )
    });
}