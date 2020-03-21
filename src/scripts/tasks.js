const dbManager = require(process.cwd() + '/src/scripts/database')
let taskList = [] // same as database 
let database;
/*
reminder - set something to be reminded of - google calendar? - onetime
event - events like bday's etc - can occor repetitively
notes - short notes to look into on that day
todo - list of things to perform on that day
goal - like todo but spans over many days
*/

String.prototype.capitalize = function() { // a captalize function
    return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

async function connectDatabase(callback) {
    database = await dbManager.getDatabase()
    if (callback) callback()
}

connectDatabase(() => {
    database.each('select ty_name from types;', [], (err, row) => {
        if (err) throw err
        taskList.push(row.ty_name)
    })
})


function newReminder() {

}

function newEvent() {

}

function newNotes() {

}

function newTodo() {

}

function newGoal() {

}