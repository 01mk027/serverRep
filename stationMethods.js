const express = require('express');
const soap  = require('strong-soap').soap;
const Promise = require('promise');
const bodyParser = require('body-parser');
const http = require('http');
const moment = require('moment');
const convert = require('xml-js');
const { resourceLimits } = require('worker_threads');
const router = express.Router();
const index = require('./index');
const os = require('os');
const _ = require('lodash');
const { reject } = require('promise');
const { Console } = require('console');
const WebSocket = require('ws');





router.use(bodyParser.json());

var urlencodedParser = bodyParser.urlencoded({ extended: false });

let chargePointErrorCode = [
"ConnectorLockFailure",
"GroundFailure",
"HighTemperature",
"Mode3Error",
"NoError",
"OtherError",
"OverCurrentFailure",
"PowerMeterFailure",
"PowerSwitchFailure",
"ReaderFailure",
"ResetFailure",
"UnderVoltage",
"WeakSignal"
];


let chargePointStatus = [
"Available",
"Occupied",
"Reserved",
"Unavailable",
"Faulted"
];

const isValidTimestamp = (ts) => {
  return (new Date(ts)).getTime() > 0;
}


function isJSON(data) {
  var ret = true;
  try {
     JSON.parse(data);
  }catch(e) {
     ret = false;
  }
  return ret;
}


