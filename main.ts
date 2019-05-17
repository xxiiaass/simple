import UserManage from './userManage';
import Connecter from './connecter';
import Route from './route';
import Server from './server';
import ReqTools from './reqTools';
import {RouteHandler, User} from './interface';


class Simple <T extends User> {

  userManage: UserManage<T>;

  private server: Server;  //网络连接的服务器
  private routes: (Route<T> | RouteHandler<T>)[] = [];  //注册的路由列表
  private __onConnect: Function;
  private __onClose: Function;
  private __userClass:any;

  constructor(opts) {
    this.server = new Server(opts);
    this.userManage = new UserManage();
  }

  /**
   * 添加路由
   * @param route
   */
  addRoute(route: Route<any>) {
    route.app = this;
    this.routes.push(route);
    return this;
  }

  /**
   * 添加中间件
   * @param middle
   */
  use(middle: Route<any> | RouteHandler) {
    this.routes.push(middle);
    return this;
  }

  /**
   * 添加路由或中间件
   * @param routes Array
   */
  addRoutes(...routes: Route<any>[]) {
    routes.map(r => {
      this.addRoute(r);
    })
    return this;
  }

  /**
   * 添加中间件
   * @param path
   * @param middle
   */
  addMiddle<T = Connecter>(path, middle: RouteHandler<T>) {
    let route = Route.create<T>();
    route.sign(path, middle);
    this.addRoute(route);
  }

  /**
   * 设置user的类，路由回调中实例化的就是这个类
   * @param user
   */
  userClass(user) {
    this.__userClass = user;
    return this;
  }

  /**
   * 用户连接时的回调
   * @param handler
   */
  onConnection(handler: Function) {
    this.__onConnect = handler;
    return this;
  }

  /**
   * 用户断开连接时的回调
   * @param handler
   */
  onClose(handler: Function) {
    this.__onClose = handler;
    return this;
  }

  private init() {
    this.server.onConnection((conter:Connecter)=> {
      let initUser:T = new (this.__userClass)(conter)
      this.userManage.bindIndex(initUser);
      this.__onConnect && this.__onConnect(initUser);

      conter.onMessageHandle = async (conter:Connecter, msg) => {
        let user:T = this.userManage.indexGet(conter.index)
        let result = null;
        let tools = new ReqTools(msg.body);
        tools.send = msg=>{
          result = msg;
        };

        let middles:RouteHandler[] = [];
        for (let route of this.routes) {
          let middle:RouteHandler<any> | false = null;
          if(route instanceof Route){
            middle = route.isMatch(msg.route);
            if(!middle){
              continue;
            }
            middles = [...middles, ...route.filters];
          }else{
            middle = route;
          }
          middles.push(middle);
        }

        try{
          let returnResult = null;
          let doMiddle = async (index, u, b, t)=>{
            if(!middles[index]){
              return;
            }
            return await middles[index](u, b, t, async (nu, nb, nt)=>{
              returnResult = await doMiddle(index+1, nu || u, nb || b, nt || t) || returnResult;
            })
          };
          returnResult = await doMiddle(0, user, msg.body, tools) || returnResult;
          return result || returnResult
        }catch(err){
          console.log(err);
          return err;
        }
      };

      conter.onClose(async (conter:Connecter) => {
        let user:T = this.userManage.indexGet(conter.index)
        if(!user){
          console.warn('一个没有引用的用户掉线');
          return;
        }
        user.__closeHandler && await user.__closeHandler();
        this.__onClose && await this.__onClose(user);
        this.userManage.removeConnectUser(user.conter.index);
        this.userManage.removeSceneUser(user.id);
      });

    });
    return this;
  }

  /**
   * 开始监听
   * @param port 监听的端口
   */
  listen(port?) {
    this.init().server.listen(port);
  }
}

function _factory<T extends User>(opts?):Simple<T>{
  return new Simple<T>(opts);
}

export {_factory as SimpleFactory, Simple as SimpleClass}