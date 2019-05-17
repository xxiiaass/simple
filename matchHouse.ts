import * as Event from 'events';
import {MatchEntity, matchType} from './matchEntity';

//排列组合中的组合算法
let choose = (arr, size) => {
  let allResult = [];
  (function (arr, size, result) {
    let arrLen = arr.length;
    if (size > arrLen) {
      return;
    }
    if (size === arrLen) {
      allResult.push([].concat(result, arr))
    } else {
      for (let i = 0; i < arrLen; i++) {
        let newResult = [].concat(result);
        newResult.push(arr[i]);

        if (size === 1) {
          allResult.push(newResult);
        } else {
          let newArr = [].concat(arr);
          newArr.splice(0, i + 1);
          arguments.callee(newArr, size - 1, newResult);
        }
      }
    }
  })(arr, size, []);
  return allResult;
}


export default abstract class MatchHouse extends Event {
  private entityQueues = {};
  private ids = {};

  /**
   * 进行匹配, 匹配成功会发送'matching'事件
   * @param entity 匹配实例
   */
  entry(entity: MatchEntity) {
    if(this.ids[entity.id]){
      return false;
    }
    let targetTypes = entity.targetMatchTypes();
    let index = -1;
    let matchStatus: any = null;
    for (let j = 0; j < targetTypes.length; j++) {
      matchStatus = this.recursionSelectMatch(entity, targetTypes[j]);
      if (matchStatus.isMatch) {
        index = j;
        break;
      }
    }
    if(index != -1){
      let entitys:MatchEntity[] = [entity];
      let sort = this.parseAddSort(targetTypes[index], matchStatus.indexs);
      this.getEntitys(sort).map(function(e){
        entitys.push(e);
      });
      this.emit('matching', entitys);
    }else{
      this.add(entity);
    }
  }

  /**
   * 离开匹配队列
   * @param entity
   * @return 是否离开成功
   */
  leave(entity: MatchEntity):boolean{
    if(!this.ids[entity.id]){
      return false;
    }
    let index = this.queue(entity.matchType).findIndex(e=>{
      return e.id === entity.id
    });
    if(index === -1){
      return false;
    }
    this.remove(entity.matchType, index);
    return true;
  }

  protected queue(type) {
    if (!this.entityQueues[type]) {
      this.entityQueues[type] = [];
    }
    return this.entityQueues[type];
  }

  protected get allQueueList():MatchEntity[] {
    let list = [];
    for(let type in this.entityQueues){
      list = list.concat(this.queue(type));
    }
    return list;
  }

  /**
   * 从队列中移除人
   * @param type
   * @param index
   * @returns {T|*}
   */
  protected remove(type, index) {
    let s = this.queue(type).splice(index, 1)[0];
    delete this.ids[s.id];
    return s;
  }

  /**
   * 向队列中添加人
   * @param team
   */
  protected add(entity: MatchEntity) {
    if (this.ids[entity.id]) {
      return;
    }
    this.queue(entity.matchType).push(entity);
    this.ids[entity.id] = entity.matchType;
  }

  /**
   * 解析队伍加入的顺序
   * @param types
   * @returns {Array}
   */
  protected parseAddSort (type, teamQueueIndexs) {
    let s = [];
    for(let t in type.target) {
      for(let j = 0; j< type.target[t]; j++){
        s.push({
          type:t,
          index:teamQueueIndexs[t][j] - j
        });
      }
    }
    return s;
  }

  /**
   * 根据sort数据从queue中取出队伍，sort中的index是特殊处理过的
   * @param sort
   */
  protected getEntitys(sort) {
    let ret = [];
    for (let k = 0; k < sort.length; k++) {
      ret.push(this.remove(sort[k].type, sort[k].index))
    }
    return ret;
  }

  protected recursionSelectMatch(entity: MatchEntity, types: matchType) {
    let gameMax = 0;
    for (let type in types.target) {
      gameMax += types.target[type];
    }
    let recursionSelect = (entitys, selectedTypes, targetTypes: matchType) => {
      let sumPlayer = 0;

      entitys.map(t => {
        sumPlayer += t.playerNum;
      })
      let curType = '';
      for (let type in targetTypes.target) {
        if (selectedTypes.indexOf(type) === -1) {
          curType = type;
          selectedTypes.push(type);
          break;
        }
      }
      let teamQueue = this.queue(curType);

      let teamIndexs = [];
      for (let i = 0; i < teamQueue.length; i++) {
        if (!targetTypes.single || targetTypes.single(teamQueue[i])) {
          teamIndexs.push(i);
        }
      }

      if (teamIndexs.length < targetTypes.target[curType]) {
        return false;
      }

      let pailies = choose(teamIndexs, targetTypes.target[curType]);
      for (let p of pailies) {
        let oldPlayerNum = sumPlayer;
        p.map(idx => {
          oldPlayerNum += teamQueue[idx].playerNum
        })

        if (oldPlayerNum < gameMax) {
          let res = recursionSelect([].concat(entitys, p.map(idx => {
            return teamQueue[idx]
          })), [].concat(selectedTypes), targetTypes);
          if (res) {
            let tmp = {};
            tmp[curType] = p;
            return Object.assign(res, tmp);
          }
        } else {
          if (!targetTypes.multi || targetTypes.multi([].concat(entitys, p.map(idx => {
            return teamQueue[idx]
          })))) {
            let tmp = {};
            tmp[curType] = p;
            return tmp;
          }
        }
      }
      return false;
    }

    let indexs = recursionSelect([entity], [], types);
    return {
      isMatch: !!indexs,
      indexs: indexs
    }
  }
}