var CentralSystemService = {
    CentralSystemService: {
        CentralSystemServiceSoap12: {
            Authorize:
                function(data){
                  if(data == null)
                  {
                    throw{
                     Fault: {
                          faultcode: "nullData",
                          faultstring: "Data can't be null or undefined",
                          detail:
                            { authorizeFault:
                              {errorMessage: "Data can't be null or undefined"}
                            }
                        }

                      }
                  }
                   let sampleAuthorizationRequest = `
                   <?xml version="1.0" encoding="UTF-8"?>
                    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
                            xmlns:cs="urn://Ocpp/Cs/2012/06/"
                            xmlns:wsa="http://www.w3.org/2005/08/addressing">
                        <soap:Header>
                            <cs:chargeBoxIdentity soap:mustUnderstand="true">XXX01</cs:chargeBoxIdentity>
                            <wsa:Action soap:mustUnderstand="true">/Authorize</wsa:Action>
                            <wsa:MessageID>123</wsa:MessageID>
                            <wsa:From><wsa:Address>http://from-endpoint</wsa:Address></wsa:From>
                            <wsa:ReplyTo soap:mustUnderstand="true"><wsa:Address>http://www.w3.org/2005/08/addressing/anonymous</wsa:Address></wsa:ReplyTo>
                            <wsa:To soap:mustUnderstand="true"><wsa:Address>http://to-endpoint</wsa:Address></wsa:To>
                        </soap:Header>
                        <soap:Body>
                            <cs:authorizeRequest>
                                <cs:idTag>1234567</cs:idTag>
                            </cs:authorizeRequest>
                        </soap:Body>
                    </soap:Envelope>
                   `;

                   let sampleAuthorizationResponse = `
                   <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
                        <soap:Header/>
                        <soap:Body>
                            <_U>0</_U>
                            <_V>1</_V>
                            <_W>
                                <AuthorizeResponse>
                                    <idTagInfo>
                                        <status>Accepted</status>
                                        <expiryDate>2022-10-08T13:17:39+03:00</expiryDate>
                                        <parentIdTag>PARENT</parentIdTag>
                                    </idTagInfo>
                                </AuthorizeResponse>
                            </_W>
                            <_X/>
                        </soap:Body>
                    </soap:Envelope>
                   `;


                  //let randomNumber = Math.floor(Math.random() * 5);
                    //Blocked, Expired, Invalid cevapları neye göre verilecek -> ? İlker CANKAR Şimdilik cevap olarak (eksik alan olduğunda) Blocked gönderiyorum.
                    let authRespArr = [
                      {
                      AuthorizeResponse:{
                          idTagInfo: {
                              status: 'Accepted',
                              expiryDate:  moment().add(1, 'months').format(),
                              parentIdTag: 'PARENT'
                          }
                      }
                     },
                     {
                      AuthorizeResponse:{
                          idTagInfo: {
                              status: 'Blocked',
                              expiryDate:  moment().add(1, 'months').format(),
                              parentIdTag: 'PARENT'
                          }
                      }
                    },
                    {
                      AuthorizeResponse:{
                          idTagInfo: {
                              status: 'Expired',
                              expiryDate:  moment().add(1, 'months').format(),
                              parentIdTag: 'PARENT'
                          }
                      }
                    },
                    {
                      AuthorizeResponse:{
                          idTagInfo: {
                              status: 'Invalid',
                              expiryDate:  moment().add(1, 'months').format(),
                              parentIdTag: 'PARENT'
                          }
                      }
                    },
                    {
                      AuthorizeResponse:{
                          idTagInfo: {
                              status: 'ConcurrentTx',
                              expiryDate:  moment().add(1, 'months').format(),
                              parentIdTag: 'PARENT'
                          }
                      }
                    }
                    ];

                    return new Promise((resolve, reject) => {

                          if(data ==null || !Object.keys(data).includes('idTag') || (data.idTag && data.idTag.length > 20)){
                               reject(authRespArr[1]);
                          }
                          else{
                            resolve(authRespArr[0]);
                          }
                    })

                },
            BootNotification: function(data){
              if(data == null)
              {
                throw{
                 Fault: {
                      faultcode: "nullData",
                      faultstring: "Data can't be null or undefined",
                      detail:
                        { bootNotificationFault:
                          {errorMessage: "Data can't be null or undefined"}
                        }
                    }

                  }
              }
              let sampleBootNotificationRequest = `
                <?xml version="1.0" encoding="UTF-8"?>
                <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
                        xmlns:cs="urn://Ocpp/Cs/2012/06/"
                        xmlns:wsa="http://www.w3.org/2005/08/addressing">
                    <soap:Header>
                        <cs:chargeBoxIdentity soap:mustUnderstand="true">XXX01</cs:chargeBoxIdentity>
                        <wsa:Action soap:mustUnderstand="true">/BootNotification</wsa:Action>
                        <wsa:MessageID>123</wsa:MessageID>
                        <wsa:From><wsa:Address>http://from-endpoint</wsa:Address></wsa:From>
                        <wsa:ReplyTo soap:mustUnderstand="true"><wsa:Address>http://www.w3.org/2005/08/addressing/anonymous</wsa:Address></wsa:ReplyTo>
                        <wsa:To soap:mustUnderstand="true"><wsa:Address>http://localhost:8000/wsdl</wsa:Address></wsa:To>
                    </soap:Header>
                    <soap:Body>
                        <cs:bootNotificationRequest>
                            <cs:chargeBoxSerialNumber>1234567</cs:chargeBoxSerialNumber>
                            <cs:chargePointModel>YaMubarek</cs:chargePointModel>
                            <cs:chargePointSerialNumber>MAKSO143-55</cs:chargePointSerialNumber>
                            <cs:chargePointVendor>12</cs:chargePointVendor>
                            <cs:firmwareVersion>Maksopus A.Ş.</cs:firmwareVersion>
                            <cs:iccid>DneonLine</cs:iccid>
                            <cs:imsi>ImsiNeci?</cs:imsi>
                            <cs:meterSerialNumber>1234567</cs:meterSerialNumber>
                            <cs:meterType>1234567</cs:meterType>
                        </cs:bootNotificationRequest>
                    </soap:Body>
                </soap:Envelope>
                `;

                let sampleBootNotificationResponse = `
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                  <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
                      <soap:Header/>
                      <soap:Body>
                          <_U>0</_U>
                          <_V>1</_V>
                          <_W>
                              <BootNotificationResponse>
                                  <status>Accepted</status>
                                  <currentTime>2022-09-08T10:19:34.510Z</currentTime>
                                  <heartbeatInterval>60</heartbeatInterval>
                              </BootNotificationResponse>
                          </_W>
                          <_X/>
                      </soap:Body>
                  </soap:Envelope>
                `;

                let randomNumber = Math.floor(Math.random() * 2);
                var message = data.chargeBoxIdentity + ' has just started';

                var notification = {
                    text: message,
                    unread: true,
                    type: 'BootNotification',
                    timestamp: moment().format()
                }

                console.log('[BootNotification] notification: ' + JSON.stringify(notification));

                let bootNotRespArr = [
                  {
                    BootNotificationResponse: {
                        status: 'Accepted',
                        currentTime: new Date().toISOString(),
                        heartbeatInterval: 60
                    }
                 },
                 {
                  BootNotificationResponse: {
                      status: 'Rejected',
                      currentTime: new Date().toISOString(),
                      heartbeatInterval: 60
                  }
                 }
                ];

                return new Promise((resolve, reject) => {
                  //chargePointVendor, chargePointModel
                  if(!Object.keys(data).includes('chargePointVendor') //+
                     || !Object.keys(data).includes('chargePointModel') //+
                     || (data.chargePointVendor && data.chargePointVendor.length > 20) //+
                     || (data.chargePointModel && data.chargePointModel.length > 20) //+
                     || (data.chargeBoxSerialNumber && data.chargeBoxSerialNumber.length > 25)  //+
                     || (data.chargePointSerialNumber && data.chargePointSerialNumber.length > 25)  //+
                     || (data.firmwareVersion && data.firmwareVersion.length > 50) //+
                     || (data.iccid && data.iccid.length > 20) //+
                     || (data.imsi && data.imsi.length > 20)  //+
                     || (data.meterSerialNumber && data.meterSerialNumber.length > 25) //+
                     || (data.meterType && data.meterType.length > 25) //+
                     )
                  {
                      reject(bootNotRespArr[1]);
                  }
                  resolve(bootNotRespArr[0]);

            })
          },
            StartTransaction: function(data){
              if(data == null)
              {
                throw{
                 Fault: {
                      faultcode: "nullData",
                      faultstring: "Data can't be null or undefined",
                      detail:
                        { startTransactionFault:
                          {errorMessage: "Data can't be null or undefined"}
                        }
                    }

                  }
              }
              let sampleStartTransactionRequestInXML = `
              <?xml version="1.0" encoding="UTF-8"?>
                <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
                        xmlns:cs="urn://Ocpp/Cs/2012/06/"
                        xmlns:wsa="http://www.w3.org/2005/08/addressing">
                    <soap:Header>
                        <cs:chargeBoxIdentity soap:mustUnderstand="true">XXX01</cs:chargeBoxIdentity>
                        <wsa:Action soap:mustUnderstand="true">/StartTransaction</wsa:Action>
                        <wsa:MessageID>123</wsa:MessageID>
                        <wsa:From><wsa:Address>http://from-endpoint</wsa:Address></wsa:From>
                        <wsa:ReplyTo soap:mustUnderstand="true"><wsa:Address>http://www.w3.org/2005/08/addressing/anonymous</wsa:Address></wsa:ReplyTo>
                        <wsa:To soap:mustUnderstand="true"><wsa:Address>http://localhost:8000/wsdl</wsa:Address></wsa:To>
                    </soap:Header>
                    <soap:Body>
                        <cs:startTransactionRequest>
                          <cs:connectorId>122</cs:connectorId>
                          <cs:idTag>SampleIDTAG</cs:idTag>
                          <cs:meterStart>844</cs:meterStart>
                          <cs:reservationId>123456</cs:reservationId>
                          <cs:timestamp>1662550826863</cs:timestamp>
                        </cs:startTransactionRequest>
                    </soap:Body>
                </soap:Envelope>
              `;

              let sampleStartTransactionResponse = `
              <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
              <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
                  <soap:Header/>
                  <soap:Body>
                      <_U>0</_U>
                      <_V>1</_V>
                      <_W>
                          <startTransactionResponse>
                              <transactionId>4</transactionId>
                              <idTagInfo>
                                  <status>Accepted</status>
                                  <expiryDate>2022-10-08T13:20:50+03:00</expiryDate>
                                  <parentIdTag>PARENT</parentIdTag>
                              </idTagInfo>
                          </startTransactionResponse>
                      </_W>
                      <_X/>
                  </soap:Body>
              </soap:Envelope>
              `;
              //if(!isValidTimestamp(data.timestamp)) console.log('HOP');
              //Accepted harici cevapların neye dair verileceği sorusunun cevabını alabileceğimiz kişi : İlker CANKAR
                //console.log(data);
                //let randomNumber = Math.floor(Math.random() * 5);
                //console.log(randomNumber);
                let startTransRespArr = [
                  {
                    startTransactionResponse:{
                       transactionId: 4,
                       idTagInfo:{
                        status: "Accepted",
                        expiryDate: moment().add(1, 'months').format(),
                        parentIdTag: 'PARENT'
                       }
                    }
                  },
                  {
                    startTransactionResponse:{
                       transactionId: 4,
                       idTagInfo:{
                        status: "Blocked",
                        expiryDate: moment().add(1, 'months').format(),
                        parentIdTag: 'PARENT'
                       }
                    }
                  },
                  {
                    startTransactionResponse:{
                       transactionId: 4,
                       idTagInfo:{
                        status: "Expired",
                        expiryDate: moment().add(1, 'months').format(),
                        parentIdTag: 'PARENT'
                       }
                    }
                  },
                  {
                    startTransactionResponse:{
                       transactionId: 4,
                       idTagInfo:{
                        status: "Invalid",
                        expiryDate: moment().add(1, 'months').format(),
                        parentIdTag: 'PARENT'
                       }
                    }
                  },
                  {
                    startTransactionResponse:{
                       transactionId: 4,
                       idTagInfo:{
                        status: "ConcurrentTx",
                        expiryDate: moment().add(1, 'months').format(),
                        parentIdTag: 'PARENT'
                       }
                    }
                  }
                ];

                return new Promise((resolve, reject) => {
                  //connectorId, idTag, timestamp, meterStart
                  if(data == null
                     || !Object.keys(data).includes('connectorId')  //+
                     || (data.connectorId && data.connectorId < 0)  //+
                     || !Object.keys(data).includes('idTag')        //+
                     || (data.idTag && data.idTag.length > 20)      //+
                     || !Object.keys(data).includes('timestamp')    //+
                     || (isValidTimestamp(Number(data.timestamp)) === false)
                     || (Number(data.timestamp) > Date.now() + 12000) //Burası tekrar incelenebilir.
                     || (Number(data.timestamp) < Date.now() - 12000) //Burası tekrar incelenebilir.
                     || !Object.keys(data).includes('meterStart')   //+
                     || isNaN(data.connectorId) === true            //+
                     || isNaN(data.meterStart) === true             //+
                     || (data.reservationId && isNaN(data.reservationId) === true)   //+
                     )
                  {
                    reject(startTransRespArr[1]);
                  }
                    resolve(startTransRespArr[0])
                })
            },
            StopTransaction: function(data){
              //console.log(isValidTimestamp(Number(data.transactionData.values.timestamp)));
              if(data == null)
              {
                throw{
                 Fault: {
                      faultcode: "nullData",
                      faultstring: "Data can't be null or undefined",
                      detail:
                        { stopTransactionFault:
                          {errorMessage: "Data can't be null or undefined"}
                        }
                    }

                  }
              }
              let sampleStopTransactionRequest = `
              <?xml version="1.0" encoding="UTF-8"?>
              <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
                      xmlns:cs="urn://Ocpp/Cs/2012/06/"
                      xmlns:wsa="http://www.w3.org/2005/08/addressing">
                  <soap:Header>
                      <cs:chargeBoxIdentity soap:mustUnderstand="true">XXX01</cs:chargeBoxIdentity>
                      <wsa:Action soap:mustUnderstand="true">/StopTransaction</wsa:Action>
                      <wsa:MessageID>123</wsa:MessageID>
                      <wsa:From><wsa:Address>http://from-endpoint</wsa:Address></wsa:From>
                      <wsa:ReplyTo soap:mustUnderstand="true"><wsa:Address>http://www.w3.org/2005/08/addressing/anonymous</wsa:Address></wsa:ReplyTo>
                      <wsa:To soap:mustUnderstand="true"><wsa:Address>http://localhost:8000/wsdl</wsa:Address></wsa:To>
                  </soap:Header>
                  <soap:Body>
                      <cs:stopTransactionRequest>
                        <cs:transactionId>122</cs:transactionId>
                        <cs:idTag>HadiOradan</cs:idTag>
                        <cs:timestamp>1662550826863</cs:timestamp>
                        <cs:meterStop>844</cs:meterStop>
                        <cs:reservationId>123456</cs:reservationId>
                          <cs:transactionData>
                          <cs:values>
                          <cs:timestamp>1662624233503</cs:timestamp>
                          <cs:value  context="Sample.Periodic" format="Raw" measurand="Energy.Active.Import.Register" location="Outlet" unit="Wh">Raw</cs:value>
                          </cs:values>
                        </cs:transactionData>
                      </cs:stopTransactionRequest>
                  </soap:Body>
              </soap:Envelope>
              `;

              let sampleStopTransactionResponse = `
              <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
              <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
                  <soap:Header/>
                  <soap:Body>
                      <_U>0</_U>
                      <_V>1</_V>
                      <_W>
                          <stopTransactionResponse>
                              <idTagInfo>
                                  <status>Accepted</status>
                                  <expiryDate>2022-10-12T11:29:43+03:00</expiryDate>
                                  <parentIdTag>PARENT</parentIdTag>
                              </idTagInfo>
                          </stopTransactionResponse>
                      </_W>
                      <_X/>
                  </soap:Body>
              </soap:Envelope>
              `;

              let acceptableContextTypes = ["Interruption.Begin", "Interruption.End", "Other", "Sample.Clock", "Sample.Periodic", "Transaction.Begin", "Transaction.End"];
              let acceptableFormatTypes = ["Raw", "SignedData"];
              let acceptableMeasurandTypes = [
               "Current.Export", //+
               "Current.Import", //+
               "Energy.Active.Export.Register", //+
               "Energy.Active.Import.Register", //+
               "Energy.Active.Export.Interval", //+
               "Energy.Active.Import.Interval", //+
               "Energy.Reactive.Export.Register", //+
               "Energy.Reactive.Import.Register", //+
               "Energy.Reactive.Export.Interval", //+
               "Energy.Reactive.Import.Interval", //+
               "Power.Active.Export", //+
               "Power.Active.Import", //+
               "Power.Reactive.Export", //+
               "Power.Reactive.Import", //+
               "Temperature", //+
               "Voltage" //+
              ];
              let acceptableLocations = ["Body", "Inlet", "Outlet"];
              let acceptableUnits = ["Wh", "kWh", "varh", "kvarh", "W", "kW", "var", "kvar", "Amp", "Volt", "Celcius"];
              //console.log(data.transactionData.values.value.attributes);//Bu kanaldan konrol sağla... 08/09/2022 11:06
              //Accepted harici cevapların neye dair verileceği sorusunun cevabını alabileceğimiz kişi : İlker CANKAR
                //console.log(data);
                //let randomNumber = Math.floor(Math.random() * 5);
                let olderResponse = {
                  stopTransactionResponse:{
                      status:'Accepted'
                }};

                let stopTransRespArr = [
                  {
                    stopTransactionResponse:{
                    idTagInfo:{
                    status: "Accepted",
                    expiryDate: moment().add(1, 'months').format(),
                    parentIdTag: 'PARENT'
                   }}
                  },
                  {
                    stopTransactionResponse:{
                    idTagInfo:{
                    status: "Blocked",
                    expiryDate: moment().add(1, 'months').format(),
                    parentIdTag: 'PARENT'
                   }}
                  },
                  {stopTransactionResponse:{
                    idTagInfo:{
                    status: "Expired",
                    expiryDate: moment().add(1, 'months').format(),
                    parentIdTag: 'PARENT'
                   }}},
                  {stopTransactionResponse:{
                    idTagInfo:{
                    status: "Invalid",
                    expiryDate: moment().add(1, 'months').format(),
                    parentIdTag: 'PARENT'
                   }}},
                  {stopTransactionResponse:{
                    idTagInfo:{
                    status: "ConcurrentTx",
                    expiryDate: moment().add(1, 'months').format(),
                    parentIdTag: 'PARENT'
                   }}}
                ];

                return new Promise((resolve, reject) => {
                  //transactionId, timestamp, meterStop [1]
                    if(isNaN(data.transactionId) === true               //+
                       || !Object.keys(data).includes('transactionId')  //+
                       || !Object.keys(data).includes('timestamp')      //+
                       || !Object.keys(data).includes('meterStop')      //+
                       || isNaN(data.meterStop) === true                //+
                       || (isValidTimestamp(Number(data.timestamp)) === false)
                       || (Number(data.timestamp) > Date.now() + 12000) //Burası tekrar incelenebilir.
                       || (Number(data.timestamp) < Date.now() - 12000) //Burası tekrar incelenebilir.
                       || (data.idTag && data.idTag.length > 20)        //+
                       || (data.transactionData == undefined)           //+
                       || (data.transactionData.values && !Object.keys(data.transactionData.values).includes('timestamp'))  //+
                       || (isValidTimestamp(data.transactionData.values.timestamp) === false)
                       || (Number(data.transactionData.values.timestamp) > Date.now()) //Burası tekrar incelenebilir.
                       || (Number(data.transactionData.values.timestamp) < Date.now()) //Burası tekrar incelenebilir.
                       || (data.transactionData.values && !Object.keys(data.transactionData.values).includes('value'))      //+
                       || (data.transactionData.values.value.attributes && data.transactionData.values.value.attributes.context && !acceptableContextTypes.includes(data.transactionData.values.value.attributes.context))
                       || (data.transactionData.values.value.attributes && data.transactionData.values.value.attributes.format && !acceptableFormatTypes.includes(data.transactionData.values.value.attributes.format))
                       || (data.transactionData.values.value.attributes && data.transactionData.values.value.attributes.measurand && !acceptableMeasurandTypes.includes(data.transactionData.values.value.attributes.measurand))
                       || (data.transactionData.values.value.attributes && data.transactionData.values.value.attributes.location && !acceptableLocations.includes(data.transactionData.values.value.attributes.location))
                       || (data.transactionData.values.value.attributes && data.transactionData.values.value.attributes.unit && !acceptableUnits.includes(data.transactionData.values.value.attributes.unit))
                       )
                    {
                      reject(stopTransRespArr[1]);
                    }
                    else{
                      resolve(stopTransRespArr[0]);
                    }
                })
            },
            Heartbeat: function(data){
              /*
              if(data == null)
              {
                throw{
                 Fault: {
                      faultcode: "nullData",
                      faultstring: "Data can't be null or undefined",
                      detail:
                        { heartbeatFault:
                          {errorMessage: "Data can't be null or undefined"}
                        }
                    }

                  }
              }
              */
              let sampleHeartbeatRequest = `
              <?xml version="1.0" encoding="UTF-8"?>
              <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
                      xmlns:cs="urn://Ocpp/Cs/2012/06/"
                      xmlns:wsa="http://www.w3.org/2005/08/addressing">
                  <soap:Header>
                      <cs:chargeBoxIdentity soap:mustUnderstand="true">XXX01</cs:chargeBoxIdentity>
                      <wsa:Action soap:mustUnderstand="true">/Heartbeat</wsa:Action>
                      <wsa:MessageID>123</wsa:MessageID>
                      <wsa:From><wsa:Address>http://from-endpoint</wsa:Address></wsa:From>
                      <wsa:ReplyTo soap:mustUnderstand="true"><wsa:Address>http://www.w3.org/2005/08/addressing/anonymous</wsa:Address></wsa:ReplyTo>
                      <wsa:To soap:mustUnderstand="true"><wsa:Address>http://localhost:8000/wsdl</wsa:Address></wsa:To>
                  </soap:Header>
                  <soap:Body>
                      <cs:heartbeatRequest>

                      </cs:heartbeatRequest>
                  </soap:Body>
              </soap:Envelope>
              `;

              let sampleHeartbeatResponse = `
              <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
              <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
                  <soap:Header/>
                  <soap:Body>
                      <_U>0</_U>
                      <_V>1</_V>
                      <_W>
                          <hearbeatResponse>
                              <currentTime>2022-09-08T10:48:22.379Z</currentTime>
                          </hearbeatResponse>
                      </_W>
                      <_X/>
                  </soap:Body>
              </soap:Envelope>
              `;

              //Detaylı bakılacak, gelen istek boş mu değil mi kontrolü yapılabilir, tayin edilebilir, şimdilik boş bırakıyorum.
                return new Promise((resolve, reject) => {
                    resolve({
                        hearbeatResponse:{
                            currentTime: new Date().toISOString()
                        }
                    })
                })
            },
            MeterValues: function(data){
              //console.log("INMETERVALUES");

              //let datee = new Date(Number(data.values.timestamp));
              //console.log(isValidTimestamp(Number(data.values.timestamp)));
              if(data == null)
              {
                throw{
                 Fault: {
                      faultcode: "nullData",
                      faultstring: "Data can't be null or undefined",
                      detail:
                        { meterValuesFault:
                          {errorMessage: "Data can't be null or undefined"}
                        }
                    }

                  }
              }
              console.log(">>>>>INMETERVALUES<<<<<");

              let sampleMeterValuesRequest = `
              <?xml version="1.0" encoding="UTF-8"?>
                <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
                        xmlns:cs="urn://Ocpp/Cs/2012/06/"
                        xmlns:wsa="http://www.w3.org/2005/08/addressing">
                    <soap:Header>
                        <cs:chargeBoxIdentity soap:mustUnderstand="true">XXX01</cs:chargeBoxIdentity>
                        <wsa:Action soap:mustUnderstand="true">/MeterValues</wsa:Action>
                        <wsa:MessageID>123</wsa:MessageID>
                        <wsa:From><wsa:Address>http://from-endpoint</wsa:Address></wsa:From>
                        <wsa:ReplyTo soap:mustUnderstand="true"><wsa:Address>http://www.w3.org/2005/08/addressing/anonymous</wsa:Address></wsa:ReplyTo>
                        <wsa:To soap:mustUnderstand="true"><wsa:Address>http://localhost:8000/wsdl</wsa:Address></wsa:To>
                    </soap:Header>
                    <soap:Body>
                        <cs:meterValuesRequest>
                          <cs:connectorId>385</cs:connectorId>
                          <cs:transactionId>158</cs:transactionId>
                           <cs:values>
                            <cs:timestamp>1662635629385</cs:timestamp>
                            <cs:value context="Sample.Periodic" format="Raw" measurand="Energy.Active.Import.Register" location="Outlet" unit="Wh"/>
                          </cs:values>
                        </cs:meterValuesRequest>
                    </soap:Body>
                </soap:Envelope>
              `;

              let sampleMeterValuesResponse = `
              <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
              <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
                  <soap:Header/>
                  <soap:Body>
                      <_U>0</_U>
                      <_V>1</_V>
                      <_W>
                          <MeterValuesResponse/>
                      </_W>
                      <_X/>
                  </soap:Body>
              </soap:Envelope>
              `; // No fields are defined


              let acceptableContextTypes = ["Interruption.Begin", "Interruption.End", "Other", "Sample.Clock", "Sample.Periodic", "Transaction.Begin", "Transaction.End"];
              let acceptableFormatTypes = ["Raw", "SignedData"];
              let acceptableMeasurandTypes = [
               "Current.Export", //+
               "Current.Import", //+
               "Energy.Active.Export.Register", //+
               "Energy.Active.Import.Register", //+
               "Energy.Active.Export.Interval", //+
               "Energy.Active.Import.Interval", //+
               "Energy.Reactive.Export.Register", //+
               "Energy.Reactive.Import.Register", //+
               "Energy.Reactive.Export.Interval", //+
               "Energy.Reactive.Import.Interval", //+
               "Power.Active.Export", //+
               "Power.Active.Import", //+
               "Power.Reactive.Export", //+
               "Power.Reactive.Import", //+
               "Temperature", //+
               "Voltage" //+
              ];
              let acceptableLocations = ["Body", "Inlet", "Outlet"];
              let acceptableUnits = ["Wh", "kWh", "varh", "kvarh", "W", "kW", "var", "kvar", "Amp", "Volt", "Celcius"];
                return new Promise((resolve, reject) => {
                  //Örnekteki cevaplar boş. İlker CANKAR cevap uydur dedi (Ahmet, Hasan, Mahmut vs.). Uyduruyorum, eksik parametre geldiğinde farklı cevap dönderecek, tam parametrede farklı mesaj gönderecek.
                  let olderResponse ={
                    MeterValuesResponse:{
                    }
                  };

                  let sampleMeterValueResponseArray = [
                    {
                      MeterValuesResponse:{
                        status: "Accepted"
                      }
                    },
                    {
                      MeterValuesResponse:{
                        status:"Error will be implemented"
                      }
                    }
                  ];
                    if(!Object.keys(data).includes('connectorId')
                       || isNaN(data.connectorId) === true //+
                       || (data && data.connectorId < 0) //+
                       || (data.values && !data.values.timestamp)//+
                       || (isValidTimestamp(Number(data.values.timestamp)) === false)
                       || (Number(data.values.timestamp) > Date.now() + 12000)
                       || (Number(data.values.timestamp) < Date.now() - 12000)//Burası tekrar incelenebilir...
                       || (data.values && !data.values.value)
                       || (data.values.value.attributes && data.values.value.attributes.context && !acceptableContextTypes.includes(data.values.value.attributes.context))
                       || (data.values.value.attributes && data.values.value.attributes.format && !acceptableFormatTypes.includes(data.values.value.attributes.format))
                       || (data.values.value.attributes && data.values.value.attributes.measurand && !acceptableMeasurandTypes.includes(data.values.value.attributes.measurand))
                       || (data.values.value.attributes && data.values.value.attributes.location && !acceptableLocations.includes(data.values.value.attributes.location))
                       || (data.values.value.attributes && data.values.value.attributes.unit && !acceptableUnits.includes(data.values.value.attributes.unit))
                       )
                    {
                      reject(sampleMeterValueResponseArray[1]);
                    }
                    else{
                      resolve(olderResponse);
                    }

                })
            },
            StatusNotification: function(data){
              if(data == null)
              {
                throw{
                 Fault: {
                      faultcode: "nullData",
                      faultstring: "Data can't be null or undefined",
                      detail:
                        { statusNotificationFault:
                          {errorMessage: "Data can't be null or undefined"}
                        }
                    }

                  }
              }
              let sampleStatusNotificationRequest = `
              <?xml version="1.0" encoding="UTF-8"?>
              <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
                      xmlns:cs="urn://Ocpp/Cs/2012/06/"
                      xmlns:wsa="http://www.w3.org/2005/08/addressing">
                  <soap:Header>
                      <cs:chargeBoxIdentity soap:mustUnderstand="true">XXX01</cs:chargeBoxIdentity>
                      <wsa:Action soap:mustUnderstand="true">/StatusNotification</wsa:Action>
                      <wsa:MessageID>123</wsa:MessageID>
                      <wsa:From><wsa:Address>http://from-endpoint</wsa:Address></wsa:From>
                      <wsa:ReplyTo soap:mustUnderstand="true"><wsa:Address>http://www.w3.org/2005/08/addressing/anonymous</wsa:Address></wsa:ReplyTo>
                      <wsa:To soap:mustUnderstand="true"><wsa:Address>http://localhost:8000/wsdl</wsa:Address></wsa:To>
                  </soap:Header>
                  <soap:Body>
                      <cs:statusNotificationRequest>
                       <cs:connectorId>34</cs:connectorId>
                       <cs:errorCode>ConnectorLockFailure</cs:errorCode>
                       <cs:info>SampleInfo</cs:info>
                       <cs:status>Available</cs:status>
                       <cs:timestamp>123456789</cs:timestamp>
                       <cs:vendorId>MAKSOPUS1789</cs:vendorId>
                       <cs:vendorError>31</cs:vendorError>
                      </cs:statusNotificationRequest>
                  </soap:Body>
              </soap:Envelope>
              `;

              let sampleStatusNotificationResponse = `
              <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
              <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
                  <soap:Header/>
                  <soap:Body>
                      <_U>0</_U>
                      <_V>1</_V>
                      <_W/>
                      <_X/>
                  </soap:Body>
              </soap:Envelope>
              `; //No fields are defined.

              //Örnekteki cevaplar boş. İlker CANKAR cevap uydur dedi (Ahmet, Hasan, Mahmut vs.). Uyduruyorum, eksik parametre geldiğinde farklı cevap dönderecek, tam parametrede farklı mesaj gönderecek.
              let acceptableStatus = ['Available', 'Occupied', 'Reserved', 'Unavailable'];
              let acceptableErrorCodes = ['ConnectorLockFailure', 'GroundFailure', 'HighTemperature', 'Mode3Error', 'NoError', 'OtherError', 'OverCurrentFailure', 'PowerMeterFailure',
                                          'PowerSwitchFailure', 'ReaderFailure', 'ResetFailure', 'UnderVoltage', 'WeakSignal'];


              let olderResponse = {
                StatusNotificationResponse:{}
               };

              let sampleStatusNotificationRequestArray = [
                {
                  StatusNotificationResponse:{
                    status:"Error will be implemented"
                  }
                },
                {
                  StatusNotificationResponse:{
                    status:"NoError will be implemented"
                  }
                }
              ];

                //console.log(data.connectorId);
                return new Promise((resolve, reject) => {
                    if(data === undefined || data == null)
                    {
                      reject(sampleStatusNotificationRequestArray[0]);
                    } //connectorId, status, errorCode
                    else if(isNaN(data.connectorId) === true
                            || (!data.connectorId)
                            || (data && data.connectorId < 0)
                            || (!data.status)
                            || (!data.errorCode)
                            || (data && !chargePointErrorCode.includes(data.errorCode))
                            || (data && !chargePointStatus.includes(data.status))
                            || (data.info && data.info.length > 50)
                            || (data.vendorId && data.vendorId.length > 255)
                            || (data.vendorErrorCode && data.vendorErrorCode.length > 50)
                          )
                    {
                      reject(sampleStatusNotificationRequestArray[0]);
                    }
                    let notification = {
                        station: {
                          endpoint: data.endpoint,
                          chargeBoxIdentity: data.chargeBoxIdentity
                        },
                        text: 'Status Notification Update',
                        unread: true,
                        type: 'StatusNotification',
                        timestamp: data.timestamp,
                        status: data.status,
                        connectorId: data.connectorId,
                        errorCode: data.errorCode
                      };
                      console.log("...:::VERİTABANINA KAYDEDİLECEK:::...");
                      console.log(notification);
                    resolve({});
                })
            },
            FirmwareStatusNotification: function(data){
              if(data == null)
              {
                throw{
                 Fault: {
                      faultcode: "nullData",
                      faultstring: "Data can't be null or undefined",
                      detail:
                        { firmwareStatusNotificationFault:
                          {errorMessage: "Data can't be null or undefined"}
                        }
                    }

                  }
              }

              let sampleFirmwareStausNotificationRequest = `<?xml version="1.0" encoding="UTF-8"?>
              <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
                      xmlns:cs="urn://Ocpp/Cs/2012/06/"
                      xmlns:wsa="http://www.w3.org/2005/08/addressing">
                  <soap:Header>
                      <cs:chargeBoxIdentity soap:mustUnderstand="true">XXX01</cs:chargeBoxIdentity>
                      <wsa:Action soap:mustUnderstand="true">/FirmwareStatusNotification</wsa:Action>
                      <wsa:MessageID>123</wsa:MessageID>
                      <wsa:From><wsa:Address>http://from-endpoint</wsa:Address></wsa:From>
                      <wsa:ReplyTo soap:mustUnderstand="true"><wsa:Address>http://www.w3.org/2005/08/addressing/anonymous</wsa:Address></wsa:ReplyTo>
                      <wsa:To soap:mustUnderstand="true"><wsa:Address>http://localhost:8000/wsdl</wsa:Address></wsa:To>
                  </soap:Header>
                  <soap:Body>
                      <cs:firmwareStatusNotificationRequest>
                        <cs:status>Downloaded</cs:status>
                        </cs:firmwareStatusNotificationRequest>
                  </soap:Body>
              </soap:Envelope>`;

              let sampleFirmwareStatusNotificationResponse = `
              <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
              <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
                  <soap:Header/>
                  <soap:Body>
                      <_U>0</_U>
                      <_V>1</_V>
                      <_W/>
                      <_X/>
                  </soap:Body>
              </soap:Envelope>
              `;//No field is defined


              let acceptableTypes = ["Downloaded", "DownloadFailed", "InstallationFailed", "Installed"];
              let firmwareStatusNotificationResponseArray = [
                {
                  status:"ErrorWillBeImplemented"
                },
                {

                }
              ];
                return new Promise((resolve, reject) => {
                       console.log("<<>>",data);
                       if(data === undefined || data == null){
                         reject(firmwareStatusNotificationResponseArray[0]);
                       }
                       else if((!data.status) || !acceptableTypes.includes(data.status))
                       {
                         reject(firmwareStatusNotificationResponseArray[0]);
                       }
                       else
                       {
                        resolve(firmwareStatusNotificationResponseArray[1]);
                       }
                })
            },
            DiagnosticsStatusNotification: function(data){
              if(data == null)
              {
                throw{
                 Fault: {
                      faultcode: "nullData",
                      faultstring: "Data can't be null or undefined",
                      detail:
                        { diagnosticsStatusNotificationFault:
                          {errorMessage: "Data can't be null or undefined"}
                        }
                    }

                  }
              }
              console.log(data);
              //console.log(Object.keys(data).includes('status'));
              let sampleDiagnosticsStatusNotificationRequest = `
                    <?xml version="1.0" encoding="UTF-8"?>
                    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
                            xmlns:cs="urn://Ocpp/Cs/2012/06/"
                            xmlns:wsa="http://www.w3.org/2005/08/addressing">
                        <soap:Header>
                            <cs:chargeBoxIdentity soap:mustUnderstand="true">XXX01</cs:chargeBoxIdentity>
                            <wsa:Action soap:mustUnderstand="true">/DiagnosticsStatusNotification</wsa:Action>
                            <wsa:MessageID>123</wsa:MessageID>
                            <wsa:From><wsa:Address>http://from-endpoint</wsa:Address></wsa:From>
                            <wsa:ReplyTo soap:mustUnderstand="true"><wsa:Address>http://www.w3.org/2005/08/addressing/anonymous</wsa:Address></wsa:ReplyTo>
                            <wsa:To soap:mustUnderstand="true"><wsa:Address>http://localhost:8000/wsdl</wsa:Address></wsa:To>
                        </soap:Header>
                        <soap:Body>
                            <cs:diagnosticsStatusNotificationRequest>
                              <cs:status>Uploaded</cs:status>
                              </cs:diagnosticsStatusNotificationRequest>
                        </soap:Body>
                    </soap:Envelope>
              `;

              let sampleDiagnosticsStatusNotificationResponse = `
              <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
              <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
                  <soap:Header/>
                  <soap:Body>
                      <_U>0</_U>
                      <_V>1</_V>
                      <_W/>
                      <_X/>
                  </soap:Body>
              </soap:Envelope>
              `;
                return new Promise((resolve, reject) => {
                    //data.unread = true;
                    /*console.log("Yukarıdaki satırda yer alan işlem tatbik edilip notifications tablosuna (veya başka bir yere) kaydedeilecek.");
                    console.log(data);
                    resolve({});*/
                    let acceptableTypes = ["Uploaded", "UploadFailed"];
                    if((data == null) || (!data.status) || !acceptableTypes.includes(data.status)){
                      reject({
                        status:"ErrorWillBeImplemented"//Kendim uydurdum. Bakılacak.
                      });
                    }
                    else{
                    resolve({});
                    }
                })
            },
            DataTransfer: function(data){
              if(data == null)
              {
                throw{
                 Fault: {
                      faultcode: "nullData",
                      faultstring: "Data can't be null or undefined",
                      detail:
                        { dataTransferFault:
                          {errorMessage: "Data can't be null or undefined"}
                        }
                    }

                  }
              }
              //UnknownVendorId ve UnknownMessageId yanıtları neye göre dönecek -> İlker CANKAR
                let sampleDataTransferRequest = `
                <?xml version="1.0" encoding="UTF-8"?>
                <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
                        xmlns:cs="urn://Ocpp/Cs/2012/06/"
                        xmlns:wsa="http://www.w3.org/2005/08/addressing">
                    <soap:Header>
                        <cs:chargeBoxIdentity soap:mustUnderstand="true">XXX01</cs:chargeBoxIdentity>
                        <wsa:Action soap:mustUnderstand="true">/DataTransfer</wsa:Action>
                        <wsa:MessageID>123</wsa:MessageID>
                        <wsa:From><wsa:Address>http://from-endpoint</wsa:Address></wsa:From>
                        <wsa:ReplyTo soap:mustUnderstand="true"><wsa:Address>http://www.w3.org/2005/08/addressing/anonymous</wsa:Address></wsa:ReplyTo>
                        <wsa:To soap:mustUnderstand="true"><wsa:Address>http://localhost:8000/wsdl</wsa:Address></wsa:To>
                    </soap:Header>
                    <soap:Body>
                        <cs:dataTransferRequest>
                          <cs:vendorId>12a85</cs:vendorId>
                          <cs:messageId>185</cs:messageId>
                          <cs:data>RabotaArtilleryXarasho</cs:data>
                          </cs:dataTransferRequest>
                    </soap:Body>
                </soap:Envelope>
                `;

                let sampleDataTransferResponse = `
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
                    <soap:Header/>
                    <soap:Body>
                        <_U>0</_U>
                        <_V>1</_V>
                        <_W>
                            <status>Accepted</status>
                            <data>AnyData</data>
                        </_W>
                        <_X/>
                    </soap:Body>
                </soap:Envelope>
                `;


                let olderResponse = {
                  currentTime: new Date().toISOString()
                };

                let dataTransferResponseArray = [
                  {
                    status: "Accepted",
                    data: "AnyData"
                  },
                  {
                    status: "Rejected",
                    data: "AnyData"
                  },
                  {
                    status: "UnknownMessageId",
                    data: "AnyData"
                  },
                  {
                    status:"UnknownVendorId",
                    data: "AnyData"
                  }
                ];



                return new Promise((resolve, reject) => {

                  //console.log(Number.isInteger(+data.vendorId));
                  //console.log("is data.vendorId type integer", Number.isInteger(+data.vendorId));


                  if((data == null)
                     || (!data.vendorId)
                     || (data.vendorId && data.vendorId.length > 255)
                     || (data.messageId && data.messageId.length > 50)
                    )
                  {
                    reject(dataTransferResponseArray[1]);
                  }
                  else{
                    resolve(dataTransferResponseArray[0]);
                  }

                    //process.name = "DataTransfer";
                })
            }
        }
    }
};


