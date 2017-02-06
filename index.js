"use strict"

const http = require('http');
const https = require('https');
const express = require('express');
const request = require('request');
const url = require('url');

const fixieURL = url.parse(process.env.FIXIE_URL);
const requestURL = url.parse('https://www.google.com:443');

const PORT = 3000;

let cliSoc, x, svrReq;
const server = http.createServer((cliReq, cliRes) => {
    let svrSoc;
    
    x = url.parse(cliReq.url);
    cliReq.headers['Proxy-Authorization'] = `Basic ${new Buffer(fixieURL.auth).toString('base64')}`;

	svrReq = http.request({
		host: fixieURL.hostname,
		port: fixieURL.port,
		path: requestURL.href,
		method: "GET",
		headers: cliReq.headers,
		agent: cliSoc.$agent
	}, (svrRes) => {
        svrSoc = svrRes.socket;
		cliRes.writeHead(svrRes.statusCode, svrRes.headers);
		svrRes.pipe(cliRes);
	});
    cliReq.pipe(svrReq);

    svrReq.on('error', (err) => {
        cliRes.writeHead(400, err.message, {'content-type': 'text/html'});
        cliRes.end('<h1>' + err.message + '<br/>' + cliReq.url + '</h1>');
        onErr(err, 'svrReq', x.hostname + ':' + (x.port || 80), svrSoc);
    });
})
.on('clientError', (err, cliSoc) => {
	cliSoc.end();
	console.error(err, 'cliErr', '');
})
.on('connect', (req, res) => {
	console.log(222);
})
.on('connection', (req, res) => {
	cliSoc = req
	cliSoc.$agent = new http.Agent({keepAlive: true});
	cliSoc.$agent.on('error', err => console.log('agent:', err));
})
.listen(process.env.PORT || PORT, () => {
    console.log('Node app is running on port', PORT);
});

const onErr = (err, msg, url, soc) => {
  if (soc) soc.end();
  console.log('%s %s: %s', new Date().toLocaleTimeString(), msg, url, err + '');
}