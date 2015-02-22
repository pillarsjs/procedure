var test = require('unit.js');
//var Procedure = test.promisifyAll(require("../index.js"));

var Procedure =require("../index.js");

describe("Unit Test for Procedure",function(){ 
  describe("Procedure Basic Test",function(){
    it("Procedure Ending - No .add(), only .launch",function(testDone){     
      var procedure = new Procedure();
      procedure.launch(function(errors){
        if(!errors){           
          testDone();
        } else {
          test.fail(errors[0].message);
        }  
      });
    });

    it("Procedure Ending - No .add(), only .race and .launch",function(testDone){     
      var procedure = new Procedure();
      procedure.race();
      procedure.launch(function(errors){
        if(!errors){           
          testDone();
        } else {
          test.fail(errors[0].message);
        }  
      });
    });

    it("Procedure Ending - No .add(), only .queue and .launch",function(testDone){     
      var procedure = new Procedure();
      procedure.queue();
      procedure.launch(function(errors){
        if(!errors){           
          testDone();
        } else {
          test.fail(errors[0].message);
        }  
      });
    });

    it("Procedure Ending - Only .add() and .launch",function(testDone){     
      var procedure = new Procedure();
      procedure
        .add(function(done){done();})
        .add(function(done){done();})
        .add(function(done){done();})
        .add(function(done){done();})
        .add(function(done){done();});

      procedure.launch(function(errors){
        if(!errors){           
          testDone();
        } else {
          test.fail(errors[0].message);
        }  
      });
    });


    it("Procedure Ending - Only .add() and .launch passing params",function(testDone){     
      var procedure = new Procedure();
      procedure
        .add(function(done){done(undefined, 5);})
        .add(function(i,done){done(undefined, i*5);})
        .add(function(i,done){done(undefined, i*5);})
        .add(function(i,done){done(undefined, i*5);});


      procedure.launch(function(errors,i){
        if(!errors){   
            test.value(i).is(625);  
            testDone();
          } else {
            test.fail(errors[0].message);
          }  
      });
    });


    it("Procedure Ending - Only .add() and .launch passing params, and params in add.",function(testDone){     
      var procedure = new Procedure();
      procedure
        .add(function(done){done(undefined, 5);})
        .add(function(i,j,done){
            test.value(i).is(5);
            test.value(j).is(2);
            done(undefined, i*j);
          },2)
        .add(function(i,j,done){
            test.value(i).is(10);
            test.value(j).is(3);
            done(undefined, i*j);
          },3)
        .add(function(i,j,done){
            test.value(i).is(30);
            test.value(j).is(4);
            done(undefined, i*j);
          },4);


      procedure.launch(function(errors,i){
        if(!errors){   
            test.value(i).is(120);  
            testDone();
          } else {
            test.fail(errors[0].message);
          }  
      });
    });

    it("Procedure Ending with errors",function(testDone){     
      var procedure = new Procedure();
      procedure
        .add(function(done){
            done(undefined, 5);
        })
        .add("jobError",function(i,done){
            throw new Error("Opps");
            done(undefined, i);
        })
        .add("job-2-Error",function(i,done){
            throw new Error("Opps-2");
            done(undefined, i);
        });

      procedure.launch(function(errors,i){
        if(!errors){   
            test.fail("Should fail");             
        } else {           
          test.value(errors[0].message).is("Procedure error in 'jobError' > Error Opps");
          testDone();
        }  
      });
    });
  });

  describe("Testing Queue",function(){
    it("2 queue with params - launch",function(testDone){     
      var procedure = new Procedure();
      procedure
        .add(function(done){done(undefined, 5);})
        .add(function(i,j,done){
            done(undefined, i*j);
          },2)
        .add(function(i,j,done){
            done(undefined, i*j);
          },3)
        .add(function(i,j,done){
            done(undefined, i*j);
          },4)
        .queue()

        .add(function(i,j,done){
            test.value(i).is(120);
            test.value(j).is(5);
            done(undefined, i*j);
          },5)
        .add(function(i,j,done){
            test.value(i).is(600);
            test.value(j).is(0.5);
            done(undefined, i*j);
          },0.5)
        .add(function(i,j,done){
            test.value(i).is(300);
            test.value(j).is(2);
            done(undefined, i*j);
          },2)
        .queue()

      procedure.launch(function(errors,i){
        if(!errors){   
            test.value(i).is(600);  
            testDone();
          } else {
            test.fail(errors[0].message);
          }  
      });

    })

    it("2 queue with 1 error - launch",function(testDone){     
      var procedure = new Procedure();
      procedure
        .add(function(done){done(undefined, 5);})
        .add("jobError",function(i,j,done){
            throw new Error("Opps");
            done(undefined, i*j);
          },2)
        .add(function(i,j,done){
            done(undefined, i*j);
          },3)
        .add(function(i,j,done){
            done(undefined, i*j);
          },4)
        .queue()

        .add(function(i,j,done){
            throw new Error("Opps2");
            test.value(i).is(120);
            test.value(j).is(5);
            done(undefined, i*j);
          },5)
        .add(function(i,j,done){
            test.value(i).is(600);
            test.value(j).is(0.5);
            done(undefined, i*j);
          },0.5)
        .add(function(i,j,done){
            test.value(i).is(300);
            test.value(j).is(2);
            done(undefined, i*j);
          },2)
        .queue()

      procedure.launch(function(errors,i){
        if(!errors){   
            test.fail("Should fail");             
        } else {           
          test.value(errors[0].message).is("Procedure error in 'jobError' > Error Opps");
          testDone();
        }   
      });

    })
  });

  describe("Testing Race",function(){
    it("1 race - queue - 1 race with params - launch",function(testDone){     
      var procedure = new Procedure();
      procedure
        .add("a",function(done){done(undefined,4);})
        .add("b",function(j,done){
            test.value(j).is(2);
            done(undefined, 2*j);
          },2)
        .add("c",function(j,done){
            test.value(j).is(3);
            done(undefined, 2*j);
          },3)
        .add("d",function(j,done){
            done(undefined, 2*j);
          },4)
        .race()

        .add("e",function(j,z,done){
            test.value(j).is({a:[4], b:[4], c:[6], d:[8]});
            test.value(z).is(20);
            done(undefined);
          },20)
        .queue()

        .add("f",function(j,done){
            test.value(j).is(0.5);
            done(undefined, 2*j);
          },0.5)
        .add("g",function(j,done){
            test.value(j).is(2);
            done(undefined, 2*j);
          },2)
        .race()

      procedure.launch(function(errors,i){
        if(!errors){   
            test.value(i).is({f:[1], g:[4]});
            testDone();
          } else {
            test.fail(errors[0].message);
          }  
      });

    })

    it("2 queue with 1 error - launch",function(testDone){     
      var procedure = new Procedure();
      procedure
        .add(function(done){done(undefined, 5);})
        .add("jobError",function(i,j,done){
            throw new Error("Opps");
            done(undefined, i*j);
          },2)
        .add(function(i,j,done){
            done(undefined, i*j);
          },3)
        .add(function(i,j,done){
            done(undefined, i*j);
          },4)
        .queue()

        .add(function(i,j,done){
            throw new Error("Opps2");
            test.value(i).is(120);
            test.value(j).is(5);
            done(undefined, i*j);
          },5)
        .add(function(i,j,done){
            test.value(i).is(600);
            test.value(j).is(0.5);
            done(undefined, i*j);
          },0.5)
        .add(function(i,j,done){
            test.value(i).is(300);
            test.value(j).is(2);
            done(undefined, i*j);
          },2)
        .queue()

      procedure.launch(function(errors,i){
        if(!errors){   
            test.fail("Should fail");             
        } else {           
          test.value(errors[0].message).is("Procedure error in 'jobError' > Error Opps");
          testDone();
        }   
      });

    })
  });




  describe("Adding Process in Race",function(){
    
    it("Simple adding without function names and parameters",function(testDone){     
     
      var shared = 0;
      function func(done){
        shared++;
        done();
      }
    
      var procedure = new Procedure();                      
      procedure
        .add(func)       
        .add(func)    
        .add(func)         
        .race()                                                
        
        .launch(function(errors){
          if(!errors){
            test.value(shared).is(3);
            testDone();
          } else {
            test.fail(errors[0].message);
          }  
        })
      ;
    })


    it("Simple adding with function names",function(testDone){ 

     var shared = 0;

      function func(done){        
        shared++;       
        done();
      }
    
      var procedure = new Procedure();
      procedure
        .add("Process-1",func)
        .add("Process-2",func)
        .add("Process-3",func)
        .race()
        .launch(function(errors,data){
            if(!errors){           
              test.value(shared).is(3);
              testDone();
            } else {
              test.fail(errors[0].message);
            }
        })
      ;
    })


    it("Adding 200 Process that add 1 to shared",function(testDone){     
    
     var shared = 0;

      function func(done){        
        shared++;
        done();
      }
    
      var procedure = new Procedure();  
      for(i=0;i<200;i++){
        procedure.add("Process-"+i,func)
      }                    
      procedure        
        .race()                                                        
        .launch(function(errors){
          if(!errors){           
              test.value(shared).is(200);
              testDone();
            } else {
              test.fail(errors[0].message);
            }                   
          
        })
      ;
    })

    it("Testing process names with 20 process passing their names by done.result().",function(testDone){     
      var shared = 0;

      function func(num,done){        
        shared++;
        done(undefined,{'myName': num});
      }
    
      var procedure = new Procedure();  
      for(i=0;i<20;i++){
        procedure.add(i.toString(),func,i)
      }                 
      procedure        
        .race()                                                
        
        .launch(function(errors){ 
          if(!errors){
            test.value(shared).is(20);
            for(i=0;i<20;i++){
              test.value(arguments['1'][i][0]).is({'myName': i });
            } 
            testDone();
          } else {
             test.fail(errors[0].message);
          }                 
        })
      ;
    })



  })


  describe("Adding Process in Queue",function(){ 
    it("Simple adding 3 process and adding 1 to shared.",function(testDone){     
     
      var shared = 0;

      var procedure = new Procedure();                      
      procedure
        .add(function(done){shared++;done();})       
        .add(function(done){shared++;done();})    
        .add(function(done){shared++;done();})         
        .queue()
                     
        .launch(function(errors){
          if(!errors){
            test.value(shared).is(3);
            testDone();
          } else {
            test.fail(errors[0].message);
          } 
        })
      ;
    })

    it("Test passing just an Integer",function(testDone){     
      var procedure = new Procedure(); 

      procedure
        .add(function(done){
          done(undefined, 20);
        })
        .add(function(j, done){
          test.value(j).is(20);
          done(undefined, j*2 );
        })
        .add(function(j, done){
          test.value(j).is(40);
          done(undefined, j*2 );
        })
      
        .queue()
      
        .launch(function(errors,j){ 
          if(!errors){
              test.value(j).is(80);
              testDone();
            } else {
              test.fail(errors);
            }
        })
      ;
    })


    it("Test passing just an String",function(testDone){     
      var procedure = new Procedure(); 

      procedure
        .add(function(done){
          done(undefined, "Hello ");
        })
        .add(function(j, done){
          test
            .value(j)
              .isType("string")
              .is("Hello ");
          done(undefined, j + "World!" );
        })
      
        .queue()
      
        .launch(function(errors,j){ 
          if(!errors){
              test.value(j).is("Hello World!").isType("string");
              testDone();
            } else {
              test.fail(errors);
            }
        })
      ;
    })

    it("Test passing an Object",function(testDone){     
      var procedure = new Procedure(); 

      procedure
        .add(function(done){
          done(undefined, {id: "myId"});
        })
        .add(function(j, done){
          test
            .value(j)
              .isType("object")
              .is({id: "myId"});
            j.name = "myName";
          done(undefined, j );
        })
      
        .queue()
      
        .launch(function(errors,j){ 
          if(!errors){
              test.value(j).is({id: "myId", name: "myName"}).isType("object");
              testDone();
            } else {
              test.fail(errors);
            }
        })
      ;
    })


    it("Test passing an Array and adding",function(testDone){     
      var procedure = new Procedure(); 

      procedure
        .add(function(done){
          done(undefined, ["black", "red", "yellow", "orange"]);
        })
        .add(function(j, done){
          test
            .value(j)
              .is(["black", "red", "yellow", "orange"]);
          j.push("white");
          done(undefined, j );
        })
      
        .queue()
      
        .launch(function(errors,j){ 
          if(!errors){
              test.value(j).is(["black", "red", "yellow", "orange", "white"]);
              testDone();
            } else {
              test.fail(errors);
            }
        })
      ;
    })

  })
});