//var xml = require('fs').readFileSync('centralsystem.wsdl', 'utf8');
var xml = require('fs').readFileSync('centralsystem.wsdl', 'utf8');


let ownIp = 'http://44.201.178.41:8000/';
let clientIp = 'http://18.212.194.189:8001/';


/*
let ownIp = 'http://184.72.207.45:8000/';
let clientIp = 'http://3.89.102.141:8001/';
*/




function clientPromise(stationId, remoteAddress, actionName){

  return new Promise((resolve, reject) => {
      soap.createClient(`${remoteAddress}?wsdl`, {forceSoap12Headers: true}, function(error, client){
          if(error)
          {
               reject(error);
               console.log(error);
          }
          else if(client){
            client.addSoapHeader('<h:chargeBoxIdentity xmlns:h="urn://Ocpp/Cp/2012/06/" >'+ stationId + '</h:chargeBoxIdentity>');
            client.addSoapHeader('<a:MessageID>urn:uuid:' + "uuid4" + '</a:MessageID>');
            client.addSoapHeader(`<a:From><a:Address>${ownIp}wsdl</a:Address></a:From>`);
            client.addSoapHeader('<a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>');
            //client.addSoapHeader('<a:To>'+ 'http://localhost:8001/wsdl' + '</a:To>');
            client.addSoapHeader('<a:To>' + remoteAddress +'</a:To>');
            client.addSoapHeader('<a:Action soap:mustUnderstand="1">'+ `/${actionName}` +'</a:Action>');

            resolve(client);

          }
      })
  })};




  //clientPromise("http://localhost:8001/wsdl", "http://localhost:8001/wsdl", "Reset").then(res => console.log(res.describe()));






