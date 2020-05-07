const dbManager = require(process.cwd() + '/src/scripts/database')
let taskList = [null] // same as database 
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

function refreshLayout() {
    hideOverlay();
    let selected = new Date(window.localStorage.getItem('selectedDate'))
    buildCalendar(selected)
    dateSelected(selected.getFullYear(), selected.getMonth(), selected.getDate())
}

function toggleTimeTb(id) {
    if(document.getElementById(id).checked) {
        document.querySelectorAll('.textbox-small').forEach((value, index) => value.disabled = true)
    }
    else {
        document.querySelectorAll('.textbox-small').forEach((value, index) => value.disabled = false)
    }
}

function fetchTasks(year, month, date, today=true, callback) {
    let start_datetime = new Date(year, month, date)
    let end_datetime = new Date(year, month, date)
    end_datetime.setHours(23)
    end_datetime.setMinutes(59)
    end_datetime.setSeconds(59)
    // 3 table join:
    // select * from tasks t left join single_tasks st on t.t_id = st.t_id left join recuring_tasks rt on t.t_id = rt.t_id;
    // select * from (select * from tasks t left join (select * from single_tasks where st_start_datetime between 1585725800000 and 1585735800000) as st on t.t_id = st.t_id) as tinner join recuring_tasks rt on rt.t_id = t.t_id;
    // select * from (select * from tasks t left join (select * from single_tasks where st_start_datetime between 1585725800000 and 1585735800000) as st on t.t_id = st.t_id) as t left join (select * from recuring_tasks where rt_start_datetime between 10 and 30) as rt on rt.t_id = t.t_id;
    // select * from (select * from recuring_tasks where rt_start_datetime between ? and ?) as rtinner join tasks t on t.t_id = rt.t_id;
    
    // query for single tasks - reminders
    let query
    if (today) {
        query = `SELECT * FROM (SELECT * FROM single_tasks WHERE (st_start_datetime between ? and ?)) as st INNER JOIN tasks t ON t.t_id = st.t_id;`
        database.all(query, [parseInt(start_datetime.getTime()/1000), parseInt(end_datetime.getTime()/1000)]
        , (err, rows) => {
            if(err) notify(err, "red")
            else callback(rows)
        })
    }
    else {
        query = `SELECT * FROM 
    (SELECT * FROM single_tasks WHERE (st_start_datetime <= ? AND st_status != "DONE") OR (st_start_datetime between ? and ?)) as st
    INNER JOIN tasks t ON t.t_id = st.t_id;`
        database.all(query, [parseInt(end_datetime.getTime()/1000), parseInt(start_datetime.getTime()/1000), parseInt(end_datetime.getTime()/1000)]
        , (err, rows) => {
            if(err) notify(err, "red")
            else callback(rows)
        })
    }
}

function populateTasks(rows) {
    if(!rows) return
    let selectedDate = new Date(window.localStorage.getItem('selectedDate'))
    let todoTasks = document.getElementById('tasks-todo')
    let allDayReminders = document.getElementById('reminders-all-day')
    let normalReminders = document.getElementById("reminders-normal")
    let allDayEvents = document.getElementById('events-all-day')
    let normalEvents = document.getElementById("events-normal")
    allDayReminders.innerHTML = "<h3>Reminders (all day):</h3>"
    normalReminders.innerHTML = "<h3>Reminders (time specific):</h3>"
    allDayEvents.innerHTML = "<h3> Evevnts (all day):</h3>"
    normalEvents.innerHTML = "<h3>Events (time specific):</h3>"
    todoTasks.innerHTML = "<h3>ToDo: </h3>"
    rows.sort((a, b) => { return (a.st_start_datetime > b.st_start_datetime)?1:-1; })
    rows.forEach((row, index) => {
        let temp = document.getElementsByTagName('template')[0].content
        if (row.t_type == types.TODO) {
            if (row.st_end_datetime*1000 < selectedDate) return
            temp = temp.querySelector(".todo-template").cloneNode(true)
            temp.t_id = row.t_id
            if (row.st_status == "DONE") {
                temp.children[0].checked = true
                temp.children[1].style.textDecoration = "line-through"
                temp.children[1].style.fontStyle = "italic"
            }
            else {
                temp.children[0].checked = false
            }
            temp.children[0].onclick = (mouseEvent) => modifyTodo(mouseEvent.target.parentNode, 'toggle')
            temp.children[1].innerHTML = row.t_name
            temp.children[1].onclick = (mouseEvent) => {
                temp.children[0].checked = !temp.children[0].checked
                modifyTodo(mouseEvent.target.parentNode, 'toggle')
            }
            temp.children[2].onclick = (mouseEvent) => {modifyTodo(mouseEvent.target.parentNode, 'delete')}
            todoTasks.append(temp)
        }
        else {
            if (row.t_type == types.EVENT && row.st_end_datetime*1000 < selectedDate) return
            temp = temp.querySelector("#task-template").cloneNode(true)
            temp.children[0].innerHTML = row.t_name
            temp.children[1].innerHTML = row.st_status
            temp.classList.add('reminder-task')
            temp.t_id = row.t_id
            temp.t_type = row.t_type
            temp.children[0].style.pointerEvents = "none"
            temp.children[1].style.pointerEvents = "none"
            temp.onclick = (mouseEvent) => {showEditOverlay(mouseEvent.target)}
            if (row.st_start_datetime == row.st_end_datetime) {
                if (row.t_type == types.REMINDER) normalReminders.append(temp)
                else if (row.t_type == types.EVENT) normalEvents.append(temp)
            }
            else {
                if (row.t_type == types.REMINDER) allDayReminders.append(temp)
                else if (row.t_type == types.EVENT) allDayEvents.append(temp)
            }
        }
    })
    if (allDayReminders.children.length == 1) allDayReminders.innerHTML = ""
    if (normalReminders.children.length == 1) normalReminders.innerHTML = ""
    if (allDayEvents.children.length == 1) allDayEvents.innerHTML = ""
    if (normalEvents.children.length == 1) normalEvents.innerHTML = ""
    if (todoTasks.children.length == 1) todoTasks.innerHTML = ""
}

