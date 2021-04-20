// Chances are boot0.js got run already and scheduled *another*
// 'load(alarm.js)' - so let's remove it first!
if (P8.alarm) P8.alarm = clearTimeout(P8.alarm);
const storage = require("Storage");
eval(storage.read("prompt.js"));

function formatTime(t) {
  var hrs = 0|t;
  var mins = Math.round((t-hrs)*60);
  return hrs+":"+("0"+mins).substr(-2);
}

function getCurrentHr() {
  var time = new Date();
  return time.getHours()+(time.getMinutes()/60)+(time.getSeconds()/3600);
}

function showAlarm(alarm) {
  var msg = formatTime(alarm.hr);
  var buzzCount = 10;
  if (alarm.msg)
    msg += "\n"+alarm.msg;
  E.showPrompt(msg,{
    title:"ALARM!",
    buttons : {"Sleep":true,"Ok":false} // default is sleep so it'll come back in 10 mins
  }).then(function(sleep) {
    buzzCount = 0;
    if (sleep) {
      if(alarm.ohr===undefined) alarm.ohr = alarm.hr;
      alarm.hr += 10/60; // 10 minutes
    } else {
      alarm.last = (new Date()).getDate();
      if (alarm.ohr!==undefined) {
          alarm.hr = alarm.ohr;
          delete alarm.ohr;
      }
      if (!alarm.rp) alarm.on = false;
    }
    require("Storage").write("alarm.json",JSON.stringify(alarms));
    load("clock.app.js");
  });
  function buzz() {
    P8.buzz(100);
      setTimeout(()=>{
        P8.buzz(100);
        if (buzzCount--)
            setTimeout(buzz, 2000);
        else if(alarm.as) { // auto-snooze
            buzzCount = 10;
            setTimeout(buzz, 600000);
        }
      },100);
  }
  buzz();
}

// Check for alarms
var day = (new Date()).getDate();
var hr = getCurrentHr()+10000; // get current time - 10s in future to ensure we alarm if we've started the app a tad early
var alarms = require("Storage").readJSON("alarm.json",1)||[];
var active = alarms.filter(a=>a.on&&(a.hr<hr)&&(a.last!=day));
if (active.length) {
  // if there's an alarm, show it
  active = active.sort((a,b)=>a.hr-b.hr);
  setTimeout(()=>{showAlarm(active[0]);},500);
} else {
  // otherwise just go back to default app
  setTimeout(()=>{load("clocl.app.js");}, 100);
}