///////////////////////////////////// UNLOCKCONNECTOR //////////////////////////////////////////////////////////////////////////////////////////////////////////////

var unlockConnectorRequest = {
    unlockConnectorRequest: {
      connectorId: 27
    }
  };

///////////////////////////////////// UNLOCKCONNECTOR //////////////////////////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////// RESET /////////////////////////////////////////////////////////////////////
var request2 = {
    resetRequest: {
        type: "Soft"  //Hard, Soft
    }
};

/*
function getResetResult(stationId, remoteAddress, args, callback){
  soap.createClient('http://localhost:8001/wsdl?wsdl', {forceSoap12Headers: true}, function(error, client){
    if(error)
      console.log(error);



    client.addSoapHeader('<h:chargeBoxIdentity xmlns:h="urn://Ocpp/Cp/2012/06/" >'+ stationId + '</h:chargeBoxIdentity>');
    client.addSoapHeader('<a:MessageID>urn:uuid:' + "uuid4" + '</a:MessageID>');
    client.addSoapHeader('<a:From><a:Address>http://localhost:8000/wsdl</a:Address></a:From>');
    client.addSoapHeader('<a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>');
    //client.addSoapHeader('<a:To>'+ 'http://localhost:8001/wsdl' + '</a:To>');
    client.addSoapHeader('<a:To>' + remoteAddress +'</a:To>');
    client.addSoapHeader('<a:Action soap:mustUnderstand="1">'+ '/Reset' +'</a:Action>');

    client.Reset(args).then(function(data){
        callback(data);
    });

  })
}
*/
/*
getResetResult(request2, function(result){
    console.log("Inside second client req.");
    console.log(result);
});
*/
/////////////////////////////////////////////////// RESET /////////////////////////////////////////////////////////////////////



/////////////////////////////////////////////////// CHANGE AVAILABILITY /////////////////////////////////////////////////////////////////////

var changeAvailabilityRequest= {
    changeAvailabilityRequest: {
        connectorId: 8,
        type: 'Operative'
    }
  }

/*
function changeAvailability(stationId, remoteAddress, args, callback)
{
   soap.createClient('http://localhost:8001/wsdl?wsdl', {forceSoap12Headers: true}, function (error, client){
    if(error)
      console.log(error);
      client.addSoapHeader('<h:chargeBoxIdentity xmlns:h="urn://Ocpp/Cp/2012/06/" >'+ stationId + '</h:chargeBoxIdentity>');
      client.addSoapHeader('<a:MessageID>urn:uuid:' + "uuid4" + '</a:MessageID>');
      client.addSoapHeader('<a:From><a:Address>http://localhost:8000/wsdl</a:Address></a:From>');
      client.addSoapHeader('<a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>');
      //client.addSoapHeader('<a:To>'+ 'http://localhost:8001/wsdl' + '</a:To>');
      client.addSoapHeader('<a:To>' + remoteAddress + '</a:To>');
      client.addSoapHeader('<a:Action soap:mustUnderstand="1">'+ '/ChangeAvailability' +'</a:Action>');

      client.ChangeAvailability(args).then(function(data){
        callback(data);
      })
      //console.log(client.describe());
   })
}
*/
/////////////////////////////////////////////////// CHANGE AVAILABILITY /////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////// GET DIAGNOSTICS /////////////////////////////////////////////////////////////////////////

let getDiagnosticsRequest = {
  getDiagnosticsRequest:{
    location: `${clientIp}wsdl`,
    startTime: moment(),
    stopTime: moment().add(30, 'minutes'),
    retries: 30,
    retryInterval: 30
  }
};

/*
function getDiagnostics(stationId, remoteAddress, args, callback)
{
    soap.createClient('http://localhost:8001/wsdl?wsdl', {forceSoap12Headers: true}, function (error, client){
        if(error)
          console.log(error);
          client.addSoapHeader('<h:chargeBoxIdentity xmlns:h="urn://Ocpp/Cp/2012/06/" >'+ stationId + '</h:chargeBoxIdentity>');
          client.addSoapHeader('<a:MessageID>urn:uuid:' + "uuid4" + '</a:MessageID>');
          client.addSoapHeader('<a:From><a:Address>http://localhost:8000/wsdl</a:Address></a:From>');
          client.addSoapHeader('<a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>');
          //client.addSoapHeader('<a:To>'+ 'http://localhost:8001/wsdl' + '</a:To>');
          client.addSoapHeader('<a:To>' + remoteAddress + '</a:To>');
          client.addSoapHeader('<a:Action soap:mustUnderstand="1">'+ '/GetDiagnostics' +'</a:Action>');

          client.GetDiagnostics(args).then(function(data){
            callback(data);
          })
          //console.log(client.describe());
       })
    }
*/
////////////////////////////////////////////////// GET DIAGNOSTICS /////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////// CLEARCACHE //////////////////////////////////////////////////////////////////////////////

let clearCacheRequest = {
  clearCacheRequest:{}
};

/*
function clearCache(stationId, remoteAddress, args, callback)
{
    soap.createClient('http://localhost:8001/wsdl?wsdl', {forceSoap12Headers: true}, function (error, client){
        if(error)
          console.log(error);
          client.addSoapHeader('<h:chargeBoxIdentity xmlns:h="urn://Ocpp/Cp/2012/06/" >'+ stationId + '</h:chargeBoxIdentity>');
          client.addSoapHeader('<a:MessageID>urn:uuid:' + "uuid4" + '</a:MessageID>');
          client.addSoapHeader('<a:From><a:Address>http://localhost:8000/wsdl</a:Address></a:From>');
          client.addSoapHeader('<a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>');
          //client.addSoapHeader('<a:To>'+ 'http://localhost:8001/wsdl' + '</a:To>');
          client.addSoapHeader('<a:To>'+ remoteAddress + '</a:To>');
          client.addSoapHeader('<a:Action soap:mustUnderstand="1">'+ '/ClearCache' +'</a:Action>');

          client.GetDiagnostics(args).then(function(data){
            callback(data);
          })
          //console.log(client.describe());
       })

}
*/
///////////////////////////////////////////////// CLEARCACHE //////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////// UPDATEFIRMWARE //////////////////////////////////////////////////////////////////////////////

let updateFirmwareRequest = {
  updateFirmwareRequest:{
    //retrieveDate: Date.now(),
    location: `${clientIp}wsdl`,//Bellenimin alınacağı adres. (Firmware nereden alınacaksa oranın adresi.)
    retries: 300,
    retryInterval: 2500
  }
};

/*
function updateFirmware(stationId, remoteAddress, args, callback)
{
    soap.createClient('http://localhost:8001/wsdl?wsdl', {forceSoap12Headers: true}, function (error, client){
        if(error)
          console.log(error);
          client.addSoapHeader('<h:chargeBoxIdentity xmlns:h="urn://Ocpp/Cp/2012/06/" >'+ stationId + '</h:chargeBoxIdentity>');
          client.addSoapHeader('<a:MessageID>urn:uuid:' + "uuid4" + '</a:MessageID>');
          client.addSoapHeader('<a:From><a:Address>http://localhost:8000/wsdl</a:Address></a:From>');
          client.addSoapHeader('<a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>');
          //client.addSoapHeader('<a:To>'+ 'http://localhost:8001/wsdl' + '</a:To>');
          client.addSoapHeader('<a:To>'+ remoteAddress + '</a:To>');
          client.addSoapHeader('<a:Action soap:mustUnderstand="1">'+ '/UpdateFirmware' +'</a:Action>');

          client.UpdateFirmware(args).then(function(data){
            callback(data);
          })
          //console.log(client.describe());
       })
}
*/
///////////////////////////////////////////////// UPDATEFIRMWARE //////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////// CHANGECONFIGURATION //////////////////////////////////////////////////////////////////////////////

let changeConfigurationRequest = {
  changeConfigurationRequest:{
    key: "Anahtar",
    value: "Değer"
  }
};

/*
function changeConfiguration(stationId, remoteAddress, args, callback)
{
    soap.createClient('http://localhost:8001/wsdl?wsdl', {forceSoap12Headers: true}, function (error, client){
        if(error)
          console.log(error);
          client.addSoapHeader('<h:chargeBoxIdentity xmlns:h="urn://Ocpp/Cp/2012/06/" >'+ stationId + '</h:chargeBoxIdentity>');
          client.addSoapHeader('<a:MessageID>urn:uuid:' + "uuid4" + '</a:MessageID>');
          client.addSoapHeader('<a:From><a:Address>http://localhost:8000/wsdl</a:Address></a:From>');
          client.addSoapHeader('<a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>');
          //client.addSoapHeader('<a:To>'+ 'http://localhost:8001/wsdl' + '</a:To>');
          client.addSoapHeader('<a:To>'+ remoteAddress + '</a:To>');
          client.addSoapHeader('<a:Action soap:mustUnderstand="1">'+ '/ChangeConfiguration' +'</a:Action>');

          client.UpdateFirmware(args).then(function(data){
            callback(data);
          })
          //console.log(client.describe());
       })
}
*/
///////////////////////////////////////////////// CHANGECONFIGURATION //////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////// REMOTESTARTTRANSACTION //////////////////////////////////////////////////////////////////////////////

  let remoteStartTransactionRequest = {
    remoteStartTransactionRequest:{
        idTag: 'Sample ID Tag',
        connectorId: 25874
    }
  };

  let faultedRemoteStartTransactionRequest = {
    remoteStartTransactionRequest:{
      idTag:'BuOldukcaUzunBirIDTAGAtsanAtılmazSatsanSatılmazAdetaBirBasBelasiEldeAvuctaDurmaz',
      connectorId: 25874
    }
  };

/*
  function remoteStartTransaction(stationId, remoteAddress, args, callback)
  {
      soap.createClient('http://localhost:8001/wsdl?wsdl', {forceSoap12Headers: true}, function (error, client){
          if(error)
            console.log(error);
            client.addSoapHeader('<h:chargeBoxIdentity xmlns:h="urn://Ocpp/Cp/2012/06/" >'+ stationId + '</h:chargeBoxIdentity>');
            client.addSoapHeader('<a:MessageID>urn:uuid:' + "uuid4" + '</a:MessageID>');
            client.addSoapHeader('<a:From><a:Address>http://localhost:8000/wsdl</a:Address></a:From>');
            client.addSoapHeader('<a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>');
            //client.addSoapHeader('<a:To>'+ 'http://localhost:8001/wsdl' + '</a:To>');
            client.addSoapHeader('<a:To>'+ remoteAddress + '</a:To>');
            client.addSoapHeader('<a:Action soap:mustUnderstand="1">'+ '/RemoteStartTransaction' +'</a:Action>');

            client.RemoteStartTransaction(args).then(function(data){
              callback(data);
            })
            //console.log(client.describe());
         })
  }
*/
///////////////////////////////////////////////// REMOTESTARTTRANSACTION //////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////// REMOTESTOPTRANSACTION //////////////////////////////////////////////////////////////////////////////

let remoteStopTransactionRequest = {
  remoteStopTransactionRequest: {
    transactionId: 2258
  }
};

let faultedRemoteStopTransactionRequest = {
  remoteStopTransactionRequest: {
    transactionId: 'GurbetTreni'
  }
};

