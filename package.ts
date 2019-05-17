enum PACKAGE_TYPE {
  REQUEST,
  RESPONSE,
  PUSH
}

class Package{
  type:PACKAGE_TYPE;
  msg:any;

  constructor(type:PACKAGE_TYPE){
    this.type = type;
    this.msg = {};
  }

  encode():string{
    return JSON.stringify({
      type: this.type,
      msg: this.msg
    })
  }
}

let decode = (str:string):Package|false=>{
  try{
    let obj = JSON.parse(str);
    let p = new Package(obj.type);
    p.msg = obj.msg;
    return p;
  }catch(err){
    return false;
  }
};

let factory = {
  createReq: (msg={}):Package=>{
    let p = new Package(PACKAGE_TYPE.REQUEST);
    p.msg = msg;
    return p;
  },
  createResp: (msg={}):Package=>{
    let p = new Package(PACKAGE_TYPE.RESPONSE);
    p.msg = msg;
    return p;
  },
  createPush: (msg={}):Package=>{
    let p = new Package(PACKAGE_TYPE.PUSH);
    p.msg = msg;
    return p;
  },
}

export {factory, decode, PACKAGE_TYPE, Package}