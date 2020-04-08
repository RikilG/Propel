const sqlite3 = require('sqlite3').verbose();
var database = null

async function getDatabase() {
    if (database) return database

    database = await new sqlite3.Database(process.cwd() + "/database/calendar.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) console.log(err.message)
    })

    await database.serialize(() => {
        // Queries scheduled here will be serialized.
        database.run(`CREATE TABLE IF NOT EXISTS 
            profiles(
                p_id INTEGER PRIMARY KEY AUTOINCREMENT, 
                p_name TEXT
            );
        `, (err) => { if (err) console.log(err) })
        .run(`CREATE TABLE IF NOT EXISTS 
            types(
                ty_id INTEGER PRIMARY KEY AUTOINCREMENT, 
                ty_name TEXT
            );
        `, (err) => { if (err) console.log(err) })
        .run(`CREATE TABLE IF NOT EXISTS
            tasks(
                t_id INTEGER PRIMARY KEY AUTOINCREMENT, 
                t_name TEXT,
                t_description TEXT,
                t_type INTEGER REFERENCES types(ty_id),
                t_profile INTEGER REFERENCES profiles(p_id)
            );
        `, (err) => { if (err) console.log(err) })
        .run(`CREATE TABLE IF NOT EXISTS 
            single_tasks(
                st_id INTEGER PRIMARY KEY AUTOINCREMENT, 
                t_id INTEGER REFERENCES tasks(t_id), 
                st_start_datetime INTEGER,
                st_end_datetime INTEGER,
                st_status TEXT
            );
        `, (err) => { if (err) console.log(err) })
        .run(`CREATE TABLE IF NOT EXISTS 
            recuring_tasks(
                rt_id INTEGER PRIMARY KEY AUTOINCREMENT, 
                t_id INTEGER REFERENCES tasks(t_id),
                rt_start_datetime INTEGER,
                rt_end_datetime INTEGER,
                rt_repeat_interval TEXT
            );
        `, (err) => { if (err) console.log(err) })
        database.run(`INSERT OR IGNORE INTO types VALUES
            (1, "reminder"), (2, "event"), (3, "notes"), (4, "todo"), (5, "goal");
        `, (err) => { if (err) console.log(err) })
        .run(`INSERT OR IGNORE INTO profiles VALUES 
            (1, "default");
        `, (err) => { if (err) console.log(err) })
    })
    // localStorage.setItem('database', database)
    console.log("Successfully connected to database.")
    return database
}

async function closeDatabase() {
    await database.close((err) => {
        if (err) {
            console.log(err.message)
            throw err
        }
        else console.log("Closed the connection to database")
    })
}

exports.getDatabase = getDatabase
exports.closeDatabase = closeDatabase