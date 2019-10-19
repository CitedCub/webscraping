const rp = require('request-promise');
const cheerio = require('cheerio');
const { appendFileSync } = require('fs');

const options = {
    url: `https://www.freecodecamp.org/page-data/learn/page-data.json`,
    json: true
}

rp(options)
    .then((data) => {
        let edges = [];
        for (let edge of data.result.data.allChallengeNode.edges) {
            edges.push({
                block: edge.node.block,
                slug: edge.node.fields.slug,
            });
        };
        const blocks = getBlocks(edges);
        blocks.forEach(block => {
            writeChallenges(block, edges);
        });
        // writeChallenges('react', edges);
    })
    .catch((error) => {
        console.log(error);
    });

function getBlocks(edges) {
    let blocks = [];
    edges.forEach((edge) => {
        if (!blocks.includes(edge.block)) {
            blocks.push(edge.block);
        }
    });
    return blocks;
}

function writeChallenges(block, edges) {
    let i = 0;
    let challenges = [];
    function next() {
        if (i < edges.length) {
            if (edges[i].block === block) {
                let options = {
                    url: `https://www.freecodecamp.org/page-data` + edges[i].slug + `/page-data.json`,
                    json: true
                }
                console.log('Requesting', options.url);
                rp(options)
                    .then((data) => {
                        let challenge = {
                            title: data.result.data.challengeNode.title,
                            description: data.result.data.challengeNode.description
                        }
                        challenges.push(challenge);
                        i++;
                        next();
                    })
                    .catch((error) => { console.log('Error', error) })
            } else {
                i++;
                next();
            }
        } else {
            writeData(block, challenges);
        }
    }
    return next();
}

function writeData(block, challenges) {
    console.log('✅');
    challenges.forEach(challenge => {
        appendFileSync(
            `${block}Challenges.html`,
            `<h2>${challenge.title}</h2>\n${challenge.description}\n`
        )
    });
    appendFileSync(
        'index.html',
        `<a href="${block}Challenges.html">${block}Challenges</a><br/>`
    )
}