function dateSelected(year, month, date) {
    document.querySelector("#iDate").innerHTML = dateToText(date) + " " + monthToText(month)
    window.localStorage.setItem('selectedDate', `${year}-${month+1}-${date}`)
    window.localStorage.setItem('date', date)
    window.localStorage.setItem('month', month)
    window.localStorage.setItem('year', year)
    fetchTasks(year, month, date, false, (rows) => populateTasks(rows))
}

/* Run these functions when user clicks/edits previous tasks */
function showEditOverlay(taskDiv) {
    switch(taskDiv.t_type) {
        case types.REMINDER: showOverlay(5);editReminderOverlay(taskDiv.t_id); break;
        case types.EVENT: showOverlay(5);editEventOverlay(taskDiv.t_id); break;
    }
}

async function editReminderOverlay(t_id) {
    document.getElementById('editReminderBox').style.display = "block"
    await database.get(`SELECT * FROM (SELECT * FROM tasks t WHERE t.t_id=?) as t LEFT JOIN single_tasks st ON t.t_id=st.t_id LEFT JOIN recuring_tasks rt ON t.t_id = rt.t_id;`
    , [t_id], (err, row) => {
        if (err) notify(err, "red")
        let reminderBox = document.getElementById('tbReminderTitleEdit')
        let dateTb = document.getElementById("reminderDateTb-edit")
        let timeHTb = document.getElementById("reminderTimeHTb-edit")
        let timeMTb = document.getElementById("reminderTimeMTb-edit")
        let allDayCheck = document.getElementById("reminderAllDay-edit")
        let datetime = new Date(row.st_start_datetime*1000)
        reminderBox.value = row.t_name
        reminderBox.t_id = t_id
        dateTb.value = datetime.toDateString()
        dateTb.disabled = true
        timeHTb.value = `${datetime.getHours()}`
        timeMTb.value = `${datetime.getMinutes()}`
        if (row.st_start_datetime != row.st_end_datetime) allDayCheck.checked = true
        else allDayCheck.checked = false
        toggleTimeTb("reminderAllDay-edit")
        if (row.st_status == "DONE") {
            document.getElementById('btnReminderDone').style.display = "none"
            document.getElementById('btnReminderSave').style.display = "none"
        }
        else {
            document.getElementById('btnReminderDone').style.display = "inline"
            document.getElementById('btnReminderSave').style.display = "inline"
        }
    })
    document.getElementById('tbReminderTitleEdit').focus()
}

