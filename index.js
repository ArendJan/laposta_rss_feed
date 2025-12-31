#!/usr/bin/env node

// script to download laposta campaigns and serve them as rss feed



const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const xml2js = require('xml2js');
// Load configuration


const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
    console.error('Configuration file config.json not found!');
    process.exit(1);
}
let allCampaigns = [];
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const { apiKey, public_lists, port, url, title, description } = config;
let { update_interval_minutes } = config;

if (!apiKey) {
    console.error('Invalid configuration. Please check config.json.');
    process.exit(1);
}

if(!update_interval_minutes || isNaN(update_interval_minutes) || update_interval_minutes <= 0) {
    update_interval_minutes = 1; // default to 1 minute
}

// Function to generate RSS feed from campaign data
function generateRssFeed(campaigns) {
    const builder = new xml2js.Builder({ rootName: 'rss', xmldec: { version: '1.0', encoding: 'UTF-8' } });
    const rss = {
        $: { version: '2.0' },
        channel: {
            title: title,
            link: url || 'http://localhost',
            description: description,
            item: campaigns.map(campaign => ({
                title: campaign.subject,
                link: campaign.webversion_url,
                description: campaign.content,
                pubDate: new Date(campaign.sent_at).toUTCString(),
                guid: campaign.id,
                //     <media:content 
        // xmlns:media="http://search.yahoo.com/mrss/" 
        // url="http://www.widget.com/images/thumb.gif" 
        // medium="image" 
        // type="image/jpeg" 
        // width="150" 
        // height="150" />
                "media.content": {
                    $: {
                        url: campaign.image,
                        medium: 'image',
                        type: 'image/jpeg'
                    }
                },
                // <enclosure length="0" type="image/jpeg" url=""/>
                enclosure: {
                    $: {
                        url: campaign.image,
                        type: 'image/jpeg',
                        length: '128733'
                    }
                }
                // image: { url: campaign.image }
            }))
        }
    };
    return builder.buildObject(rss);
}

// Create HTTP server to serve RSS feed
const server = http.createServer(async (req, res) => {
    if (req.url === '/rss') {
        try {
            const rssFeed = generateRssFeed(allCampaigns);
            res.writeHead(200, { 'Content-Type': 'application/rss+xml' });
            res.end(rssFeed);
        } catch (err) {
            console.error('Error generating RSS feed:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error fetching campaign data');
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});


// function to fetch list of campaigns
async function fetchCampaignList() {
    const url = `https://api.laposta.nl/v2/campaign`;
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'Authorization': 'Basic ' + Buffer.from(apiKey + ':').toString('base64') } }, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.data);
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}



async function updateCampaigns() {
    
fetchCampaignList().then(campaigns => {
    allCampaigns = [];
    console.log('Available campaigns:');
    console.log(JSON.stringify(campaigns, null, 2));
    campaigns.forEach((c,i) => {
        console.log(`ID: ${c.campaign.campaign_id}, Subject: ${c.campaign.subject}`);
        if(c.campaign.delivery_requested && (new Date(c.campaign.delivery_requested) > new Date())) {
            console.log('  (skipping future campaign)');
            return;
        }
        console.log(" List IDs: ", Object.keys(c.campaign.list_ids));
        if(public_lists.length > 0 && Object.keys(c.campaign.list_ids).every(id => !public_lists.includes(id))) {
            console.log('  (skipping non-public list campaign)');
            return;
        }

        allCampaigns.push({id: c.campaign.campaign_id, subject: c.campaign.subject, webversion_url: c.campaign.web, content: c.campaign.previewtext, sent_at: c.campaign.delivery_requested || c.campaign.created || new Date().toISOString(), image: Object.values(c.campaign.screenshot)[0] || ""});
    });
    allCampaigns.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
    console.log('All campaigns for RSS feed:', allCampaigns.length);
}).catch(err => {
    console.error('Error fetching campaign list:', err);
});
}

// Initial fetch of campaigns
updateCampaigns();

setInterval(() => {
    updateCampaigns();
}, update_interval_minutes*60*1000); // Update every x minutes

// Start the server
server.listen(port || 3000, () => {
    console.log(`Server is running at http://localhost:${port || 3000}/rss`);
});


