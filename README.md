# Weishaupt WCM-COM custom node for Node-RED

This is a custom node, written for  [Node-RED](http://nodered.org). It retrieves data from a Weishaupt WCM-COM communication module, connected to the heating unit.

## Installation

Install via Node-RED Manage Palette

```
node-red-contrib-weishaupt-wcmcom
```

Install via npm

```shell
$ cd ~/.node-red
$ SOON: npm install node-red-contrib-weishaupt-wcmcom
npm install schmiegelt/node-red-contrib-weishaupt-wcmcom
# then restart node-red
```


## Usage
On every input received, the node queries the WCM-COM module for process values. It replaces the payload of the incoming message with a JSON objects like this:

```json
{
    "oil_meter":3803,
    "load_setting":0,
    "outside_temperature":4,
    "warm_water_temperature":45.9,
    "flow_temperature":31.9,
    "flue_gas_temperature":29.9
}

```
If the connection cannot be established, the input message is discarded and no output message is generated.


## Notes
[node-fetch](https://www.npmjs.com/package/node-fetch) is limited to v2, as v3 has been converted to an ESM-only module. 