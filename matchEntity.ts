//匹配目标的格式
interface matchType {
  target: any;  //目标的类型及数量
  single?(match: MatchEntity): boolean;  //自身实例会对所有目标实例调用此函数，返回true才是符合匹配要求的
  multi?(matchs: MatchEntity[]): boolean; //自身实例会以当前所有的目标组合为参数调用此函数，返回true才是符合匹配要求的
}


/**
 * 所有使用matchhouse进行匹配的实例，都应该实现这个接口
 */
abstract class MatchEntity {
  abstract targetMatchTypes(): matchType[]; //返回匹配的目标
  abstract get matchType(): string; //返回自身的匹配类型
  abstract get id(): string;
  matchBeginTime:number;
}

export {MatchEntity, matchType}