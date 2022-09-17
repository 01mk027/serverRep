"use strict";
const express = require('express');

const app = express();
const WebSocketServer = require('ws');

const soap = require('strong-soap').soap;
const xmlparser = require('express-xml-bodyparser');
const bodyParser = require('body-parser');
const isLogin = require('./stationMethods');




app.use(express.json());

app.use(isLogin.router);
app.use(xmlparser());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/*
app.get('/wsdl', (req, res, next) => {


})

app.listen(8000, (req, res, next) => {
  console.log("Clone is listening on port 8000");
});
*/
//const wss = new WebSocketServer.Server({ port: 8000});


var http = require('http');




//var app = require('express')();

let server = http.createServer(app).listen(8000, (req, res, next) => {
  console.log("Server is listening on 8000");
  let soapServer = soap.listen(server, '/wsdl', isLogin.CentralSystemService, isLogin.xml);

/*
  soapServer.on('request', (request, methodName) => {
    console.log("REQUEST = ");
    console.log(request);
    console.log("METHODNAME");

  })
*/

  soapServer.authorizeConnection = function(req) {
    // UNUTMA! WEBSOCKET'İ ÇÖZDÜKTEN SONRA MUTLAKA BAK!!!!
    //burada denetleme yapıldıktan sonra yetkilendirme şartları sağlanıyorsa true dönder işi dönsün, şart sağlanmıyorsa false gönder.
    console.log("req = ", req);
    /*
    ## VERİTABANINDAN, KAYITLI 1.5 CİHAZLARIN İPLERİ VE PORTLARI KONTROL EDİLİR, GELEN İP, VERİTABANINDA BULUNAMAZSA FALSE DÖNDERİLİR ##
    let luckyNumber = 1;
    if(Math.floor(Math.random() * 2) === luckyNumber)
      return true; // or false
    else
      return false;
    */
    return true;
  };

  soapServer.on('request', (request, methodName) => {
    console.log("(IN SOAP SERVER) REQUEST = ");
    console.log(request);
    console.log("(IN SOAP SERVER) METHODNAME");
    console.log(methodName);
    return;
  })
  soapServer.log = function(type, data){
    console.log("##### IN SOAP SERVER LOG #####");
    console.log(type, data);
    console.log("##### IN SOAP SERVER LOG #####");
  }


  /*
  !!!!WEBSOCKET HALLEDİLDİKTEN SONRA BURAYA BAKILACAK!!!!
  soapServer.authenticate = function(security) {

    var created, nonce, password, user, token;
    token = security.UsernameToken, user = token.Username,
            password = token.Password, nonce = token.Nonce, created = token.Created;
    return user === 'user' && password === soap.passwordDigest(nonce, created, 'password');

     return false;
  };
  */
  console.log("req out of authorize  = ", req);

});





let WSServer = WebSocketServer.Server;


let wss = new WSServer({
  server: server,
  /*
  verifyClient: function(info, done){
    //Burası, OCPP uygulandıktan sonra halledilecek.
  },
  */
  perMessageDeflate: false
});

isLogin.wsFunc(wss);

/*
wss.on('connection', ws => {
  ws.on('message', message => {
    console.log(`Received message => ${message}`);
  })
  ws.send('Hello! Message From Server!!');
});
*/

//console.log(server);