async function editEventOverlay(t_id) {
    document.getElementById('editEventBox').style.display = "block"
    await database.get(`SELECT * FROM (SELECT * FROM tasks t WHERE t.t_id=?) as t LEFT JOIN single_tasks st ON t.t_id=st.t_id LEFT JOIN recuring_tasks rt ON t.t_id = rt.t_id;`
    , [t_id], (err, row) => {
        if (err) notify(err, "red")
        let eventBox = document.getElementById('tbEventTitleEdit')
        let dateTb = document.getElementById("eventDateTb-edit")
        let timeHTb = document.getElementById("eventTimeHTb-edit")
        let timeMTb = document.getElementById("eventTimeMTb-edit")
        let allDayCheck = document.getElementById("eventAllDay-edit")
        let datetime = new Date(row.st_start_datetime*1000)
        eventBox.value = row.t_name
        eventBox.t_id = t_id
        dateTb.value = datetime.toDateString()
        dateTb.disabled = true
        timeHTb.value = `${datetime.getHours()}`
        timeMTb.value = `${datetime.getMinutes()}`
        if (row.st_start_datetime != row.st_end_datetime) allDayCheck.checked = true
        else allDayCheck.checked = false
        toggleTimeTb("reminderAllDay-edit")
        if (row.st_status == "DONE") {
            document.getElementById('btnEventSave').style.display = "none"
        }
        else {
            document.getElementById('btnEventSave').style.display = "inline"
        }
    })
    document.getElementById('tbEventTitleEdit').focus()
}

/* Run these when use selects save */
// TODO: Write a simple which abstracts adding tasks to database. look at new reminder and new event functions which use
// same type of database query!
function setNewReminder() {
    let dateTb = window.localStorage.getItem('selectedDate')
    let timeHTb = parseInt(document.getElementById("reminderTimeHTb").value)
    let timeMTb = parseInt(document.getElementById("reminderTimeMTb").value)
    let reminderBox = document.getElementById('tbReminderTitleNew')
    let allDayCheck = document.getElementById("reminderAllDay-new")
    if (reminderBox.value == "") {
        reminderBox.style.borderBottom = "solid red 4px"
        reminderBox.style.backgroundColor = "rgba(255, 150, 150, 0.80)"
        return notify("Reminder for what? (fill in the empty field!)", "red")
    }
    if (!allDayCheck.checked && (!timeHTb || !timeMTb || timeHTb > 23 || timeHTb < 0 || timeMTb > 59 || timeMTb < 0)) {
        return notify("Time appears to be wrong. (please enter a valid value)", "red")
    }
    let sdatetime = new Date(dateTb)
    sdatetime.setHours(timeHTb)
    sdatetime.setMinutes(timeMTb)
    let edatetime = sdatetime
    database.run(`INSERT INTO tasks 
        values (NULL, ?, NULL, ?, 1);`, // TODO: 1 is for default profile
        [reminderBox.value, types.REMINDER], 
        function(err) {
            if (err) return notify(err, "red")
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
                        refreshLayout()
                        reminderBox.value = ""
                        allDayCheck.checked = false
                    }
                }
            )
        }
    )
    setTimeout(() => dateSelected(sdatetime.getFullYear(), sdatetime.getMonth(), sdatetime.getDate()), 500);
}

function setNewEvent() {npm 
    let dateTb = window.localStorage.getItem('selectedDate')
    let timeHTb = parseInt(document.getElementById("eventTimeHTb").value)
    let timeMTb = parseInt(document.getElementById("eventTimeMTb").value)
    let eventBox = document.getElementById('tbEventTitleNew')
    let allDayCheck = document.getElementById("eventAllDay-new")
    if (eventBox.value == "") { // TODO: add class for red/error box, also in setNewReminder method
        eventBox.style.borderBottom = "solid red 4px"
        eventBox.style.backgroundColor = "rgba(255, 150, 150, 0.80)"
        return notify("No Event? (fill in the empty field!)", "red")
    }
    if (!allDayCheck.checked && (!timeHTb || !timeMTb || timeHTb > 23 || timeHTb < 0 || timeMTb > 59 || timeMTb < 0)) {
        return notify("Time appears to be wrong. (please enter a valid value)", "red")
    }
    let sdatetime = new Date(dateTb)
    sdatetime.setHours(timeHTb)
    sdatetime.setMinutes(timeMTb)
    let edatetime = sdatetime
    database.run(`INSERT INTO tasks 
        values (NULL, ?, NULL, ?, 1);`, // TODO: 1 is for default profile
        [eventBox.value, types.EVENT], 
        function(err) {
            if (err) return notify(err, "red")
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
            database.run(`INSERT INTO single_tasks values(NULL, ?, ?, ?, "PENDING");`, // pending event
                [lastid, parseInt(sdatetime.getTime()/1000), parseInt(edatetime.getTime()/1000)], // id, start datetime, end datetime
                function(err) {
                    if (err) notify(err, "red")
                    else {
                        notify("Event added to calendar.")
                        refreshLayout()
                        eventBox.value = ""
                        allDayCheck.checked = false
                    }
                }
            )
        }
    )
    setTimeout(() => dateSelected(sdatetime.getFullYear(), sdatetime.getMonth(), sdatetime.getDate()), 500);
}

