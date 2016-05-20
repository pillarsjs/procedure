# Procedure
Simple JS async development.

```javascript
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
```
