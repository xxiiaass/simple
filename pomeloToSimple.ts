import * as Event from 'events';
import {decode, factory, PACKAGE_TYPE } from './package';
let PomeloSocket = require('./pomeloSocket/index');

class PomeloToSimple extends Event {

  private _st:any;

  constructor(st){
    super();
    this._st = st;
    this._st.on('message', (msg)=>{
      let oldMsg = PomeloSocket.decode(msg);
      this.emit('message', factory.createReq({
        id: oldMsg.id,
        route: oldMsg.route,
        body: oldMsg.body
      }).encode())
    })
  }

  send(message){
    let oldMsg = decode(message);
    if(!oldMsg){
      return;
    }
    if(oldMsg.type === PACKAGE_TYPE.PUSH){
      let a = PomeloSocket.encode(false, oldMsg.msg.route, oldMsg.msg.body);
      this._st.send(a);
    }else{
      this._st.send(PomeloSocket.encode(oldMsg.msg.id, oldMsg.msg.route, oldMsg.msg.body));
    }
  }

  close(){
    this._st.disconnect();
  }
}

class PomeloWebSocketServer extends Event {
  private __wss:any;
  private __port:number;
  private __pomeloSt;

  constructor(options){
    super();
    this.__port = options.port;
    this.__pomeloSt = PomeloSocket(options.port, options.host, options);

    this.__pomeloSt.on('connection', (st)=>{
      let ps = new PomeloToSimple(st);
      this.emit('connection', ps);

      st.on('disconnect', ()=>{
        ps.emit('close');
      })
    })
  }

  listen(){
    this.__pomeloSt.start(()=>{});
  }
}


export default PomeloWebSocketServer 