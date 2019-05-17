import Connecter from './connecter';
import {User} from './interface';

class UserManage <T extends User>{
   indexUsers = {};
   idUsers = {};

  bindIndex(user:T){
    this.indexUsers[user.conter.index] = user;
  }

  bindId(user:T){
    this.idUsers[user.id] = user;
  }

  kick(id){
    if(!this.idUsers[id]){
      return;
    }
    this.idUsers[id].conter.beKick();
    this.removeConnectUser(this.idUsers[id].index);
    this.removeSceneUser(id);
  }

  removeConnectUser(index:number){
    if(!this.indexUsers[index]){
      return;
    }
    delete this.indexUsers[index];
  }

  removeSceneUser(id:string){
    if(!this.idUsers[id]){
      return;
    }
    delete this.idUsers[id];
  }

  changeConter(user:T, newConter:Connecter ){
    this.removeConnectUser(newConter.index);
    this.removeConnectUser(user.conter.index);
    user.conter.beKick();
    user.conter = newConter;
    this.indexUsers[newConter.index] = user;
  }

  idGet(id:string):T{
    return this.idUsers[id];
  }

  indexGet(index:number):T{
    return this.indexUsers[index];
  }

  push(ids, route, msg){
    ids.map((id)=>{
      if(!this.idUsers[id]){
        return;
      }
      this.idUsers[id].push(route, msg);
    })
  }

  delayPush(ids, route, msg){
    ids.map((id)=>{
      if(!this.idUsers[id]){
        return;
      }
      this.idUsers[id].delayPush(route, msg);
    })
  }

  broadcast(route, msg){
    for(let id in this.idUsers){
      this.idUsers[id].push(route, msg);
    }
  }
}

export default UserManage;