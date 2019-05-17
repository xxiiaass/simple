//import Socket from './socket';
import {decode, factory, PACKAGE_TYPE,Package } from './package';
import Connecter from './connecter';
const WebSocket = require('ws');

class Server {

  private __onConnect: Function;
  private __userIndex = 0;
  private __opts:any;

  constructor(options) {
    this.__opts = options;
  }

  onConnection(handler: Function) {
    this.__onConnect = handler;
    return this;
  }

  private indexInc(){
    if(this.__userIndex > 999999999){
      this.__userIndex = 0;
      return;
    }
    this.__userIndex++;
  }

  listen(port) {
    if(port){
      this.__opts.port = port;
    }
    let wss = new WebSocket.Server(this.__opts);
    wss.on('connection', (ws) => {
      let user = new Connecter(this.__userIndex);
      this.indexInc();
      user.ws = ws;
      ws.push = (data)=>{
        ws.send(factory.createPush(data).encode())
      };

/*
      if (!ws.__user) {
        ws.__user = new (this.__userClass)(this.__userIndex);
        this.indexInc();

        ws.__user.on('push', (data) => {
          try {
            ws.send(factory.createPush(data).encode())
          } catch (err) {
            ws.close();
            console.log(err);
          }
        });
        ws.__user.on('close', (data) => {
          ws.close();
        })
      }*/
      this.__onConnect && this.__onConnect(user);

      ws.on('message', (message) => {
        let pack = decode(message);
        if (!pack) {
          return;
        }

        if (pack.type !== PACKAGE_TYPE.REQUEST) {
          return;
        }
        pack.msg.body = pack.msg.body || {};
        user.isReq = true;
        let proOrData = (user.onMessageHandle && user.onMessageHandle(user, pack.msg));
        if(proOrData){
          if(proOrData instanceof Promise){
            proOrData.then(res=>{
              if(!res){
                return;
              }

              let p = factory.createResp();
              p.msg = {
                id: (<Package>pack).msg.id,
                route: (<Package>pack).msg.route,
                body:res
              };
              try{
                ws.send(p.encode());
                user.pushList();
                user.isReq = false;
              }catch(err){
                user.isReq = false;
                ws.close();
              }
            }).catch(err=>{
              console.error(err);
            })
          }else{
            let p = factory.createResp();
            p.msg = {
              id:pack.msg.id,
              route:pack.msg.route,
              body:proOrData
            };
            try{
              ws.send(p.encode());
              user.pushList();
              user.isReq = false;
            }catch(err){
              user.isReq = false;
              ws.close();
            }
          }
        }
      });

      ws.on('close',  () => {
        //先执行在业务层注册的回调
        user.onCloseHandler && user.onCloseHandler(user).then(doc=>{

        }).catch(err=>{
          console.error(err);
        });;
      })
    });

    wss.listen && wss.listen();
  }
}

export default Server;