function setNewNotes() {

}

function setNewTodo() {
    let date = window.localStorage.getItem('selectedDate')
    let todoBox = document.getElementById('tbNewTodo')
    let todo = todoBox.value
    let sdatetime = new Date(date)
    if (todo == "") return notify("You want ToDo nothing?!")
    database.run(`INSERT INTO tasks 
        values (NULL, ?, NULL, (SELECT ty_id from types where ty_name=?), 1);`, // TODO: 1 is for default profile
        [todo, "todo"], 
        function(err) {
            if (err) return notify(err, "red")
            let lastid = this.lastID
            database.run(`INSERT INTO single_tasks values(NULL, ?, ?, ?, "PENDING");`, // pending reminder
                [lastid, parseInt(sdatetime.getTime()/1000), parseInt(sdatetime.getTime()/1000)], // id, start datetime, end datetime
                function(err) {
                    if (err) notify(err, "red")
                    else {
                        notify("Todo added to calendar.")
                        refreshLayout()
                        todoBox.value = ""
                    }
                }
            )
        }
    )
}

function setNewGoal() {

}

/* Run these to modify tasks */
function modifyReminder(command) {
    let t_id = document.getElementById('tbReminderTitleEdit').t_id
    if (command == "delete") {
        database.serialize(() => {
            database.run(`DELETE FROM tasks WHERE t_id=?;`, [t_id], (err) => {if (err) notify(err, "red")})
            .run(`DELETE FROM single_tasks WHERE t_id=?;`, [t_id], (err) => {if (err) notify(err, "red")})
            .run(`DELETE FROM recuring_tasks WHERE t_id=?;`, [t_id], (err) => {
                if (err) notify(err, "red")
                else {
                    notify("deleted reminder.")
                    refreshLayout()
                }
            })
        })
    }
    else if (command == "done") {
        database.run(`UPDATE single_tasks SET st_status="DONE" WHERE t_id=?;`, [t_id], (err) => {
            if (err) notify(err, "red")
            else {
                notify("reminder updated.")
                refreshLayout()
            }
        })
    }
    else if (command == "save") {
        let reminderBox = document.getElementById('tbReminderTitleEdit')
        let dateTb = document.getElementById("reminderDateTb-edit")
        let timeHTb = parseInt(document.getElementById("reminderTimeHTb-edit").value)
        let timeMTb = parseInt(document.getElementById("reminderTimeMTb-edit").value)
        let allDayCheck = document.getElementById("reminderAllDay-edit").checked
        let sdatetime = new Date(dateTb.value)
        let edatetime
        if(!allDayCheck && (!timeHTb || !timeMTb || timeHTb > 23 || timeHTb < 0 || timeMTb > 59 || timeMTb < 0)) 
            return notify("Time appears to be wrong. (please enter a valid value)", "red")
        sdatetime.setHours(timeHTb)
        sdatetime.setMinutes(timeMTb)
        edatetime = sdatetime
        if(allDayCheck) {
            sdatetime.setHours(0)
            sdatetime.setMinutes(0)
            sdatetime.setSeconds(0)
            edatetime = new Date(sdatetime)
            edatetime.setHours(23)
            edatetime.setMinutes(59)
            edatetime.setSeconds(59)
        }
        database.run(`UPDATE tasks SET t_name=? WHERE t_id=?;`, [reminderBox.value, t_id], (err) => {
            if (err) return notify(err, "red")
            database.run(`UPDATE single_tasks SET st_start_datetime=?, st_end_datetime=? WHERE t_id=?;`, [sdatetime/1000, edatetime/1000, t_id], (err) => {
                if (err) notify(err, "red")
                else {
                    notify("saved successfully!")
                    refreshLayout()
                }
            })
        })
    }
    else return notify("incorrect command: " + command, "red")
}

