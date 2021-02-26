const http = require('http');
const express = require('express');
var cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const app = express();
app.use(express.json());
app.use(express.static("express"));
app.use(cors());

const cal = require('./calculate');

const getCost = async (ebay, weight, hs) => {
    return await cal.calculateCost(ebay, weight, hs)
}

app.use(bodyParser.urlencoded({
    extended: true
}));


// default URL for website
app.get('/', function(req,res){
    res.sendFile(path.join(__dirname+'/express/index.html'));
    //__dirname : It will resolve to your project folder.
});


app.get('/calculateCost', (req, res) => {
    var ebay = req.query.ebay;
    var weight = req.query.weight;
    var hs = req.query.hscode;
    cal.calculateCost(ebay, weight, hs).then((total) => {
        res.end(JSON.stringify(total))
    }).catch((err) => {
        console.log(err)
    })
    // total = cal.calculateCost(ebay, weight, hs).then(
    //     res.json({cost: total})
    // )
    // res.json({cost: total})
    
});

const server = http.createServer(app);
const host = 'localhost';
const port = 8000;


server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`)
});