/*
function remoteStopTransaction(stationId, remoteAddress, args, callback)
{
    soap.createClient('http://localhost:8001/wsdl?wsdl', {forceSoap12Headers: true}, function (error, client){
        if(error)
          console.log(error);
          client.addSoapHeader('<h:chargeBoxIdentity xmlns:h="urn://Ocpp/Cp/2012/06/" >'+ stationId + '</h:chargeBoxIdentity>');
          client.addSoapHeader('<a:MessageID>urn:uuid:' + "uuid4" + '</a:MessageID>');
          client.addSoapHeader('<a:From><a:Address>http://localhost:8000/wsdl</a:Address></a:From>');
          client.addSoapHeader('<a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>');
          //client.addSoapHeader('<a:To>'+ 'http://localhost:8001/wsdl' + '</a:To>');
          client.addSoapHeader('<a:To>'+ remoteAddress + '</a:To>');
          client.addSoapHeader('<a:Action soap:mustUnderstand="1">'+ '/RemoteStopTransaction' +'</a:Action>');

          client.RemoteStopTransaction(args).then(function(data){
            callback(data);
          })
          //console.log(client.describe());
       })
}
*/
///////////////////////////////////////////////// REMOTESTOPTRANSACTION //////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////// CANCELRESERVATION //////////////////////////////////////////////////////////////////////////////

let cancelReservationRequest = {
    cancelReservationRequest: {
        reservationId: 43
    }
};

/*
function cancelReservation(stationId, remoteAddress, args, callback){
    soap.createClient('http://localhost:8001/wsdl?wsdl', {forceSoap12Headers: true}, function (error, client){
        if(error)
          console.log(error);
          client.addSoapHeader('<h:chargeBoxIdentity xmlns:h="urn://Ocpp/Cp/2012/06/" >'+ stationId + '</h:chargeBoxIdentity>');
          client.addSoapHeader('<a:MessageID>urn:uuid:' + "uuid4" + '</a:MessageID>');
          client.addSoapHeader('<a:From><a:Address>http://localhost:8000/wsdl</a:Address></a:From>');
          client.addSoapHeader('<a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>');
          //client.addSoapHeader('<a:To>'+ 'http://localhost:8001/wsdl' + '</a:To>');
          client.addSoapHeader('<a:To>'+ remoteAddress + '</a:To>');
          client.addSoapHeader('<a:Action soap:mustUnderstand="1">'+ '/CancelReservation' +'</a:Action>');

          client.CancelReservation(args).then(function(data){
            callback(data);
          })
          //console.log(client.describe());
       })

}
*/
///////////////////////////////////////////////// CANCELRESERVATION //////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////// DATATRANSFER //////////////////////////////////////////////////////////////////////////////

let dataTransferRequest = {
  dataTransferRequest:{
    vendorId: 'VX-XLO-335',
    messageId: 'messageR35',
    data: 'Get the data'
  }
};

/*
function dataTransfer(stationId, remoteAddress, args, callback){
    soap.createClient('http://localhost:8001/wsdl?wsdl', {forceSoap12Headers: true}, function (error, client){
        if(error)
          console.log(error);
          client.addSoapHeader('<h:chargeBoxIdentity xmlns:h="urn://Ocpp/Cp/2012/06/" >'+ 'stationId' + '</h:chargeBoxIdentity>');
          client.addSoapHeader('<a:MessageID>urn:uuid:' + "uuid4" + '</a:MessageID>');
          client.addSoapHeader('<a:From><a:Address>http://localhost:8000/wsdl</a:Address></a:From>');
          client.addSoapHeader('<a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>');
          client.addSoapHeader('<a:To>'+ 'http://localhost:8001/wsdl' + '</a:To>');
          client.addSoapHeader('<a:Action soap:mustUnderstand="1">'+ '/DataTransfer' +'</a:Action>');

          client.DataTransfer(args).then(function(data){
            callback(data);
          })
          //console.log(client.describe());
       })
}
*/
///////////////////////////////////////////////// DATATRANSFER //////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////// GETCONFIGURATION //////////////////////////////////////////////////////////////////////////////

let getConfigurationRequest = {
  getConfigurationRequest:{
    key: "JWXaksjlkaxsndhajlsdASFDKAWE^34345sadfkjdna.qaca"
  }
};

/*

function getConfiguration(stationId, remoteAddress, args, callback)
{
    soap.createClient('http://localhost:8001/wsdl?wsdl', {forceSoap12Headers: true}, function (error, client){
        if(error)
          console.log(error);
          client.addSoapHeader('<h:chargeBoxIdentity xmlns:h="urn://Ocpp/Cp/2012/06/" >'+ 'stationId' + '</h:chargeBoxIdentity>');
          client.addSoapHeader('<a:MessageID>urn:uuid:' + "uuid4" + '</a:MessageID>');
          client.addSoapHeader('<a:From><a:Address>http://localhost:8000/wsdl</a:Address></a:From>');
          client.addSoapHeader('<a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>');
          client.addSoapHeader('<a:To>'+ 'http://localhost:8001/wsdl' + '</a:To>');
          client.addSoapHeader('<a:Action soap:mustUnderstand="1">'+ '/GetConfiguration' +'</a:Action>');

          client.GetConfiguration(args).then(function(data){
            callback(data);
          })
          //console.log(client.describe());
       })
}
*/
///////////////////////////////////////////////// GETCONFIGURATION //////////////////////////////////////////////////////////////////////////////
let getLocalListVersionRequest = {
    getLocalListVersionRequest:{

    }
}

/*
function getLocalListVersion(stationId, remoteAddress, args, callback)
{
    soap.createClient('http://localhost:8001/wsdl?wsdl', {forceSoap12Headers: true}, function (error, client){
        if(error)
          console.log(error);
          client.addSoapHeader('<h:chargeBoxIdentity xmlns:h="urn://Ocpp/Cp/2012/06/" >'+ stationId + '</h:chargeBoxIdentity>');
          client.addSoapHeader('<a:MessageID>urn:uuid:' + "uuid4" + '</a:MessageID>');
          client.addSoapHeader('<a:From><a:Address>http://localhost:8000/wsdl</a:Address></a:From>');
          client.addSoapHeader('<a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>');
          //client.addSoapHeader('<a:To>'+ 'http://localhost:8001/wsdl' + '</a:To>');
          client.addSoapHeader('<a:To>'+ remoteAddress + '</a:To>');
          client.addSoapHeader('<a:Action soap:mustUnderstand="1">'+ '/GetLocalListVersion' +'</a:Action>');

          client.GetConfiguration(args).then(function(data){
            callback(data);
          })
          //console.log(client.describe());
       })
}
*/
///////////////////////////////////////////////// GETCONFIGURATION //////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////// RESERVENOW  ///////////////////////////////////////////////////////////////////////////////////

let reserveNowRequest = {
  reserveNowRequest: {
    connectorId: 12,
    expiryDate: moment().add(1, 'months'),
    idTag: 'IDTAG',
    parentIdTag: 'PARENT',
    reservationId: 789456123
  }
};
/*
function reserveNow(stationId, remoteAddress, args, callback){
    soap.createClient('http://localhost:8001/wsdl?wsdl', {forceSoap12Headers: true}, function (error, client){
        if(error)
          console.log(error);
          client.addSoapHeader('<h:chargeBoxIdentity xmlns:h="urn://Ocpp/Cp/2012/06/" >'+ stationId + '</h:chargeBoxIdentity>');
          client.addSoapHeader('<a:MessageID>urn:uuid:' + "uuid4" + '</a:MessageID>');
          client.addSoapHeader('<a:From><a:Address>http://localhost:8000/wsdl</a:Address></a:From>');
          client.addSoapHeader('<a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>');
          //client.addSoapHeader('<a:To>'+ 'http://localhost:8001/wsdl' + '</a:To>');
          client.addSoapHeader('<a:To>'+ remoteAddress + '</a:To>');
          client.addSoapHeader('<a:Action soap:mustUnderstand="1">'+ '/ReserveNow' +'</a:Action>');

          client.GetConfiguration(args).then(function(data){
            callback(data);
          })
          //console.log(client.describe());
       })
}
*/
///////////////////////////////////////////////// RESERVENOW  ///////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////// SENDLOCALLIST /////////////////////////////////////////////////////////////////////////////////////
let sendLocalListRequest = {
    sendLocalListRequest: {
        updateType: "Differential",
        listVersion: 334,
        localAuthorisationList:{
            idTag:'kkk',
            idTagInfo: {
              status:"Blocked",
              expiryDate: moment(),
              parentIdTag: 'PARENTIDTAG'
            }
        },
        hash: '^sasdasdasakjanmdhj'
    }
};

/*
function sendLocalList(stationId, remoteAddress, args, callback)
{
    soap.createClient('http://localhost:8001/wsdl?wsdl', {forceSoap12Headers: true}, function (error, client){
        if(error)
          console.log(error);
          client.addSoapHeader('<h:chargeBoxIdentity xmlns:h="urn://Ocpp/Cp/2012/06/" >'+ stationId + '</h:chargeBoxIdentity>');
          client.addSoapHeader('<a:MessageID>urn:uuid:' + "uuid4" + '</a:MessageID>');
          client.addSoapHeader('<a:From><a:Address>http://localhost:8000/wsdl</a:Address></a:From>');
          client.addSoapHeader('<a:ReplyTo><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>');
          //client.addSoapHeader('<a:To>'+ 'http://localhost:8001/wsdl' + '</a:To>');
          client.addSoapHeader('<a:To>'+ remoteAddress + '</a:To>');
          client.addSoapHeader('<a:Action soap:mustUnderstand="1">'+ '/SendLocalList' +'</a:Action>');

          client.GetConfiguration(args).then(function(data){
            callback(data);
          })
          //console.log(client.describe());
       })
}
*/
////////////////////////////////////////////////////////// SENDLOCALLIST /////////////////////////////////////////////////////////////////////////////////////




/*
let server = http.createServer(function(request,response) {
    response.end("404: Not Found: " + request.url);
});
*/
//server.listen(8000);
//soap.listen(server, '/wsdl', CentralSystemService, xml);



///////////////////////////////////////////// 1.5 ROUTES //////////////////////////////////////////////////////////////////////////////////
/*

router.post('/unlockconnector15', (req, res, next) => {
  clientPromise("12XA4454", "http://localhost:8001/wsdl", "UnlockConnector").then(result => result.UnlockConnector(unlockConnectorRequest)).then(result => res.send(result)).catch(err => {
    if(err)
      res.send(err);
  })
})

router.post('/changeavailability15', urlencodedParser, (req, res, next) => {
  clientPromise("12XA4454", "http://localhost:8001/wsdl", "ChangeAvailability").then(result => result.ChangeAvailability(changeAvailabilityRequest)).then(result => res.send(result)).catch(err => {
    if(err)
      res.send(err);
  });
});


router.post('/getdiagnostics15', urlencodedParser, (req, res, next) => {
  //İstekteki tarih formatı burada kontrol edilmeli, formata uygun değilse şimdilik res.sendStatus(XYZ) şeklinde cevap verilse fena durmaz.
  clientPromise("12XA4454", "http://localhost:8001/wsdl", "GetDiagnostics").then(result => result.GetDiagnostics(getDiagnosticsRequest)).then(result => res.send(result)).catch(err => {
    if(err)
      res.send(err);
  });
});


router.post('/clearcache15', urlencodedParser, (req, res, next) => {
  clientPromise("12XA4454", "http://localhost:8001/wsdl", "ClearCache").then(result => result.ClearCache(clearCacheRequest)).then(result => res.send(result)).catch(err => {
    if(err)
      res.send(err);
  });
});

router.post('/updatefirmware15', (req, res, next) => {
  clientPromise("12XA4454", "http://localhost:8001/wsdl", "UpdateFirmware").then(result => result.UpdateFirmware(updateFirmwareRequest)).then(result => res.send(result)).catch(err => {
    if(err)
      res.send(err);
  });
});

router.post('/changeconfiguration15', (req, res, next) => {
  clientPromise("12XA4454", "http://localhost:8001/wsdl", "ChangeConfiguration").then(result => result.ChangeConfiguration(changeConfigurationRequest)).then(result => res.send(result)).catch(err => {
    if(err)
      res.send(err);
  });
});

router.post('/cancelreservation15', (req, res, next) => {
  clientPromise("12XA4454", "http://localhost:8001/wsdl", "CancelReservation").then(result => result.CancelReservation(cancelReservationRequest)).then(result => res.send(result)).catch(err => {
    if(err)
      res.send(err);
  });
});

router.post('/datatransfer15', (req, res, next) => {
    clientPromise("12XA4454", "http://localhost:8001/wsdl", "DataTransfer").then(result => result.DataTransfer(dataTransferRequest)).then(result => res.send(result)).catch(err => {
      if(err)
        res.send(err);
    });
});

router.post('/getconfiguration15', (req, res, next) => {
    clientPromise("12XA4454", "http://localhost:8001/wsdl", "GetConfiguration").then(result => result.GetConfiguration(getConfigurationRequest)).then(result => res.send(result)).catch(err => {
      if(err)
        res.send(err);
    });
});

router.post('/getlocallistversion15', (req, res, next) => {
    clientPromise("12XA4454", "http://localhost:8001/wsdl", "GetLocalListVersion").then(result => result.GetLocalListVersion(getLocalListVersionRequest)).then(result => res.send(result)).catch(err => {
      if(err)
        res.send(err);
    });
});

router.post('/reservenow15', (req, res, next) => {
   clientPromise("12XA4454", "http://localhost:8001/wsdl", "ReserveNow").then(result => result.ReserveNow(reserveNowRequest)).then(result => res.send(result)).catch(err => {
    if(err)
      res.send(err);
   });
});

router.post('/sendlocalList15', (req, res, next) => {
  clientPromise("12XA4454", "http://localhost:8001/wsdl", "SendLocalList").then(result => result.SendLocalList(sendLocalListRequest)).then(result => res.send(result)).catch(err => {
    if(err)
      res.send(err);
  });
});

router.post('/reset15', (req, res, next) => {
  clientPromise("12XA4454", "http://localhost:8001/wsdl", "Reset").then(result => result.Reset(request2)).then(result => res.send(result)).catch(err => {
    if(err)
      res.send(err);
  });
})

*/

