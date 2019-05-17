import * as WebSocket from 'ws';
import * as https from 'https';
import PomeloSocket from './pomeloToSimple'
import * as fs from 'fs';

export default class Socket {
  static craeteServer(opts){
    if(opts.protocol === 'pomelo'){
      return Socket.careatePomelo(opts);
    }else{
      if(opts.cert){
        return Socket.createWss(opts);
      }else{
        return Socket.createWs(opts);
      }
    }
  }

  static createWss(opts){
    let server = https.createServer({
      cert: fs.readFileSync(opts.cert),
      key: fs.readFileSync(opts.key),
      rejectUnauthorized: false
    });
    let wss = new WebSocket.Server({ server });
    wss.listen = ()=>{
      server.listen(opts.port, ()=>{
      });
    };
    return wss;
  }

  static createWs(opts){
    let ws = new WebSocket.Server({port: opts.port});
    ws.listen = ()=>{};
    return ws;
  }

  static careatePomelo(opts){
    if(opts.cert){
      opts.ssl = opts.ssl || {};
      opts.ssl.cert = fs.readFileSync(opts.cert);
    }
    if(opts.key){
      opts.ssl = opts.ssl || {};
      opts.ssl.key = fs.readFileSync(opts.key);
    }
    return new PomeloSocket(opts);
  }
}