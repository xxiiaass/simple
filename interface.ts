import ReqTools from './reqTools';
import Connecter from "./connecter";

interface next {
  (user?, msg?, tools?):Promise<any>;
}

interface RouteHandler <T=any> {
  (user:T, body:any, tool?:ReqTools, n?:next):any;
}


interface User {
  conter:Connecter; //网络连接，数据传输层
  id:string;
  __closeHandler:Function;
  onClose:Function;
  on:Function;
  emit:Function;
}


export {RouteHandler, User}