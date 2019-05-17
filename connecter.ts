import * as Event from 'events';

/**
 * 用户基类，路由中回调的第一个参数的类，都应该继承自这个类
 */
class Connecter extends Event {

  onCloseHandler: Function;
  onMessageHandle: Function;

  private readonly __index: number;
  ws: any = null;
  __pushList = [];
  isReq = false;

  constructor(index) {
    super();
    this.__index = index;
  }

  /**
   * 向用户推送数据(当用户处于请求等待时，会延时推送，否则，即时推送)
   * @param route 路径
   * @param msg 消息
   */
  delayPush(route, msg) {
    if (this.isReq) {
      this.__pushList.push({route, msg})
    } else {
      this.ws.push({
        route: route,
        body: msg || {}
      });
    }
  }

  /**
   * 向用户推送数据(即时推送)
   * @param route 路径
   * @param msg 消息
   */
  push(route, msg) {
    this.ws.push({
      route: route,
      body: msg || {}
    });
  }

  pushList() {
    this.__pushList.map(push => {
      this.ws.push({
        route: push.route,
        body: push.msg
      })
    });
    this.__pushList = [];
  }

  get index() {
    return this.__index;
  }

  /**
   * 将该用户踢下线，会发射’close‘事件
   */
  beKick() {
    this.push('onKick', {
      reason: '賬號在別處登錄'
    });
    this.ws.close();
    // this.emit('close');
  }

  /**
   * 注册连接断开时的回调
   * @param handle
   */
  onClose(handle: Function) {
    this.onCloseHandler = handle;
  }


}

export default Connecter;