/* jslint node: true */
"use strict";

module.exports = Procedure;
function Procedure(data){
  this.data = data || {};
  this.jobs = [];
  this.main = new Queue();
  this.main.data = this.data;
}
  Procedure.prototype.add = function(func){
    var procedure = this;
    var args = Array.prototype.slice.call(arguments).slice(1);
    procedure.jobs.push({func:func,args:args});
    return procedure;
  };
  Procedure.prototype.queue = function(handler){
    var procedure = this;
    var queue = new Queue();
    queue.jobs = procedure.jobs;
    queue.data = procedure.data;
    procedure.jobs = [];
    queue.handler = function(error){
      if(handler){handler.call(queue,error);}
      if(error){
        procedure.main.handler(error);
      } else {
        procedure.main.done();
      }
    };
    procedure.main.jobs.push({func:queue.launch.bind(queue)});
    return procedure;
  };
  Procedure.prototype.race = function(handler){
    var procedure = this;
    var race = new Race();
    race.jobs = procedure.jobs;
    race.data = procedure.data;
    procedure.jobs = [];
    race.handler = function(error){
      if(handler){handler.call(race,error);}
      if(error){
        procedure.main.handler(error);
      } else {
        procedure.main.done();
      }
    };
    procedure.main.jobs.push({func:race.launch.bind(race)});
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
  this.jobs = [];
  this.data= {};
  this.counter = 0;
}
  Race.prototype.launch = function(){
    this.counter = this.jobs.length;
    for(var i = 0,l=this.jobs.length;i<l;i++){
      Procedure.Launcher(this,this.jobs[i]);
    }
  };
  Race.prototype.done = function(){
    if(--this.counter === 0){
     this.handler();
    }
  };
  Race.prototype.error = function(error){
    this.handler(error);
  };


Procedure.Queue = Queue;
function Queue(){
  this.jobs = [];
  this.data= {};
}
  Queue.prototype.launch = function(){
    if(this.jobs.length > 0){
      Procedure.Launcher(this,this.jobs[0]);
    } else {
      this.handler();
    }
  };
  Queue.prototype.done = function(){
    this.jobs.shift();
    this.launch();
  };
  Queue.prototype.error = function(error){
    this.handler(error);
  };


Procedure.Launcher = Launcher;
function Launcher(context,job){
  try {
    job.func.apply(context,job.args);
  } catch (error) {
    context.handler(error);
  }
}






/* ---------------------------- *

// Launcher MOD for browser version.
Procedure.Launcher = function jobLauncher(context,job){
  setTimeout(function(){
    try {
      job.func.apply(context,job.args);
    } catch (error) {
      context.handler(error);
    }
  },Math.round(Math.random()*500));
};

/* ---------------------------- *


// Test Procedure.Race & Procedure.Queue:

function Myhand(a,b,c){
  var job = this;
  console.log(a,b,c);
  job.done();
}

var race = new Race();
race.jobs.push({func:Myhand,args:['A1','A2','A3']});
race.jobs.push({func:Myhand,args:['A4','A5','A6']});
race.jobs.push({func:Myhand,args:['A7','A8','A9']});
race.handler = function(error){
  console.log("Finished!",error);
};
race.launch();

var queue = new Queue();
queue.jobs.push({func:Myhand,args:['B1','B2','B3']});
queue.jobs.push({func:Myhand,args:['B4','B5','B6']});
queue.jobs.push({func:Myhand,args:['B7','B8','B9']});
queue.handler = function(error){
  console.log("Finished!",error);
};
queue.launch();

/* ---------------------------- *

// Test Procedure:

var procedure = new Procedure({counter:10}); // <- Initial data for share.

// Add handlers inline...
procedure
.add(function(){
  var job = this;
  var name = "Race[A][1]";
  console.log(name);
  job.data.counter++;
  job.done();
})
.add(function(){
  var job = this;
  var name = "Race[A][2]";
  console.log(name);
  job.data.counter++;
  job.done();
})
.add(function(){
  var job = this;
  var name = "Race[A][3]";
  console.log(name);
  job.data.counter++;
  job.done();
})
.add(function(){
  var job = this;
  var name = "Race[A][4]";
  console.log(name);
  job.data.counter++;
  job.done();
})
.add(function(){
  var job = this;
  var name = "Race[A][5]";
  console.log(name);
  job.data.counter++;
  job.done();
})
// Concurrent execution of pending jobs.
.race(function(error){
  if(!error){
    console.log("Race[A] finished!");
    console.log("Counter:",this.data.counter);
  }
});


// Add hanlers by reference with params [.add(handler,param1,param2,...)].
var Myhand = function(name){
  var job = this;
  console.log(name);
  job.data.counter++;
  job.done();
};

procedure
.add(Myhand,"Queue[A][1]")
.add(Myhand,"Queue[A][2]")
.add(Myhand,"Queue[A][3]")
.add(Myhand,"Queue[A][4]")
.add(Myhand,"Queue[A][5]")
// Queue execution (in order) of pending jobs.
.queue(function(error){
  if(!error){
    console.log("Queue[A] finished!");
    console.log("Counter:",this.data.counter);
  }
})
;



// Add repetitive jobs - Race version
for(var i=0;i<10;i++){ // <- Add repetitive jobs whith variable arguments.
  procedure.add(Myhand,"Race[B]["+i+"]");
}
procedure.race(function(error){
  if(!error){
    console.log("Race[B] finished!");
    console.log("Counter:",this.data.counter);
  }
});


// Add repetitive jobs - Queue version
for(var i=0;i<10;i++){
  procedure.add(Myhand,"Queue[B]["+i+"]");
}
procedure.queue(function(error){
  if(!error){
    console.log("Queue[B] finished!");
    console.log("Counter:",this.data.counter);
  }
});



// Add independent jobs
procedure.add(Myhand,"independent[X]");
procedure.add(Myhand,"independent[Y]");
procedure.add(Myhand,"independent[Z]");



// And finally launch!
procedure
.launch(function(error){
  if(error){ // Called by each error.
    console.log("One Error:",error);
  } else { // Called only if finished whitout errors.
    console.log("All finished");
    console.log("Counter:",this.data.counter);
  }
});


/* ---------------------------- *

var Myhand = function(name){
  var job = this;
  console.log(name);
  job.data.counter++;
  job.done();
};

// Errors management

var procedure = new Procedure({counter:10}); // <- Initial data for share.

procedure
.add(Myhand,"Queue[C][1]")
.add(Myhand,"Queue[C][2]")
.add(function(){
  var job = this;
  console.log("Queue[C][3] Throw Error!...");
  try {
    var a = b;
    job.done();
  } catch(error) {
    job.error(error);
  }
})
.add(Myhand,"Queue[C][4]")
.add(Myhand,"Queue[C][5]")
.launch(function(error){
  if(error){
    console.log("One Error:",error);
  } else {
    console.log("All finished");
    console.log("Counter:",this.data.counter);
  }
});

/* ---------------------------- */