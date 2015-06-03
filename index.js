/* jslint node: true */
"use strict";

global.modulesCache = global.modulesCache || {};
if(global.modulesCache['procedure']){
  module.exports = global.modulesCache['procedure'];
  return;
}

module.exports = global.modulesCache['procedure'] = Procedure;
function Procedure(){
  this.jobs = [];
  this.main = new Queue();
  this.main.main = true;
  this.main.procedure = this;
}
  Procedure.prototype.add = function(name,func){
    var procedure = this;
    var args = Array.prototype.slice.call(arguments);
    if(typeof name !== "string"){
        func = name;
        name = "Job-"+procedure.jobs.length;
        args = args.slice(1);
    } else {
        args = args.slice(2);
    }
    procedure.jobs.push({name:name,func:func,args:args});
    return procedure;
  };
  Procedure.prototype.queue = function(){
    return this.resolve('queue');
  };
  Procedure.prototype.race = function(){
    return this.resolve('race');
  };
  Procedure.prototype.resolve = function(mode){
    var procedure = this;
    var resolve;
    resolve = mode === 'race' ? new Race() : new Queue();
    resolve.jobs = procedure.jobs;
    resolve.procedure = procedure;
    procedure.jobs = [];
    resolve.handler = function(error){
      var data = Array.prototype.slice.call(arguments);
      if(error){
        procedure.main.handler.apply(procedure.main,data);
      } else {
        procedure.main.done.apply(procedure.main,[undefined].concat(data));
      }
    };
    procedure.main.jobs.push({func:resolve.launch.bind(resolve),args:[]});
    return procedure;
  };
  Procedure.prototype.launch = function(handler){
    var procedure = this;
    procedure.main.handler = handler;
    procedure.main.jobs = procedure.main.jobs.concat(procedure.jobs);
    procedure.main.launch();
  };


Procedure.Race = Race;
function Race(){
  this.handler = undefined;
  this.jobs = [];
  this.results = {};
  this.errors = [];
}
  Race.prototype.launch = function(){
    var data = Array.prototype.slice.call(arguments);
    data = data.slice(0,-1);
    if(this.jobs.length===0){
      this.handler(undefined,this.results);
    } else {
      for(var i = 0,l=this.jobs.length;i<l;i++){
        var job = this.jobs[i];
        launcher(this,job.name,job.func,job.args);
      }
    }
  };
  Race.prototype.done = function Done(name,error){
    var data = Array.prototype.slice.call(arguments).slice(1);
    if(error){
      this.errors.push(error);
      data = data.slice(1);
    }
    this.results[name] = data.slice(1);
    if(this.jobs.length===Object.keys(this.results).length){
      if(this.errors.length>0){
        this.handler(this.errors);
      } else {
        this.handler(undefined,this.results);
      }
    }
  };


Procedure.Queue = Queue;
function Queue(){
  this.handler = undefined;
  this.jobs = [];
}
  Queue.prototype.launch = function(){
    var data = Array.prototype.slice.call(arguments);
    if(!this.main){
      data = data.slice(0,-1);
    }
    if(this.jobs.length > 0){
      var job = this.jobs[0];
      launcher(this,job.name,job.func,data.concat(job.args));
    } else {
      this.handler.apply(this,data);
    }
  };
  Queue.prototype.done = function Done(name,error){
    var data = Array.prototype.slice.call(arguments).slice(1);
    if(error){
      error = [error];
      this.handler.apply(this,[error].concat(data.slice(1)));
    } else {
      this.jobs.shift();
      if(this.jobs.length > 0){
        var job = this.jobs[0];
        launcher(this,job.name,job.func,data.slice(1).concat(job.args));
      } else {
        this.handler.apply(this,data);
      }
    }
  };

function launcher(context,name,func,args){
  var catcher = context.done.bind(context,name);
  catcher.result = catcher.bind(context,undefined);
  try {
    func.apply(context,args.concat([catcher]));
  } catch (error) {
    error.message = "Procedure error in '"+name+"' > "+error.name+" "+error.message;
    error.name = "ProcedureError";
    catcher(error);
  }
}

/* ---------------------------- *

function fileLoader(path,done){                        // File loader simulation.
  console.log("Opening file:'"+path+"'...");
  if(path==='./secundary2.key'){
    //throw new Error("Ops!");                         // Error simulation
  }
  done.result({file:path});                            // Finalize task & return result
}
var shared = {};                                       // Shared closure


var procedure = new Procedure();                       // Create procedure
procedure
.add("Load primary",fileLoader,'./primary.key')        // Add new task
.add("Load secundary",fileLoader,'./secundary.key')    // Add new task
.add("Load shared",fileLoader,'./shared.key')          // Add new task
.race()                                                // Resolve tasks in race mode
.add(function(files,done){                             // Add new task
    shared.files1 = files;
    console.log(shared);
    done();                                            // Finalize task
})
.queue()                                               // Resolve tasks in queue mode
.add("Load primary",fileLoader,'./primary2.key')       // Add new task
.add("Load secundary",fileLoader,'./secundary2.key')   // Add new task
.add("Load shared",fileLoader,'./shared2.key')         // Add new task
.race()                                                // Resolve tasks in race mode
.add(function(files,done){                             // Add new task
    shared.files2 = files;
    console.log(shared);
    done.result(shared);                                 // Finalize task & return result
})
.launch(function(errors){                              // Procedure controller.
    if(errors){                                        // Array of Errors || undefined
        console.log("END[ERROR]",arguments);
    } else {
        console.log("END[OK]",arguments);
    }
})
;

/* ---------------------------- */
