const DigestFetch = require('digest-fetch')

const endPoint = "/parameter.json"
const queryTelegram =  '{"prot":"coco","telegramm":[[10,0,1,4176,0,0,0,0],[10,0,1,3793,0,0,0,0],[10,0,1,3792,0,0,0,0],[10,0,1,12,0,0,0,0],[10,0,1,14,0,0,0,0],[10,0,1,3101,0,0,0,0],[10,0,1,325,0,0,0,0],[10,0,1,3197,0,0,0,0]]}'

module.exports = function(RED) {

    //encoding what is queried, along with the readable name and the template (defining how numbers are handled)
    const queryObjects = 
        [
            {"key": "oil_meter", "code": 3793, "template": "VALUE", "filter0": true},
            {"key": "load_setting", "code": 4176, "template": "DECIMAL_VALUE", "filter0": false},
            {"key": "outside_temperature", "code": 12, "template": "TEMP", "filter0": false},
            {"key": "warm_water_temperature", "code": 14, "template": "TEMP", "filter0": true},
            {"key": "flow_temperature", "code": 3101, "template": "TEMP", "filter0": true},
            {"key": "flue_gas_temperature", "code": 325, "template": "TEMP", "filter0": true}
        ]

    var client;
    var queryURL;
    var options = {
        method: 'POST',
        body: queryTelegram,
        timeout: 5000
    };

    var lastResult = undefined;

    function setup(node) {
        client = new DigestFetch(node.credentials.username, node.credentials.password)
        queryURL = "http://" +  node.credentials.host + endPoint;
    }
    
    function getTemperture(lowByte, highByte) {
        return (lowByte + 265 * highByte) / 10
    }


    function getValue(lowByte, highByte) {
        return lowByte + 265 * highByte
    }
    
    function getDecimalValue(lowByte, highByte) {
        return (lowByte + 265 * highByte) / 10
    }


    async function queryHeadExchanger() {
        try {
            console.log("Start Query")
            const resonse = await client.fetch(queryURL, options)
            const returnTelegram = (await resonse.json()).telegramm

            //initialize
            var resultObject = {}
            queryObjects.forEach(queryObject => {
                resultObject[queryObject.key] = 0
            })

            returnTelegram.forEach(telegrammElement => {
                queryObjects.forEach(queryObject => {
                    
                    if (telegrammElement[3] == queryObject.code) {
                        var key = queryObject.key
                        switch (queryObject.template) {
                            case "VALUE":
                                resultObject[key] = resultObject[key] + getValue(telegrammElement[6], telegrammElement[7])
                                break;
                            case "DECIMAL_VALUE":
                                resultObject[key] = getDecimalValue(telegrammElement[6], telegrammElement[7])
                                break;
                            case "TEMP":
                                resultObject[key] = getTemperture(telegrammElement[6], telegrammElement[7])
                                break;
                            default:
                                break;
                        }

                        //Error ha handling: 
                        //if the value is 0, something went wrong, so discard the result
                        if(resultObject[key].filter0) {
                            throw new Error(`Retrieving ${ key } returned 0`)
                        }
                       

                    }
                    
                });
                 //Special Handling for Oil Meter
                if (telegrammElement[3] == 3792) {
                    resultObject["oil_meter"] = resultObject["oil_meter"]+telegrammElement[6]*1000
                }
            });

            //Occasionally, the one of the two oil meter readings is missing. To prevent this from happening,
            if (lastResult && lastResultresultObject["oil_meter"] < lastResult["oil_meter"]) {
                throw new Error("Oil meter readings cannot decrease")
            }

        }
        catch (error) {
            console.log(error)
            throw new Error("Could not retrive data")

        }
        lastResult = [...resultObject]
        console.log("End Query")
        return resultObject
    }

    function WcmComNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;

        setup(node)

        node.on('input',  async function(msg) {
            try {
                msg.payload = await queryHeadExchanger();
                node.send(msg);
            }
            catch {
                return null
            }
        });
    }

    
    RED.nodes.registerType("wcm-com",WcmComNode, {
        credentials: {
            host: {type:"text"},
            username: {type:"text"},
            password: {type:"password"}
        }
    });
}