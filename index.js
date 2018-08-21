const request = require('request');
const _ = require('lodash');
const fs = require('fs');
const util = require('util');

const writeFile = util.promisify(fs.writeFile);

const KERALA_RESCUE_DATA_API = 'https://keralarescue.in/data';

function fetch_data_from_offset(offset, api_url) {
  return new Promise((resolve, reject) => {
        let url = `${api_url || KERALA_RESCUE_DATA_API}?offset=${offset}`;
        console.log(`GET ${url}`);
        request.get(url, (error, response, body) => {
            if(error) {
                console.log('Error fetching api');
                return reject(error);
            }
            try {
                return resolve(JSON.parse(response.body));
            } catch(e) {
                console('Error parsing response body');
                return reject(e);
            }
        })
    })
}

async function fetch(done, url) {
    let offset = 0;
    let lastRecordID = -1;
    let masterData = []

    while(offset !== lastRecordID) {
        console.log(`Offset: ${offset}, lastRecordID: ${lastRecordID}`);
      let data = await fetch_data_from_offset(offset, url);
        masterData = _.concat(masterData, data.data);
        let lastObject = data.data[data.data.length - 1];
        offset = lastObject.id;
        lastRecordID = data.meta.last_record_id
    }
    done(masterData);
}

console.log(process.argv[2])

fetch((data) => {
    writeFile('data_complete.json', JSON.stringify(data))
    .then(() => {
        console.log('Data exported successfully');
    })
    .catch((error) => {
        console.error('Error occurred while exporting data');
    });
}, process.argv[2])


/*

Usage:

node index.js https://keralarescue.in/data #to download request data

node index.js https://keralarescue.in/relief_camps/data #to download relief camp data

*/
