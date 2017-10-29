//module dependencies
var express = require('express');
var request = require('request');
var path = require ('path');

var fs = require('fs');
var app = express();

var jsonfile = require('jsonfile');

//setting up cheerio
var cheerio = require ('cheerio');
var html = fs.readFileSync('test.html', 'utf8');
html = html.replace(/\\r\\n|\\/g, '');
var $ = cheerio.load(html);

//get data from the html page
function getCode(){
  return $('.block-pnr').find('.pnr-ref .pnr-info').last().text().trim();
}

function getName(){
  return $('.block-pnr').find('.pnr-name .pnr-info').last().text().trim();
}

function getTotalPrice(){
  return $('.total-amount').find('.very-important').text().replace(',','.').replace('€','').trim();
}

function getPassengers() {
  passengers = [];

  $('.typology').each(function(i, elem) {
    if (i < 4) {
      passengers.push(
        {
          "type": "échangeable",
          "age": $(this).text().trim()
        }
      );
    }
  });
  return passengers;
} 

function getRoundTrips() {
  var RoundTrips = [];
 
  $('.product-details').each(function(i, elem) {
    trains = 
      {
        "departureTime": $(this).find('.origin-destination-hour').first().text().trim().replace('h',':'),
        "departureStation": $(this).find('.origin-destination-station').first().text().trim(),
        "arrivalTime": $(this).find('.origin-destination-border').first().text().trim().replace('h',':'),
        "arrivalStation": $(this).find('.origin-destination-border').last().text().trim(),
        "type": $(this).find('.segment').first().text().trim(),
        "number": $(this).find('.segment').next().first().text().trim()
      };
  
    if (i == 3) {
      trains.passengers = [];
      trains.passengers = getPassengers();
    };

    RoundTrips.push({
      "type": $(this).find('.travel-way').text().trim(),
      "date": $('.pnr-summary').text().match(/[0-9]{2}[-|\/]{1}[0-9]{2}[-|\/]{1}[0-9]{4}/g)[i].replace('/','-').replace('/','-'),
      "trains": [ trains ]
    });
  });
  return RoundTrips;
}

function getPrices(){
  var prices = [];

  $('.cell').each(function(i, elem){   
    price = {
      "value": $(this).text().replace(',','.').replace('€','').trim(),
    }
    
    if(!isNaN(price.value)) {
      prices.push(price);
    }
  });

  var amount = {
   "value": $('.amount').text().replace(',','.').replace('€','').trim()
  }
  prices.push(amount);
  return prices;
}

//json file structure
var json = {
  "status": "ok",
  "result": {
    "trips": [
      {
        "code": getCode(),
        "name": getName(),
        "details": {
          "price": getTotalPrice(),
          "roundTrips": getRoundTrips()
        },
      },
    ],
    "custom": {
      "prices": getPrices()
    }  
  }
};

//write json file
jsonfile.writeFile('result.json', json, { spaces: 2 }, function(err) {
  if (err) console.error(err);
  console.log('Parsed. Json file written!');
});

app.listen(3000, function () {
  console.log('Listening on port 3000!');
});