router.post('/remotestarttransaction15', (req, res, next) => {
  clientPromise("12XA4454", `${clientIp}wsdl`, "RemoteStartTransaction").then(result => result.RemoteStartTransaction(remoteStartTransactionRequest)).then(result => res.send(result)).catch(err => {
    if(err)
      res.send(err);
  });
});

router.post('/faultedremotestarttransaction15', (req, res, next) => {
  clientPromise("12XA4454", `${clientIp}wsdl`, "RemoteStartTransaction").then(result => result.RemoteStartTransaction(faultedRemoteStartTransactionRequest)).then(result => res.send(result)).catch(err => {
    if(err)
      res.send(err);
  });
});

router.post('/remotestoptransaction15', (req, res, next) => {
  clientPromise("12XA4454", `${clientIp}wsdl`, "RemoteStopTransaction").then(result => result.RemoteStopTransaction(remoteStopTransactionRequest)).then(result => res.send(result)).catch(err => {
    if(err)
      res.send(err);
  });
});

router.post('/faultedremotestoptransaction15', (req, res, next) => {
  clientPromise("12XA4454", `${clientIp}wsdl`, "RemoteStopTransaction").then(result => result.RemoteStopTransaction(faultedRemoteStopTransactionRequest)).then(result => res.send(result)).catch(err => {
    if(err)
      res.send(err);
  });
});

///////////////////////////////////////////// 1.5 ROUTES //////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////// 1.6 ROUTES //////////////////////////////////////////////////////////////////////////////////


//let formWSConn = false;
//const w = new WebSocket('ws://localhost:8001');//Çare
let incidentMessage = null;
//w.onmessage = (data) => {incidentMessage = data.data;
console.log(incidentMessage);
//}




//const w = new WebSocket('ws://3.89.102.141:8001/');//Çare promise olabilir.
const w = new WebSocket('ws://18.212.194.189:8001');
let incomingMessage = null;



/*
function createWSClient(remoteAddress){
  let w = new WebSocket(remoteAddress);
  return new Promise((resolve, reject) => {
    resolve(w);
  })
}
*/


router.post('/remotestarttransaction16', (req, res, next) => {
  //createWSClient('ws://localhost:8001').then(w => res.send('Zilzal')).catch(err => res.send(err));
  w.send(JSON.stringify([2, "<UniqueIDRemStrt>", "RemoteStartTransaction", {"connectorId": 18, "idTag":"a2a$cfw~455", "chargingprofile":{"chargingProfileId": 112, "stackLevel":23, "chargingProfilePurpose": "TxProfile", "chargingProfileKind": "Absolute", "chargingProfileKind": "Relative", "recurrencyKind": "Daily", "validFrom":Date.now() }}]));
  w.onmessage = (data) => {
    //incomingMessage = JSON.parse(data.data);
    res.send(JSON.parse(data.data));
  }
});

router.post('/remotestoptransaction16', (req, res, next) => {
  w.send(JSON.stringify([2, "<UniqueIDRemStp>", "RemoteStopTransaction", {"transactionId":88}]));
  w.onmessage = (data) => {
    //incomingMessage = JSON.parse(data.data);
    res.send(JSON.parse(data.data));
  }
});

router.post('/faultedremotestarttransaction16', (req, res, next) => {
  //createWSClient('ws://localhost:8001').then(w => res.send('Zilzal')).catch(err => res.send(err));
  w.send(JSON.stringify([2, "<UniqueIDRemStrt>", "RemoteStartTransaction", {"connectorId": 18, "idTagg":"a2a$cfw~455", "chargingprofile":{"chargingProfileId": 112, "stackLevel":23, "chargingProfilePurpose": "TxProfile", "chargingProfileKind": "Absolute", "chargingProfileKind": "Relative", "recurrencyKind": "Daily", "validFrom":Date.now() }}]));
  w.onmessage = (data) => {
    //incomingMessage = JSON.parse(data.data);
    res.send(JSON.parse(data.data));
  }
});

router.post('/faultedremotestoptransaction16', (req, res, next) => {
  w.send(JSON.stringify([2, "<UniqueIDRemStp>", "RemoteStopTransaction", {"transactionIdg":88}]));
  w.onmessage = (data) => {
    //incomingMessage = JSON.parse(data.data);
    res.send(JSON.parse(data.data));
  }
});




///////////////////////////////////////////// 1.6 ROUTES //////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////// 1.6 STARTS FROM THERE /////////////////////////////////////////////////////////////////////////////////////////////////////////


// CHECK FOR MESSAGE IF THE FORMAT IS JSON.
function isJson(str) {
  try {
      JSON.parse(str);
  } catch (e) {
      return false;
  }
  return true;
}

function checkForRequest(el)
{
  if(el === 2) return true;
  else return false;
}

function checkRequestForLength(el)
{
  if(el.length === 4) return true;
  else return false;
}

let validMethodNames = ["Authorize", "BootNotification", "DataTransfer", "DiagnosticsStatusNotification", "FirmwareStatusNotification", "Heartbeat", "MeterValues", "StartTransaction", "StatusNotification", "StopTransaction"];
let isFoundFlag;
function checkForMethodName(el)
{
  for(let i=0; i<validMethodNames.length; i++)
  {
    if(el == validMethodNames[i])
    {
      isFoundFlag = true;
      break;
    }
    else{
      isFoundFlag = false;
    }
  }
  return isFoundFlag;
}

function checkLastParameter(el)
{
  return (typeof el === 'object' && el !== null); //Son elemanın obje olup olmadığını kontrol etse yeter, her metoda göre kontrol yapılması gerek olduğundan, son parametre ayrıca ele alınacak.
}

///////////////////////////////////// REQUEST FORMAT ///////////////////////////////////
/* [2, "UniqueMessageId", "MethodName", {MethodPayload}] */
///////////////////////////////////// REQUEST FORMAT ///////////////////////////////////

///////////////////////////////////// SUCCESSFUL RESPONSE FORMAT ///////////////////////////////////
/* [3, "UniqueMessageId", {MethodPayload}] */
///////////////////////////////////// SUCCESSFUL RESPONSE FORMAT ///////////////////////////////////

///////////////////////////////////// ERRORNEOUS RESPONSE FORMAT ///////////////////////////////////
/* [4, "UniqueMessageId", "errorCode", "errorDescription", {MethodPayload}]
  ### ERROR CODES ### (will be printed there!)
*/
///////////////////////////////////// ERRORNEOUS RESPONSE FORMAT ///////////////////////////////////














/*function isValidTimestamp(ts)
{
  return (new Date(ts)).getTime() > 0;
}
*/









