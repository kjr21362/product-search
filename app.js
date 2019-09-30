var express = require('express');
var request = require('request');
var myParser = require('body-parser');
var path = require('path');
var cors = require('cors');
var url = require('url');
var app = express();
const port = process.env.PORT || 3000;

var CATEGORY_ID = {
    "art": "550", "baby": "2984", "books": "267", "cloth": "11450",
    "computer": "58058", "health": "26395", "music": "11233", "games": "1249"};

var API_KEY = "Jianxing-csci571h-PRD-6a6d2f14d-9c207d72";
var FACEBOOK_API_KEY = "2305631903040384";
var GOOGLE_API_KEY = "AIzaSyBnJaJ5y2SchXjjwiU5q6NmboSTEqkHHus";
var GOOGLE_ENGINE_KEY = "009655515192552985061:ornpvqilxmi";
var GEONAMES_USERNAME = "kjr21362";
app.use(myParser.json({extended: true}));
app.use(cors());
app.use(express.static('/'));


app.use('/partials', express.static(__dirname + '/partials'));

app.get('/testClick', function (req, res) {
    //console.log("testClick clicked");
    res.sendFile(path.join(__dirname, 'hw8.html'));
});

app.get('/search_results', function (req, res) {
    //console.log("search_results received");
    res.sendFile(path.join(__dirname, 'hw8.html'));
})
    
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'hw8.html'));
});

app.get('/submit-form', (req, res) => {

    res.header("Content-Type", "applications/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    console.clear();
    console.log("submit-form received");
    console.log(req.query);

    var request_url = "http://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsAdvanced&SERVICE-VERSION=1.0.0&SECURITY-APPNAME=" + API_KEY + "&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD&paginationInput.entriesPerPage=50";
    frm_json = req.query;
    var keyword = frm_json["txt_keyword"];
    request_url = request_url + "&keywords=" + keyword;
    if("category" in frm_json && frm_json["category"]){
        var categoryId = CATEGORY_ID[frm_json["category"]];
        request_url = request_url + "&categoryId=" + categoryId;
    }
    request_url = request_url + "&itemFilter(0).name=HideDuplicateItems&itemFilter(0).value=true";

    var filter_idx = 1;
    if (("cb_new" in frm_json && frm_json["cb_new"] == "true") || ("cb_used" in frm_json && frm_json["cb_used"] == "true")
        || ("cb_unspecified" in frm_json && frm_json["cb_unspecified"] == "true")) {
        var cb_idx = 0;
        request_url += "&itemFilter(" + filter_idx + ").name=Condition";
        if("cb_new" in frm_json && frm_json["cb_new"] == "true"){
            request_url += "&itemFilter(" + filter_idx + ").value(" + cb_idx + ")=New";
            cb_idx += 1;
        }
        if ("cb_used" in frm_json && frm_json["cb_used"] == "true") {
            request_url += "&itemFilter(" + filter_idx + ").value(" + cb_idx + ")=Used";
            cb_idx += 1;
        }
        if ("cb_unspecified" in frm_json && frm_json["cb_unspecified"] == "true") {
            request_url += "&itemFilter(" + filter_idx + ").value(" + cb_idx + ")=Unspecified";
            cb_idx += 1;
        }
        filter_idx += 1;
    }
    if ("cb_pickup" in frm_json && frm_json["cb_pickup"] == "true"){
        request_url += "&itemFilter(" + filter_idx + ").name=LocalPickupOnly&itemFilter(" + filter_idx + ").value=true";
        filter_idx += 1;
    }
    if ("cb_freeshipping" in frm_json && frm_json["cb_freeshipping"] == "true") {
        request_url += "&itemFilter(" + filter_idx + ").name=FreeShippingOnly&itemFilter(" + filter_idx + ").value=true";
        filter_idx += 1;
    }

    var dist = 10;
    //
    if ("txt_distance" in frm_json && frm_json["txt_distance"] && /^\d+$/.test(frm_json["txt_distance"])) {
        //console.log(frm_json["txt_distance"]);
        dist = frm_json["txt_distance"];
    }
    var zip = frm_json["txt_default_zip"];
    if(frm_json["rb_zip_code"] == "rb_custom_zip"){
        zip = frm_json["txt_zip"];
    }
    request_url += "&itemFilter(" + filter_idx + ").name=MaxDistance&itemFilter(" + filter_idx + ").value=" + dist + "&buyerPostalCode=" + zip;
    filter_idx += 1;
    request_url += "&outputSelector(0)=SellerInfo&outputSelector(1)=StoreInfo";

    request(request_url, function(err, response, body){
        if(err){
            return console.log(err);
        }
        //console.log(request_url);
        res.send(body);
    });
    //res.send(JSON.stringify({a:1}));
});

app.get('/detail-link', (req, res) => {
    //console.log('server receive detail-link');
    itemId = req.query["itemId"];
    detail_request_url = "http://open.api.ebay.com/shopping?callname=GetSingleItem&responseencoding=JSON&appid=" + API_KEY + "&siteid=0&version=967&ItemID=" + itemId + "&IncludeSelector=Description,Details,ItemSpecifics";
    //console.log(detail_request_url);
    request(detail_request_url, function (err, response, body) {
        if (err) {
            return console.log(err);
        }
        res.send(body);
    });
    //res.send(JSON.stringify({ a: 1 }));
});

app.get('/zip-search', (req, res) => {
    //console.log('server receive zip search');
    searchText = req.query["searchText"];
    zip_request_url = "http://api.geonames.org/postalCodeSearchJSON?postalcode_startsWith=" + searchText + "&username=" + GEONAMES_USERNAME + "&country=US&maxRows=5";
    //console.log(zip_request_url);
    request(zip_request_url, function (err, response, body) {
        if (err) {
            return console.log(err);
        }
        res.send(body);
    })
})

app.get('/google-photo', (req, res) => {
    //console.log('server receive google-photo');
    //console.log(req.query);
    title = req.query["title"];
    google_request_url = "https://www.googleapis.com/customsearch/v1?q=" + encodeURIComponent(title);
    google_request_url += "&cx=" + GOOGLE_ENGINE_KEY + "&imgSize=huge&imgType=news&num=8&searchType=image&key=" + GOOGLE_API_KEY;
    //console.log(google_request_url);
    request(google_request_url, function (err, response, body) {
        if (err) {
            return console.log(err);
        } 
        res.send(body);
    });
});

app.get('/similar-products', (req, res) => {
    //console.log('server receive similar products');
    //console.log('similar request');
    //console.log(req.query);
    itemId = req.query["itemId"];
    similar_request_url = "http://svcs.ebay.com/MerchandisingService?OPERATION-NAME=getSimilarItems&SERVICE-NAME=MerchandisingService&SERVICE-VERSION=1.1.0&CONSUMER-ID=" + API_KEY + "&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD&itemId=" + itemId + "&maxResults=20";
    //console.log(similar_request_url);
    request(similar_request_url, function (err, response, body) {
        if (err) {
            return console.log(err);
        }
        res.send(body);
    });
});

app.listen(port);