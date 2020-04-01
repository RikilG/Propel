const dbManager = require(process.cwd() + '/src/scripts/database')
let taskList = [] // same as database 
let database;
const types = { // similar to enum
    REMINDER: 1,
    EVENT: 2,
    NOTES: 3,
    TODO: 4,
    GOAL: 5
}
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

async function dateSelected(year, month, date) {
    document.querySelector("#iDate").innerHTML = dateToText(date) + " " + monthToText(month)
    window.localStorage.setItem('selectedDate', `${year}-${month+1}-${date}`)
    window.localStorage.setItem('date', date)
    window.localStorage.setItem('month', month)
    window.localStorage.setItem('year', year)
    let start_datetime = new Date(year, month, date)
    let end_datetime = new Date(year, month, date)
    end_datetime.setHours(23)
    end_datetime.setMinutes(59)
    end_datetime.setSeconds(59)
    let allDayTasks = document.getElementById('tasks-all-day')
    let normalTasks = document.getElementById("tasks-normal")
    let normalTasksList = []
    let allDayTasksList = []
    allDayTasks.innerHTML = ""
    normalTasks.innerHTML = ""
    // 3 table join:
    // select * from tasks t left join single_tasks st on t.t_id = st.t_id left join recuring_tasks rt on t.t_id = rt.t_id;
    // select * from (select * from tasks t left join (select * from single_tasks where st_start_datetime between 1585725800000 and 1585735800000) as st on t.t_id = st.t_id) as tinner join recuring_tasks rt on rt.t_id = t.t_id;
    // select * from (select * from tasks t left join (select * from single_tasks where st_start_datetime between 1585725800000 and 1585735800000) as st on t.t_id = st.t_id) as t left join (select * from recuring_tasks where rt_start_datetime between 10 and 30) as rt on rt.t_id = t.t_id;
    // select * from (select * from recuring_tasks where rt_start_datetime between ? and ?) as rtinner join tasks t on t.t_id = rt.t_id;

    // query for single tasks - reminders
    await database.all(`SELECT * FROM 
        (SELECT * FROM single_tasks WHERE (st_start_datetime <= ? AND st_status != "DONE") OR (st_start_datetime between ? and ?)) as st
        INNER JOIN tasks t ON t.t_id = st.t_id;
    `, [parseInt(end_datetime.getTime()/1000), parseInt(start_datetime.getTime()/1000), parseInt(end_datetime.getTime()/1000)]
    , async (err, rows) => {
        if(err) notify(err, "red")
        if(!rows) return
        await rows.forEach((row, index) => {
            let temp = document.getElementById('task-template').cloneNode(true)
            temp.children[0].innerHTML = row.t_name
            temp.children[1].innerHTML = row.st_status
            temp.classList.add('reminder-task')
            temp.t_id = row.t_id
            temp.t_type = row.t_type
            if(row.st_start_datetime == row.st_end_datetime)
                normalTasksList.push(temp)
            else
                allDayTasksList.push(temp)
        })
        await allDayTasksList.sort((a, b) => {
            if (a.st_start_datetime > b.st_start_datetime) return 1
            else return -1
        })
        await normalTasksList.sort((a, b) => {
            if (a.st_start_datetime > b.st_start_datetime) return 1
            else return -1
        })
        allDayTasks.innerHTML = "<h4>Tasks (all day):</h4>"
        normalTasks.innerHTML = "<h4>Tasks (time specific):</h4>"
        await allDayTasksList.forEach((value, index) => allDayTasks.append(value))
        await normalTasksList.forEach((value, index) => normalTasks.append(value))
    })
}

function toggleTimeTb() {
    if(document.getElementById('reminderAllDay').checked) {
        document.getElementById('reminderTimeHTb').disabled = true
        document.getElementById('reminderTimeMTb').disabled = true
    }
    else {
        document.getElementById('reminderTimeHTb').disabled = false
        document.getElementById('reminderTimeMTb').disabled = false
    }
}

/* Run these when use selects save */
function setNewReminder() {
    let dateTb = window.localStorage.getItem('selectedDate')
    let timeHTb = document.getElementById("reminderTimeHTb").value
    let timeMTb = document.getElementById("reminderTimeMTb").value
    let reminderBox = document.querySelector('.textbox-main')
    let allDayCheck = document.getElementById("reminderAllDay")
    if (reminderBox.value == "") {
        reminderBox.style.borderBottom = "solid red 4px"
        reminderBox.style.backgroundColor = "rgba(255, 150, 150, 0.80)"
        notify("Reminder for what? (fill in the empty field!)", "red")
        return
    }
    let sdatetime = new Date(dateTb)
    sdatetime.setHours(parseInt(timeHTb))
    sdatetime.setMinutes(parseInt(timeMTb))
    let edatetime = sdatetime
    database.serialize(() => {
        database.run(`INSERT INTO tasks 
            values (NULL, ?, NULL, (SELECT ty_id from types where ty_name=?), 1);`, // TODO: 1 is for default profile
            [reminderBox.value, "reminder"], 
            function(err) {
                if (err) {
                    notify(err, "red")
                    return
                }
                let lastid = this.lastID
                if (allDayCheck.checked) { // if all day
                    sdatetime.setHours(0)
                    sdatetime.setMinutes(0)
                    sdatetime.setSeconds(0)
                    edatetime = new Date(sdatetime)
                    edatetime.setHours(23)
                    edatetime.setMinutes(59)
                    edatetime.setSeconds(59)
                }
                database.run(`INSERT INTO single_tasks values(NULL, ?, ?, ?, "PENDING");`, // pending reminder
                    [lastid, parseInt(sdatetime.getTime()/1000), parseInt(edatetime.getTime()/1000)], // id, start datetime, end datetime
                    function(err) {
                        if (err) notify(err, "red")
                        else {
                            notify("Reminder added to calendar.")
                            hideOverlay()
                            reminderBox.value = ""
                            allDayCheck.checked = false
                        }
                    }
                )
            }
        )
    })
}

function setNewEvent() {

}

function setNewNotes() {

}

function setNewTodo() {

}

function setNewGoal() {

}

/* Run these functions when user opens their corresponding overlays */
function initReminderOverlay() {
    let ls = window.localStorage
    let dateTb = document.getElementById("reminderDateTb")
    let timeHTb = document.getElementById("reminderTimeHTb")
    let timeMTb = document.getElementById("reminderTimeMTb")
    let datetime = new Date()
    dateTb.value = new Date(ls.getItem('year'), ls.getItem('month'), ls.getItem('date')).toDateString()
    dateTb.disabled = true
    timeHTb.value = `${datetime.getHours()}`
    timeMTb.value = `${datetime.getMinutes()}`
}

function initEventOverlay() {

}

function initNotesOverlay() {

}

function initTodoOverlay() {

}

function initGoalOverlay() {

}