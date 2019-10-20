const rp = require('request-promise');
const cheerio = require('cheerio');
const { appendFileSync } = require('fs');

const options = {
    url: `https://www.freecodecamp.org/page-data/learn/page-data.json`,
    json: true
}

rp(options)
    .then((data) => {
        let edges = getEdges(data);
        let challengePromises = getChallengePromises(edges);
        Promise.all(challengePromises)
            .then(writeHtml)
            .catch((error) => {
                console.log('Error', error);
            })
    });

function writeHtml(challenges) {
    let lastBlockName = '';
    challenges.forEach(challenge => {
        let challengeNode = challenge.result.data.challengeNode;
        let blockName = challengeNode.fields.blockName;
        if (blockName !== lastBlockName) {
            appendFileSync(
                'index.html',
                `<a href="${blockName.replace(/\s+/g, '')}Challenges.html">${blockName} Challenges</a><br/>\n`);
            appendFileSync(
                `${blockName.replace(/\s+/g, '')}Challenges.html`,
                `<script>\nfunction toggleVisibility(target) {\nlet instructionsElement = target.getElementsByTagName('div')[0];\ninstructionsElement.style.display = instructionsElement.style.display==='none'?'block':'none';\n}\n</script>`
            )
        }
        let challengeHtml = `<h2>${challengeNode.title}</h2>\n` +
            `${challengeNode.description}\n`;
        if (challengeNode.instructions) {
            challengeHtml = challengeHtml +
                `<div onclick="toggleVisibility(this)">Click to toggle instructions\n` +
                `<div style="display: none">\n` +
                `${challengeNode.instructions}\n` +
                `</div>\n</div>\n`;
        }
        appendFileSync(
            `${blockName.replace(/\s+/g, '')}Challenges.html`,
            challengeHtml
        );
        lastBlockName = challengeNode.fields.blockName;
    });
}

function getChallengePromises(edges) {
    let challengePromises = [];
    edges.forEach(edge => {
        let options = {
            url: `https://www.freecodecamp.org/page-data` + edge.slug + `/page-data.json`,
            json: true
        };
        challengePromises.push(rp(options));
    });
    return challengePromises;
}

function getEdges(data) {
    let edges = [];
    for (let edge of data.result.data.allChallengeNode.edges) {
        edges.push({
            superBlock: edge.node.superBlock,
            block: edge.node.block,
            blockName: edge.node.fields.blockName,
            slug: edge.node.fields.slug,
        });
    }
    return edges;
}