function modifyEvent(command) {
    let t_id = document.getElementById('tbEventTitleEdit').t_id
    if (command == "delete") {
        database.serialize(() => {
            database.run(`DELETE FROM tasks WHERE t_id=?;`, [t_id], (err) => {if (err) notify(err, "red")})
            .run(`DELETE FROM single_tasks WHERE t_id=?;`, [t_id], (err) => {if (err) notify(err, "red")})
            .run(`DELETE FROM recuring_tasks WHERE t_id=?;`, [t_id], (err) => {
                if (err) notify(err, "red")
                else {
                    notify("deleted reminder.")
                    refreshLayout()
                }
            })
        })
    }
    else if (command == "save") {
        let eventBox = document.getElementById('tbEventTitleEdit')
        let dateTb = document.getElementById("eventDateTb-edit")
        let timeHTb = parseInt(document.getElementById("eventTimeHTb-edit").value)
        let timeMTb = parseInt(document.getElementById("eventTimeMTb-edit").value)
        let allDayCheck = document.getElementById("eventAllDay-edit").checked
        let sdatetime = new Date(dateTb.value)
        let edatetime
        if(!allDayCheck && (!timeHTb || !timeMTb || timeHTb > 23 || timeHTb < 0 || timeMTb > 59 || timeMTb < 0))
            return notify("Time appears to be wrong. (please enter a valid value)", "red")
        sdatetime.setHours(timeHTb)
        sdatetime.setMinutes(timeMTb)
        edatetime = sdatetime
        if(allDayCheck) {
            sdatetime.setHours(0)
            sdatetime.setMinutes(0)
            sdatetime.setSeconds(0)
            edatetime = new Date(sdatetime)
            edatetime.setHours(23)
            edatetime.setMinutes(59)
            edatetime.setSeconds(59)
        }
        database.run(`UPDATE tasks SET t_name=? WHERE t_id=?;`, [eventBox.value, t_id], (err) => {
            if (err) return notify(err, "red")
            database.run(`UPDATE single_tasks SET st_start_datetime=?, st_end_datetime=? WHERE t_id=?;`, [sdatetime/1000, edatetime/1000, t_id], (err) => {
                if (err) notify(err, "red")
                else {
                    notify("saved successfully!")
                    refreshLayout()
                }
            })
        })
    }
    else return notify("incorrect command: " + command, "red")
}

function modifyTodo(target, operation) {
    if (operation == "toggle") {
        let checked = target.children[0].checked
        let status = (checked)?"DONE":"PENDING"
        database.run(`UPDATE single_tasks SET st_status=? WHERE t_id=?;`, [status, target.t_id], (err) => {
            if (err) notify(err, "red")
            else refreshLayout()
        })
    }
    else if (operation == "delete") {
        database.run(`DELETE FROM single_tasks WHERE t_id=?;`, [target.t_id], (err) => {
            if (err) notify(err, "red")
            else database.run(`DELETE FROM tasks WHERE t_id=?;`, [target.t_id], (err) => {
                if (err) notify(err, "red")
                else refreshLayout()
            })
        })
    }
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
    document.getElementById("reminderAllDay-new").checked = false
    toggleTimeTb("reminderAllDay-new")
    document.getElementById('tbReminderTitleNew').focus()
}

function initEventOverlay() {
    let ls = window.localStorage
    let dateTb = document.getElementById("eventDateTb")
    let timeHTb = document.getElementById("eventTimeHTb")
    let timeMTb = document.getElementById("eventTimeMTb")
    let datetime = new Date()
    dateTb.value = new Date(ls.getItem('year'), ls.getItem('month'), ls.getItem('date')).toDateString()
    dateTb.disabled = true
    timeHTb.value = `${datetime.getHours()}`
    timeMTb.value = `${datetime.getMinutes()}`
    document.getElementById("reminderAllDay-new").checked = false
    toggleTimeTb("eventAllDay-new")
    document.getElementById('tbEventTitleNew').focus()
}

function initNotesOverlay() {

}

function initTodoOverlay() {
    document.getElementById('tbNewTodo').focus();
}

function initGoalOverlay() {

}

function addListeners() {
    document.getElementById('tbNewTodo').addEventListener('keyup', (e) => {
        if(e.key == "Enter") document.getElementById('btnNewTodo').click()
    })
    document.getElementById('tbReminderTitleNew').addEventListener('keyup', (e) => {
        if (e.key == "Enter") document.getElementById("btnNewReminder").click()
    })
    document.getElementById('tbReminderTitleEdit').addEventListener('keyup', (e) => {
        if (e.key == "Enter") document.getElementById('btnReminderSave').click()
    })
}


addListeners() // run and apply all listeners!