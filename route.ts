import {RouteHandler} from './interface';

class Route<T>{

  private handlers:{path:string|RegExp, cb:RouteHandler<T>}[];
  private __routeIndex:number;
  private pathPre=''; //路由通用前缀
  private __app:any;

  filters:RouteHandler[] = []

  static create<T>(pre=''){
    return new Route<T>(pre);
  }

  constructor(pre){
    this.handlers = [];
    this.__routeIndex = 0;
    this.pathPre = pre;
  }

  filter(filter:RouteHandler){
    this.filters.push(filter);
  }

  set app(app){
    this.__app = app;
  }

  get app(){
    return this.__app;
  }


  /**
   * 注册回调
   * @param path 路径
   * @param cb 回调
   */
  sign(path:string|RegExp, cb:RouteHandler<T>){
    this.handlers[this.__routeIndex] = {
      path:path,
      cb:cb
    }
    this.__routeIndex++;
  }

  /**
   * 判断这个路由是否有匹配path的回调, 如果有，返回该回调
   * @param path
   */
  isMatch(path:string):false|RouteHandler<T>{
    for(let index =0; index < this.handlers.length; index++){
      let result;
      if(typeof this.handlers[index].path === 'string'){
        result = (this.pathPre + this.handlers[index].path === path);
      }else{
        if(path.indexOf(this.pathPre) !== 0){
          result = false;
        }else{
          path = path.substr(this.pathPre.length);
          result = (<RegExp>this.handlers[index].path).test(path);
        }
      }
      if(result){
        return this.handlers[index].cb;
      }
    }
    return false;
  }
}


export default Route;