const transactionalFunctions =
[
  {
    transactionName:'Authorize',
    method: function (ws, incomingMessage)
    {
      //Şimdilik, hatalı mesaj farkedildiğinde "invalid" mesajını gönderecek. Sonra üstünden geçilir.
      let sampleSuccessfulAuthorizeRequest = `[2, "<UniqueID>", "Authorize", {"idTag": "SampleIDTag"}]`;
      let sampleSuccessfulAuthorizeResponse = `[3, "<UniqueID>", {
        "idTagInfo":{
          "status":"Accepted",
          "expiryDate":moment().add(5, 'days').add(3, 'hours'),
          "parentIdTag":"parentIdTag"
        }
      }]`;
      console.log(incomingMessage);
      let acceptedAuthorizeResponsePayload = {
        "idTagInfo":{
          "status":"Accepted", //Accepted, Blocked, Expired, Invalid, ConcurrentTx
          "expiryDate":moment().add(5, 'days').add(3, 'hours'),//Ka. gün sonra olduğu düzenlenecek.
          "parentIdTag":"parentIdTag"//? ? I know its type is string
        }
      };

      let blockedAuthorizeResponsePayload = {
        "idTagInfo":{
          "status":"Blocked", //Accepted, Blocked, Expired, Invalid, ConcurrentTx
          "expiryDate":moment().add(5, 'days').add(3, 'hours'),//Ka. gün sonra olduğu düzenlenecek.
          "parentIdTag":"parentIdTag"//? ? I know its type is string
        }
      };

      let expiredAuthorizeResponsePayload = {
        "idTagInfo":{
          "status":"Expired", //Accepted, Blocked, Expired, Invalid, ConcurrentTx
          "expiryDate":moment().add(5, 'days').add(3, 'hours'),//Ka. gün sonra olduğu düzenlenecek.
          "parentIdTag":"parentIdTag"//? ? I know its type is string
        }
      };

      let invalidAuthorizeResponsePayload = {
        "idTagInfo":{
          "status":"Invalid", //Accepted, Blocked, Expired, Invalid, ConcurrentTx
          "expiryDate":moment().add(5, 'days').add(3, 'hours'),//Ka. gün sonra olduğu düzenlenecek.
          "parentIdTag":"parentIdTag"//? ? I know its type is string
        }
      };

      let concurrentTxAuthorizeResponsePayload = {
        "idTagInfo":{
          "status":"ConcurrentTx", //Accepted, Blocked, Expired, Invalid, ConcurrentTx
          "expiryDate":moment().add(5, 'days').add(3, 'hours'),//Ka. gün sonra olduğu düzenlenecek.
          "parentIdTag":"parentIdTag"//? ? I know its type is string
        }
      };


      let uuid = incomingMessage[1];
      //console.log(Object.keys(incomingMessage[3]));
      //console.log(incomingMessage[3]);
      let response = '';
      if(!Object.keys(incomingMessage[3]).includes('idTag')
         || (incomingMessage[3].idTag && incomingMessage[3].idTag.length > 20)
         || (incomingMessage[3].idTag && typeof incomingMessage[3].idTag !== 'string')){
        console.log('Authorize request is not in proper format.');//"Proper message will be sent (print) in OCPP 1.6 format!");
        response = [4, uuid, invalidAuthorizeResponsePayload];
      }
      else{
        response = [3, uuid, acceptedAuthorizeResponsePayload];
      }
      //Diğer hatalı mesajlar duruma göre else if... zincirleri şeklinde tatbik edilebilir. İlker CANKAR

      ws.send(JSON.stringify(response));
    }

  },
  {
    transactionName:'BootNotification',
    method:function (ws, incomingMessage)
    {
      let sampleSuccessfulBootNotificationRequest = `[2, "<UniqueID>", "BootNotification", {"chargeBoxSerialNumber": "Trochky",  "chargePointModel": "Maksuper78","chargePointSerialNumber": "Mahk222", "chargePointVendor": "Maksopus", "firmwareVersion": "1.4.s6", "iccid": "ICCID", "imsi": "Lenin", "meterSerialNumber": "SampleMeterSerial", "meterType": "OXY40"}]`;
      let sampleSuccessfulBootNotificationResponse = `[3, "<UniqueID>", {
        status: 'Accepted',//Accepted, Pending, Rejected
        currentTime: Date.now(),
        interval:300
      }]`;
      //Pending cevabı neye göre verilir? İlker CANKAR
      let uuid = incomingMessage[1];
      let acceptedBootNotificationResponsePayload = {
        "status": 'Accepted',//Accepted, Pending, Rejected
        "currentTime": Date.now(),
        "interval":300
      };
      let pendingBootNotificationResponsePayload = {
        "status": 'Pending',//Accepted, Pending, Rejected
        "currentTime": Date.now(),
        "interval":300
      };
      let rejectedBootNotificationResponsePayload = {
        "status": 'Rejected',//Accepted, Pending, Rejected
        "currentTime": Date.now(),
        "interval":300
      };
      //console.log(incomingMessage);
      let response = '';
      if(!Object.keys(incomingMessage[3]).includes('chargePointVendor') //+
        || !Object.keys(incomingMessage[3]).includes('chargePointModel')  //+
        || (incomingMessage[3].chargePointModel && incomingMessage[3].chargePointModel.length > 20) //+
        || (incomingMessage[3].chargePointVendor && incomingMessage[3].chargePointVendor.length > 20) //+
        || (incomingMessage[3].chargeBoxSerialNumber && incomingMessage[3].chargeBoxSerialNumber.length > 25) //+
        || (incomingMessage[3].chargePointSerialNumber && incomingMessage[3].chargePointSerialNumber.length > 25)  //+
        || (incomingMessage[3].firmwareVersion && incomingMessage[3].firmwareVersion.length > 50) //+
        || (incomingMessage[3].iccid && incomingMessage[3].iccid.length > 20)  //+
        || (incomingMessage[3].imsi && incomingMessage[3].imsi.length > 20)   //+
        || (incomingMessage[3].meterSerialNumber && incomingMessage[3].meterSerialNumber.length > 25) //+
        || (incomingMessage[3].meterType && incomingMessage[3].meterType.length > 25) //+
        || (incomingMessage[3].chargePointVendor && typeof incomingMessage[3].chargePointVendor !== 'string') //+
        || (incomingMessage[3].chargePointModel && typeof incomingMessage[3].chargePointModel !== 'string') //+
        || (incomingMessage[3].chargeBoxSerialNumber && typeof incomingMessage[3].chargeBoxSerialNumber !== 'string') //+
        || (incomingMessage[3].chargePointSerialNumber && typeof incomingMessage[3].chargePointSerialNumber !== 'string') //+
        || (incomingMessage[3].firmwareVersion && typeof incomingMessage[3].firmwareVersion !== 'string') //+
        || (incomingMessage[3].iccid && typeof incomingMessage[3].iccid !== 'string')  //+
        || (incomingMessage[3].imsi && typeof incomingMessage[3].imsi !== 'string') //+
        || (incomingMessage[3].meterSerialNumber && typeof incomingMessage[3].meterSerialNumber !== 'string') //+
        || (incomingMessage[3].meterType && typeof incomingMessage[3].meterType !== 'string')
      )
      {
        response = [4, uuid, rejectedBootNotificationResponsePayload];
        //return rejectedBootNotificationResponse;
      }
      else{
        response = [3, uuid, acceptedBootNotificationResponsePayload];
      }

      ws.send(JSON.stringify(response));
    }
  },
  {
    transactionName: 'DataTransfer',
    method: function (ws, incomingMessage)
    {
      let sampleSuccessfulDataTransferRequest = '[2, "<UniqueID>", "DataTransfer", {"vendorId":"SampleVendorID", "messageId":"Optional", "data":"Artillery"}]';
      let sampleSuccessfulDataTransferResponse = '[3, uuid, { status: "Accepted", data: "AnyData" }];';

      let uuid = incomingMessage[1];

      let acceptedDataTransferResponsePayload = {
        "status": "Accepted",
        "data": "AnyData"
      };

      let rejectedDataTransferResponsePayload = {
        "status": "Rejected",
        "data": "AnyData"
      };

      let UnknownMessageDataTransferResponsePayload = {
        "status": "UnknownMessageId",
        "data": "AnyData"
      };

      let UnknownVendorDataTransferResponsePayload = {
        "status": "UnknownVendorId",
        "data": "AnyData"
      };
      let response = '';
      if(!Object.keys(incomingMessage[3]).includes('vendorId')
         || (incomingMessage[3].vendorId && incomingMessage[3].vendorId.length > 255)
         || (incomingMessage[3].messageId && incomingMessage[3].messageId.length > 50)
         || (incomingMessage[3].vendorId && typeof incomingMessage[3].vendorId !== 'string')
         || (incomingMessage[3].messageId && typeof incomingMessage[3].messageId !== 'string')
         || (incomingMessage[3].data && typeof incomingMessage[3].data !== 'string')
        )
      {
         response = [4, uuid, rejectedDataTransferResponsePayload];
      }
      else{
         response = [3, uuid, acceptedDataTransferResponsePayload];
      }


      ws.send(JSON.stringify(response));
    }
  },
  {
    transactionName:'DiagnosticsStatusNotification',
    method:function (ws, incomingMessage)
    {
      let sampleSuccessfulDiagnosticsStatusNotificationRequest = `[2, "<UniqueID>", "DiagnosticsStatusNotification", {"status":"Uploading"}]`;
      let sampleSuccessfulDiagnosticsStatusNotificationResponse = `[3, "<UniqueID>", {}]`;//No field is defined for this response...
      let acceptableDiagnosticsStatusTypes = ["Idle", "Uploaded", "UploadFailed", "Uploading"];
      let uuid = incomingMessage[1];
      let successfulDiagnosticsStatusNotificationResponsePayload = {

      };
      let errorneousDiagnosticsStatusNotificaionResponsePayload = {
        message:"ErrorWillBeImplementedOrWillBeDeleted"
      };

      let response = '';

      if(!Object.keys(incomingMessage[3]).includes('status')
         || (incomingMessage[3].status && typeof incomingMessage[3].status !== 'string')
         || !acceptableDiagnosticsStatusTypes.includes(incomingMessage[3].status))
      {
        response = [4, uuid, errorneousDiagnosticsStatusNotificaionResponsePayload];
      }
      else{
        response = [3, uuid, successfulDiagnosticsStatusNotificationResponsePayload];
      }

      ws.send(JSON.stringify(response));
    }
  },
  {
    transactionName:'FirmwareStatusNotification',
    method:function (ws, incomingMessage)
    {
      let sampleSuccessfulFirmwareStatusNotificationRequest = `[2, "<UniqueID>", "FirmwareStatusNotification", {"status":"Installed"}]`;
      let sampleSuccessfulFirmwareStatusNotificationResponse = `[3, "<UniqueID>", {}]`;
      let acceptableFirmwareStatusTypes = ["Downloaded", "DownloadFailed", "Downloading", "Idle", "InstallationFailed", "Installing", "Installed"];
      let uuid = incomingMessage[1];
      let successfulFirmwareStatusNotificationPayload = {

      };

      let errorneousFirmwareStatusNotificationPayload = {
        "message": "ErrorWillBeImplementedOrWillBeDeleted"
      };
      let response = '';
      if(!Object.keys(incomingMessage[3]).includes('status')
      || (incomingMessage[3].status && typeof incomingMessage[3].status !== 'string')
      || !acceptableFirmwareStatusTypes.includes(incomingMessage[3].status))
      {
        response = [4, uuid, errorneousFirmwareStatusNotificationPayload];
      }
      else{
        response = [3, uuid, successfulFirmwareStatusNotificationPayload];
      }
      ws.send(JSON.stringify(response));
    }
  },
  {
    transactionName:'Heartbeat',
    method: function (ws, incomingMessage)
    {
      let sampleSuccessfulHeartbeatRequest = `[2, "<UniqueID>" ,"Heartbeat", {}]`;
      let sampleSuccessfulHeartbeatResponse = `[3, "<UniqueID>", {
        "currentTime": moment().add(3,'hours')
      }]`;
      let uuid = incomingMessage[1];
      let successfulHeartbeatResponsePayload = {
        "currentTime": moment().add(3,'hours')
      };

      let successfulHeartbeatResponse = [3, uuid, successfulHeartbeatResponsePayload];
      ws.send(JSON.stringify(successfulHeartbeatResponse));
    }
  },
  {
    transactionName:'MeterValues',
    method: function (ws, incomingMessage)
    {
      let sampleSuccessfulMeterValuesRequest = `[2, "<UniqueID>", "MeterValues", {"connectorId":3, "transactionId": 78, "meterValue": { "timestamp":Date.now(), "sampledValue": { "value":"SampleValue", "context": "Sample.Periodic", "format": "Raw", "measurand": "Energy.Active.Import.Register" } }}]`;
      let sampleSuccessfulMeterValuesResponse = `[3, "<UniqueID>", {}]`;



      let acceptableContextTypes = ["Interruption.Begin", "Interruption.End", "Other", "Sample.Clock", "Sample.Periodic", "Transaction.Begin", "Transaction.End", "Trigger"];
      let acceptableFormatTypes = ["Raw", "SignedData"];
      let acceptableMeasurandTypes = ["Current.Export", "Current.Import", "Current.Offered", "Energy.Active.Export.Register", "Energy.Active.Import.Register", "Energy.Reactive.Export.Register", "Energy.Reactive.Import.Register", "Frequency", "Power.Active.Export", "Power.Active.Import", "Power.Factor", "Power.Offered", "Power.Reactive.Export", "Power.Reactive.Import", "RPM", "SoC", "Temperature", "Voltage"];

      let uuid = incomingMessage[1];
      let successfulMeterValuesResponsePayload = {

      };
      let errorneousMeterValuesResponsePayload = {
        "message":"ErrorWillBeImplementedOrWillBeDeleted"
      };


      //if(!Object.keys(incomingMessage[3]).inc)
      let response = '';
      if(!Object.keys(incomingMessage[3]).includes('connectorId')//+
         || (incomingMessage[3].connectorId && Number.isInteger(+incomingMessage[3].connectorId) === false)//+
         || (incomingMessage[3].connectorId && incomingMessage[3].connectorId < 0)//+
         || (incomingMessage[3].transactionId && Number.isInteger(+incomingMessage[3].transactionId) === false) //+
         ||!Object.keys(incomingMessage[3]).includes('meterValue') //+
         || !Object.keys(incomingMessage[3].meterValue).includes('timestamp') //+
         || (incomingMessage[3].meterValue.timestamp && isValidTimestamp(incomingMessage[3].meterValue.timestamp) === false) //+
         || (incomingMessage[3].meterValue.timestamp && incomingMessage[3].meterValue.timestamp > (Date.now() + 12000))
         || (incomingMessage[3].meterValue.timestamp && incomingMessage[3].meterValue.timestamp < (Date.now() - 12000))
         || !Object.keys(incomingMessage[3].meterValue).includes('sampledValue')  //+
         || (incomingMessage[3].meterValue.sampledValue.value && typeof incomingMessage[3].meterValue.sampledValue.value !== 'string') //+
         || !Object.keys(incomingMessage[3].meterValue.sampledValue).includes('value') //+
         || (incomingMessage[3].meterValue.sampledValue.context && !acceptableContextTypes.includes(incomingMessage[3].meterValue.sampledValue.context)) //+
         || (incomingMessage[3].meterValue.sampledValue.format && !acceptableFormatTypes.includes(incomingMessage[3].meterValue.sampledValue.format))  //+
         || (incomingMessage[3].meterValue.sampledValue.measurand && !acceptableMeasurandTypes.includes(incomingMessage[3].meterValue.sampledValue.measurand)))//+
      {
        response = [4, uuid, errorneousMeterValuesResponsePayload];
      }
      else{
        response = [3, uuid, successfulMeterValuesResponsePayload];
      }
      ws.send(JSON.stringify(response));
    }
  },
  {
    transactionName: "StartTransaction",
    method: function (ws, incomingMessage)
    {

      let sampleSuccessfulStartTransactionRequest = `[2, "<UniqueID>", "StartTransaction", { "connectorId": 78,"idTag": "2s", "meterStart": 48, "reservationId": 778, "timestamp":Date.now()}]`;
      let sampleSuccessfulStartTransactionResponse = `[3, "<UniqueID>", {
        "idTagInfo":{
          "expiryDate": moment().add(5, 'days'),
          "parentIdTag": "sampleParentIdTag",
          "status": "Accepted"
        },
        "transactionId":12321
      }]`;


      //Sadece accepted ve invalid cevapları kullanılıyor, diğerleri için İlker CANKAR
      let uuid = incomingMessage[1];

      let acceptedStartTransactionResponsePayload = {
        "idTagInfo":{
          "expiryDate": moment().add(5, 'days'),
          "parentIdTag": "sampleParentIdTag",
          "status": "Accepted"
        },
        "transactionId":12321
      };

      let invalidStartTransactionResponsePayload = {
        "idTagInfo":{
          "expiryDate": moment().add(5, 'days'),
          "parentIdTag": "sampleParentIdTag",
          "status": "Invalid"
        },
        "transactionId":12321
      };

      let blockedStartTransactionResponsePayload = {
        "idTagInfo":{
          "expiryDate": moment().add(5, 'days'),
          "parentIdTag": "sampleParentIdTag",
          "status": "Blocked"
        },
        "transactionId":12321
      };

      let expiredStartTransactionResponsePayload = {
        "idTagInfo":{
          "expiryDate": moment().add(5, 'days'),
          "parentIdTag": "sampleParentIdTag",
          "status": "Expired"
        },
        "transactionId":12321
      };

      let concurrenttxStartTransactionResponsePayload = {
        "idTagInfo":{
          "expiryDate": moment().add(5, 'days'),
          "parentIdTag": "sampleParentIdTag",
          "status": "ConcurrentTx"
        },
        "transactionId":12321
      };






       let response = '';
      //console.log(incomingMessage);
      if(!Object.keys(incomingMessage[3]).includes('connectorId')//+
         || !Object.keys(incomingMessage[3]).includes('idTag')//+
         || !Object.keys(incomingMessage[3]).includes('meterStart')//+
         ||!Object.keys(incomingMessage[3]).includes('timestamp')//+
         || (incomingMessage[3].timestamp && incomingMessage[3].timestamp > (Date.now() + 12000))
         || (incomingMessage[3].timestamp && incomingMessage[3].timestamp < (Date.now() - 12000))
         || (incomingMessage[3].connectorId && incomingMessage[3].connectorId < 0)//+
         || (incomingMessage[3].connectorId && isNaN(incomingMessage[3].connectorId) === true)//+
         || (incomingMessage[3].idTag && incomingMessage[3].idTag.length > 20)//+
         || (incomingMessage[3].idTag && typeof incomingMessage[3].idTag !== 'string') //+
         || (incomingMessage[3].meterStart && isNaN(incomingMessage[3].meterStart) === true) //+
         || (incomingMessage[3].reservationId && isNaN(incomingMessage[3].reservationId) === true) //+
         || (incomingMessage[3].timestamp && isValidTimestamp(incomingMessage[3].timestamp) === false) //+
        )
      {
        response = [4, uuid, invalidStartTransactionResponsePayload];
      }
      else{
        response = [3, uuid, acceptedStartTransactionResponsePayload];
      }
     ws.send(JSON.stringify(response));
    }
  },
  {
    transactionName:'StatusNotification',
    method:function (ws, incomingMessage){
      let sampleSuccessfulStatusNotificationRequest = `[2, "<UniqueID>", "StatusNotification", { "connectorId": 2,  "errorCode": "ConnectorLockFailure", "info":"84s",  "status":"Available", "timestamp":Date.now(), "vendorId":"37", "vendorErrorCode":"01s"}]`;
      let sampleSuccessfulStatusNotificationResponse = `[3, "<UniqueID>", {}]`;

      let acceptableErrorCodes = ["ConnectorLockFailure", "EVCommunicationError", "GroundFailure", "HighTemperature", "InternalError", "LocalListConflict", "NoError", "OtherError", "OverCurrentFailure", "OverVoltage", "PowerMeterFailure", "PowerSwitchFailure", "ReaderFailure", "ResetFailure", "UnderVoltage", "WeakSignal"];
      let acceptableStatus = ["Available", "Preparing", "Charging", "SuspendedEVSE", "SuspendedEV", "Finishing", "Reserved", "Unavailable", "Faulted"];

      let uuid = incomingMessage[1];
      let successfulStatusNotificationResponsePayload = {

      };

      let errorneousStatusNotificationResponsePayload = {
        "message":"ErrorWillBeImplementedOrWillBeDeleted"
      };

      let response = '';
      if(!Object.keys(incomingMessage[3]).includes('connectorId')  //+
         || !Object.keys(incomingMessage[3]).includes('errorCode')  //+
         || !Object.keys(incomingMessage[3]).includes('status')   //+
         || (incomingMessage[3].connectorId && incomingMessage[3].connectorId < 0)  //+
         || (incomingMessage[3].connectorId && isNaN(incomingMessage[3].connectorId) === true)  //+
         || (incomingMessage[3].errorCode && !acceptableErrorCodes.includes(incomingMessage[3].errorCode))  //+
         || (incomingMessage[3].info && typeof incomingMessage[3].info !== 'string')   //+
         || (incomingMessage[3].info && incomingMessage[3].info.length > 50)  //+
         || (incomingMessage[3].status && !acceptableStatus.includes(incomingMessage[3].status)) //+
         || (incomingMessage[3].timestamp && isValidTimestamp(incomingMessage[3].timestamp) === false) //+
         || (incomingMessage[3].timestamp && incomingMessage[3].timestamp > (Date.now() + 12000))
         || (incomingMessage[3].timestamp && incomingMessage[3].timestamp < (Date.now() - 12000))
         || (incomingMessage[3].vendorId && typeof incomingMessage[3].vendorId !== 'string')  //+
         || (incomingMessage[3].vendorId && incomingMessage[3].vendorId.length > 255)     //+
         || (incomingMessage[3].vendorErrorCode && typeof incomingMessage[3].vendorErrorCode !== 'string')  //+
         || (incomingMessage[3].vendorErrorCode && incomingMessage[3].vendorErrorCode.length > 50) //+
         )
      {
        response = [4, uuid, errorneousStatusNotificationResponsePayload];
      }
      else{
        response = [3, uuid, successfulStatusNotificationResponsePayload];
      }
      ws.send(JSON.stringify(response));
    }

  },
  {
    transactionName: "StopTransaction",
    method: function (ws, incomingMessage)
    {
      let sampleSuccessfulStopTransactionRequest = `[2, "<UniqueID>", "StopTransaction", {"idTag":"SampleIDTag", "meterStop":88, "timestamp":Date.now(), "transactionId": 313, "reason": "EmergencyStop", "transactionData":{ "timestamp": Date.now(), "sampledValue": { "value": "Stranan", "context": "Interruption.Begin", "format": "Raw", "measurand": "Current.Export" } }}]`;
      let sampleSuccessfulStopTransactionResponse = `[3, "<UniqueID>", {   "idTagInfo":{
        "expiryDate": moment().add(5, 'days'),
        "parentIdTag": "AnyParentIdTag",
        "status":"Accepted"// Blocked, Expired, Invalid, ConcurrentTx
      }}]`;
      //Şimdilik sadece Accepted ve Invalid cevapları verilecek. Diğerleri eknik detaya tabii olduğundan --> :))) İlker CANKAR

      let acceptableContextTypes = ["Interruption.Begin", "Interruption.End", "Other", "Sample.Clock", "Sample.Periodic", "Transaction.Begin", "Transaction.End", "Trigger"];
      let acceptableFormatTypes = ["Raw", "SignedData"];
      let acceptableMeasurandTypes = ["Current.Export", "Current.Import", "Current.Offered", "Energy.Active.Export.Register", "Energy.Active.Import.Register", "Energy.Reactive.Export.Register", "Energy.Reactive.Import.Register", "Frequency", "Power.Active.Export", "Power.Active.Import", "Power.Factor", "Power.Offered", "Power.Reactive.Export", "Power.Reactive.Import", "RPM", "SoC", "Temperature", "Voltage"];
      let acceptablePhases = ["L1", "L2", "L3", "N", "L1-N", "L2-N", "L3-N", "L1-L2", "L2-L3", "L3-L1"];
      let acceptableLocations = ["Body", "Cable", "EV", "Inlet", "Outlet"];
      let acceptableUnits = ["Wh", "kWh", "varh", "W", "kW", "VA", "kVA", "var", "kvar", "A", "V", "Celcius", "Fahrenheit", "K", "Percent"];
      let acceptableReasons = ["EmergencyStop", "EVDisconnected", "HardReset", "Local", "Other", "PowerLoss", "Reboot", "Remote", "SoftReset", "UnlockCommand", "DeAuthorized"];



      let uuid = incomingMessage[1];
      let acceptedStopTransactionResponsePayload = {
        "idTagInfo":{
          "expiryDate": moment().add(5, 'days'),
          "parentIdTag": "AnyParentIdTag",
          "status":"Accepted"// Blocked, Expired, Invalid, ConcurrentTx
        }
      };

      let invalidStopTransactionResponsePayload = {
        "idTagInfo":{
          "expiryDate": moment().add(5, 'days'),
          "parentIdTag": "AnyParentIdTag",
          "status":"Invalid"// Blocked, Expired, Invalid, ConcurrentTx
        }
      };

      let blockedStopTransactionResponsePayload = {
        "idTagInfo":{
          "expiryDate": moment().add(5, 'days'),
          "parentIdTag": "AnyParentIdTag",
          "status":"Accepted"// Blocked, Expired, Invalid, ConcurrentTx
        }
      };

      let expiredStopTransactionResponsePayload = {
        "idTagInfo":{
          "expiryDate": moment().add(5, 'days'),
          "parentIdTag": "AnyParentIdTag",
          "status":"Accepted"// Blocked, Expired, Invalid, ConcurrentTx
        }
      };

      let concurrentTxStopTransactionResponsePayload = {
        "idTagInfo":{
          "expiryDate": moment().add(5, 'days'),
          "parentIdTag": "AnyParentIdTag",
          "status":"ConcurrentTx"// Blocked, Expired, Invalid, ConcurrentTx
        }
      };

      let response = '';

      if(!Object.keys(incomingMessage[3]).includes('meterStop') //+
         || !Object.keys(incomingMessage[3]).includes('timestamp')  //+
         || !Object.keys(incomingMessage[3]).includes('transactionId')  //+
         || (incomingMessage[3].idTag && incomingMessage[3].idTag.length > 20)  //+
         || (incomingMessage[3].idTag && typeof incomingMessage[3].idTag !== 'string')  //+
         || (incomingMessage[3].meterStop && isNaN(incomingMessage[3].meterStop) === true)  //+
         || (incomingMessage[3].timestamp && isValidTimestamp(incomingMessage[3].timestamp) === false) //+
         || (incomingMessage[3].timestamp && incomingMessage[3].timestamp > (Date.now() + 12000))
         || (incomingMessage[3].timestamp && incomingMessage[3].timestamp < (Date.now() - 12000))
         || ((incomingMessage[3].transactionId && isNaN(incomingMessage[3].transactionId) === true))  //+
         || (incomingMessage[3].reason && !acceptableReasons.includes(incomingMessage[3].reason))  //+
         || (incomingMessage[3].transactionData && !Object.keys(incomingMessage[3].transactionData).includes('timestamp')) //+
         || (incomingMessage[3].transactionData.timestamp && incomingMessage[3].transactionData.timestamp > (Date.now() + 12000))
         || (incomingMessage[3].transactionData.timestamp && incomingMessage[3].transactionData.timestamp < (Date.now() - 12000))
         || (incomingMessage[3].transactionData && !Object.keys(incomingMessage[3].transactionData).includes('sampledValue')) //+
         || (incomingMessage[3].transactionData.timestamp && isValidTimestamp(incomingMessage[3].transactionData.timestamp) === false) //+
         || (!Object.keys(incomingMessage[3].transactionData.sampledValue).includes('value'))
         || (incomingMessage[3].transactionData.sampledValue.value && typeof incomingMessage[3].transactionData.sampledValue.value !== 'string')
         || (incomingMessage[3].transactionData.sampledValue.context && !acceptableContextTypes.includes(incomingMessage[3].transactionData.sampledValue.context))
         || (incomingMessage[3].transactionData.sampledValue.format && !acceptableFormatTypes.includes(incomingMessage[3].transactionData.sampledValue.format))
         || (incomingMessage[3].transactionData.sampledValue.measurand && !acceptableMeasurandTypes.includes(incomingMessage[3].transactionData.sampledValue.measurand))
         || (incomingMessage[3].transactionData.sampledValue.phase && !acceptablePhases.includes(incomingMessage[3].transactionData.sampledValue.phase))
         || (incomingMessage[3].transactionData.sampledValue.location && !acceptableLocations.includes(incomingMessage[3].transactionData.sampledValue.location))
         || (incomingMessage[3].transactionData.sampledValue.unit && !acceptableUnits.includes(incomingMessage[3].transactionData.sampledValue.unit))
        )
      {
        response = [4, uuid, invalidStopTransactionResponsePayload];
      }
      else{
        response = [3, uuid, acceptedStopTransactionResponsePayload];
      }
      ws.send(JSON.stringify(response));
    }
  }
];


