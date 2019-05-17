import * as Joi from 'joi';

const ERROR = 500;
const SUCCESS = 200;

interface sendFunc {
  (any):any;
}


export default class ReqTools {
  private _params;

  send: sendFunc;

  constructor(params) {
    this._params = params
  }

  error(error, isSend=true){
    if(this.send && isSend){
      this.send({
        code: ERROR,
        msg: error
      });
    }
    return {
      code: ERROR,
      msg: error
    }
  }

  set params(p){
    this._params = p;
  }

  get params(){
    return this._params;
  }

  success(resp:any={}){
    resp.code = SUCCESS;
    if(this.send){
      this.send(resp);
    }
    return resp;
  }

  joi(keys){
    const schema = Joi.object().keys(keys);
    const {error, value} = Joi.validate(this.params, schema, {
      allowUnknown:true
    });
    if(error){
      throw error.message || error.details[0].message;
    }
    this._params = value;
    return;
  }
}