let toWS = null;

const wsFunc = (wss) => {
  wss.on('connection', ws => {
      toWS = ws;
      console.log('There is a new client');
    ws.on('message', message => {

      let messageFormat = isJson(message) && Array.isArray(JSON.parse(message));//Burası beklenen gibi 19/08/22 12:34
      if(messageFormat){
        let incomingMessage = JSON.parse(message);

        //console.log(`Received message => ${Object.keys(incomingMessage[2])}`);//Cumadan sonra BAKILACAK!
        //console.log(`Received message => ${incomingMessage.length}`);

        //İlk eleman kontrolü (2 mi, 3 mü, 4 mü filan vs.), yanlış olduğunda mesajla bilgilendirme mesajı verilecek. [4, ...]
        let isRequest = checkForRequest(incomingMessage[0]);

        //Gelen mesaj dizisinin uzunluk kontrolü, yanlış formatta olduğunda bilgilendirme mesajı verilecek. [4, ...]
        let isRequestProperLength = checkRequestForLength(incomingMessage);

        //Metod isminin kontrolü, yanlış formatta olduğunda veya listede yer almadığında bilgilendirme mesajı verilecek. [4, ...]
        let isMethodNameExist = checkForMethodName(incomingMessage[2]);

        //Son parametrenin object olup olmadığının kontrolü, yanlış formatta olduğunda (içerisi dahil) bilgilendirme mesajı verilecek. [4, ...]
        let isLastParameterObjectAndNotNull = checkLastParameter(incomingMessage[3]);
        //console.log(isLastParameterObjectAndNotNull);
        if(isRequest && isRequestProperLength && isMethodNameExist && isLastParameterObjectAndNotNull)
        {
          console.log('Command is in proper format and ready to be evaluated!');
          let methodIndex = 0;
          for(let i=0; i<transactionalFunctions.length; i++)
          {
            if(transactionalFunctions[i].transactionName === incomingMessage[2])
            {
             methodIndex = i;
             break;
            }
          }
          console.log("Method Index = ", methodIndex, "Method Name = ", transactionalFunctions[methodIndex].transactionName);
          transactionalFunctions[methodIndex].method(ws, incomingMessage);
          //// AUTHORIZE ////
          /*
          let authorizeResponse = handleAuthorize(incomingMessage);
          ws.send(JSON.stringify(authorizeResponse));
          */
          //// AUTHORIZE ////

          //// BOOTNNOTIFICATION ////
          /*
          let bootNotificationResponse = handleBootNotification(incomingMessage);
          ws.send(JSON.stringify(bootNotificationResponse));
          */
          //// BOOTNNOTIFICATION ////

          //// DATATRANSFER ////
          /*
          let dataTransferResponse = handleDataTransfer(incomingMessage);
          ws.send(JSON.stringify(dataTransferResponse));
          */
          //// DATATRANSFER ////

          //// DIAGNOSTICSSTATUSNOTIFICATION ////
          /*
          let diagnosticsStatusNotificationResponse = handleDiagnosticsStatusNotification(incomingMessage);
          ws.send(JSON.stringify(diagnosticsStatusNotificationResponse));
          */
          //// DIAGNOSTICSSTATUSNOTIFICATION ////

          //// FIRMWARESTATUSNOTIFICATION ////
          /*
          let firmwareStatusNotificationResponse = handleFirmwareStatusNotification(incomingMessage);
          ws.send(JSON.stringify(firmwareStatusNotificationResponse));
          */
          //// FIRMWARESTATUSNOTIFICATION ////

          //// HEARTBEAT ////
          /*
          let heartbeatResponse = handleHeartbeat(incomingMessage);
          ws.send(JSON.stringify(heartbeatResponse));
          */
          //// HEARTBEAT ////

          //// METERVALUES ////
          /*
          let meterValuesResponse = handleMeterValues(incomingMessage);
          ws.send(JSON.stringify(meterValuesResponse));
          */
          //// METERVALUES ////

          //// STARTTRANSACTION ////
          /*
          let startTransactionResponse = handleStartTransaction(incomingMessage);
          ws.send(JSON.stringify(startTransactionResponse));
          */
          //// STARTTRANSACTION ////

          //// STATUSNOTIFICATION ////
          /*
          let statusNotificationResponse = handleStatusNotification(incomingMessage);
          ws.send(JSON.stringify(statusNotificationResponse));
          */
          //// STATUSNOTIFICATION ////

          /*
          Gerekli olanların kontrolüne bak! 22082022 15:45
          [2,
           "192852964",
           "StopTransaction",
          {
            "idTag":"ey.rweyqjweuywe",
            "meterStop":"Wh",
            "timestamp":Date.now(),
            "transactionId": 445,
            "reason":"EmergencyStop",
            "transactionData":{
              "timestamp": Date.now(),
              "sampledValue":{
                "value":"Raw",
                "context":"Sample.Periodic",
                "format":"Raw",
                "measurand":"Energy.Active.Import.Register",
                "phase":"L1",
                "location":"Outlet",
                "unit":"Wh"
              }
            }
          }]
          */



          //// STOPTRANSACTION ////
          /*
          let stopTransactionResponse = handleStopTransaction(incomingMessage);
          ws.send(JSON.stringify(stopTransactionResponse));
          */
          //// STOPTRANSACTION ////
        }
        else{
          console.log('Please check the format of OCPP Command');
        }
      }
      else
      {
        console.log("Message is not in supported format!");
        ws.close();
      }
       //console.log(`Received message => ${message}`);
    })
    ws.on('close', () => {
      console.log('One of clients is disconnected!');
    })
    ws.send('Hello! Message From Server!!');
  });
}


//////////////////////////////////////////////////////// 1.6 STARTS ENDS IN THERE /////////////////////////////////////////////////////////////////////////////////////////////////////////


module.exports = {router, CentralSystemService, xml, wsFunc};
