const express = require('express');
const app = express();
require("dotenv").config();
const port = 3004;
var md5 = require('md5')
var sqlite3 = require('sqlite3').verbose()
const cors = require('cors');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
const DBSOURCE = "usersdb.sqlite";
const auth = require("./middleware");
const { emitKeypressEvents } = require('readline');
const { isElementAccessExpression } = require('typescript');



let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message)
        throw err
    }
    else {
        var salt = bcrypt.genSaltSync(10);

        db.run(`CREATE TABLE Users (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Username text, 
            Email text, 
            Password text,             
            Salt text,    
            Token text,
            DateLoggedIn DATE,
            DateCreated DATE
            )`,
            (err, result) => {
                if (err) {
                    // Table already created
                } else {
                    console.log(result);
                    // Table just created, creating some rows
                    var insert = 'INSERT INTO Users (Username, Email, Password, Salt, DateCreated) VALUES (?,?,?,?,?)'
                    db.run(insert, ["user1", "user1@example.com", bcrypt.hashSync("user1", salt), salt, Date('now')])
                    // db.run(insert, ["user2", "user2@example.com", bcrypt.hashSync("user2", salt), salt, Date('now')])
                    // db.run(insert, ["user3", "user3@example.com", bcrypt.hashSync("user3", salt), salt, Date('now')])
                    // db.run(insert, ["user4", "user4@example.com", bcrypt.hashSync("user4", salt), salt, Date('now')])
                }
            });
        // db.run(`DROP TABLE Resume;`);
        db.run(`CREATE  TABLE if not exists Resume (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Name text,
            Userid INTEGER,
            
            FOREIGN KEY (Userid) REFERENCES Users(Id))`,
            (err, result) => {
                if (err) {
                    console.log(err);
                    console.log("there is some error with the reusme table")

                } else {
                    console.log(result);
                    console.log("Resume table Created Successfully");
                }
            })
        db.run(`CREATE  TABLE if not exists PersonalD (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Name text,
                Profession text,
                Email text,
                PhoneNo text,
                Resid INTEGER ,
                Weburl text,
                FOREIGN KEY (Resid) REFERENCES Resume(Id))`,
            (err) => {
                if (err) {
                    console.log(err);
                    console.log("there is some error with the personal detials table")

                } else {
                    console.log("Personal Details table Created Successfully");
                }
            })
        db.run(`CREATE  TABLE if not exists  EducationD (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    UniName text,
                    Course text,
                    StartYear text,
                    EndYear text,
                    Location text,
                    Resid INTEGER,
                    FOREIGN KEY (Resid) REFERENCES Resume(Id))`,
            (err, result) => {
                if (err) {

                    console.log(err);
                    console.log("there is some error with the personal detials table")

                } else {
                    console.log(result);
                    console.log("Education Details table Created Successfully");
                }
            })
        db.run(`CREATE  TABLE if not exists  ExperienceD (
                        Id INTEGER  PRIMARY KEY AUTOINCREMENT,
                        Company text,
                        Jobtitle text,
                        Duration text,
                        Desc1 text,
                        Desc2 text,
                        Resid INTEGER,
                        FOREIGN KEY (Resid) REFERENCES Resume(Id))`,
            (err, result) => {
                if (err) {

                    console.log(err);
                    console.log("there is some error with the personal detials table")

                } else {
                    console.log(result);
                    console.log("Experience Details table Created Successfully");
                }
            })
        db.run(`CREATE  TABLE if not exists  SkillsD (
                            Id INTEGER PRIMARY KEY AUTOINCREMENT,
                            Name text,
                            Resid INTEGER,
                            FOREIGN KEY (Resid) REFERENCES Resume(Id))`,
            (err, result) => {
                if (err) {

                    console.log(err);
                    console.log("there is some error with the personal detials table")

                } else {
                    console.log(result);
                    console.log("Skills Details table Created Successfully");
                }
            })
    }
});


module.exports = db
db.query = function (sql, params = []) {
    const that = this;
    return new Promise(function (resolve, reject) {
      that.all(sql, params, function (error, result) {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  };
app.use(
    express.urlencoded(),
    cors({
        origin: 'http://localhost:3000'
    })
);

app.get('/', (req, res) => res.send('API Root'));


// * R E G I S T E R   N E W   U S E R

app.post("/api/register", async (req, res) => {
    var errors = []
    try {
        // console.log(req);
        const { Username, Email, Password } = req.body;
        // console.log(req.body);
        // console.log(Username,Email,Password,"hh");

        if (!Username) {
            errors.push("Username is missing");
        }
        if (!Email) {
            errors.push("Email is missing");
        }
        if (errors.length) {
            res.status(400).json({ "error": errors.join(",") });
            return;
        }
        let userExists = false;


        var sql = "SELECT * FROM Users WHERE Email = ?"
        await db.all(sql, Email, (err, result) => {
            if (err) {
                res.status(402).json({ "error": err.message });
                return;
            }

            if (result.length === 0) {

                var salt = bcrypt.genSaltSync(10);

                var data = {
                    Username: Username,
                    Email: Email,
                    Password: bcrypt.hashSync(Password, salt),
                    Salt: salt,
                    DateCreated: Date('now')
                }

                var sql = 'INSERT INTO Users (Username, Email, Password, Salt, DateCreated) VALUES (?,?,?,?,?)'
                var params = [data.Username, data.Email, data.Password, data.Salt, Date('now')]
                var user = db.run(sql, params, function (err, innerResult) {
                    if (err) {
                        res.status(400).json({ "error": err.message })
                        return;
                    }

                });
            }
            else {
                userExists = true;
                // res.status(404).send("User Already Exist. Please Login");  
            }
        });

        setTimeout(() => {
            if (!userExists) {
                res.status(201).json("Success");
            } else {
                res.status(201).json("Record already exists. Please login");
            }
        }, 500);


    } catch (err) {
        console.log(err);
    }
})


// * L O G I N

app.post("/api/login", async (req, res) => {

    try {
        //   console.log(req.body);
        const { Email, Password } = req.body;
        // console.log(Email,Password);
        // Make sure there is an Email and Password in the request
        if (!(Email && Password)) {
            res.status(400).send("All input is required");
        }

        let user = [];

        var sql = "SELECT * FROM Users WHERE Email = ?";
        db.all(sql, Email, function (err, rows) {
            if (err) {
                res.status(400).json({ "error": err.message })
                return;
            }

            rows.forEach(function (row) {
                user.push(row);
            })
            var PHash = bcrypt.hashSync(Password, user[0].Salt);

            // var PHash = bcrypt.hashSync(Password,bcrypt.genSaltSync(10));
            // console.log(PHash,user[0].Password);
            if (PHash === user[0].Password) {

                // * CREATE JWT TOKEN
                const token = jwt.sign(
                    { user_id: user[0].Id, username: user[0].Username, Email },
                    process.env.TOKEN_KEY,
                    {
                        expiresIn: "1h", // 60s = 60 seconds - (60m = 60 minutes, 2h = 2 hours, 2d = 2 days)
                    }
                );

                user[0].Token = token;

            } else {

                return res.status(400).send("No Match");
            }
            // console.log(user);
            return res.status(200).send(user[0]);
        });

    } catch (err) {
        console.log(err);
    }
});


// * T E S T  

app.post("/api/test", auth, (req, res) => {
    res.status(200).send("Token Works - Yay!");
});

// Create new Resume for a User 

app.post("/api/addresume",auth,(req,res)=>{
    try{
        const Name = req.body.Name;
        
        console.log(req.body);
        if(!Name)
        {
            res.status(400).send("Name Required");
            return;
    }

        const userid=req.user.user_id;
        var sql='INSERT INTO Resume (Name,Userid) VALUES(?,?);';
        var params=[Name,userid];
        db.run(sql,params,(error)=>{
            console.log(error);
            console.log(this);
        })
        res.status(200).send("success");

        

    }
    catch
        (err){
            console.log(err);
            res.status(400).send("error");

        }
    });


// getting all the resumes of the user
app.get("/api/getresume",auth,(req,res)=>{
    try{
        const userid=req.user.user_id;
        var sql='Select Name,Id from Resume where Userid=?';

        db.all(sql,[userid],function(err,rows){
            console.log(rows,err);
            if(err)
        { console.log(sql);
            res.status(400).send("There is some error");
           }   else{

               console.log(rows);
                res.status(200).send(rows);
            }
        })
    }
    catch(error){
        console.log(error);
        res.status(400).send("error");

    }
});
// update resume name
app.post("/api/resumenameupdate",auth,(req,res)=>{
    try{
        const userid=req.user.user_id;
        const Name=req.body.Name;
        const Resid=req.body.Resid;
        var sql='Update Resume SET Name=? Where Userid=? AND Id=?';

        db.all(sql,[Name,userid,Resid],function(err,rows){
            console.log(rows,err);
            if(err)
        { console.log(sql);
            res.status(400).send("There is some error");
           }   else{

               console.log(rows);
                res.status(200).send(rows);
            }
        })
        
    }
    catch{

    }
})

async function gettableinfousingResid(table,resid)
{
      let sql=`Select * From ${table} where Resid=?;`;
      return await db.query(sql,[resid]);
}
// getting all the data of the resume with resume id 

app.get("/api/loadresume",auth,(req,res)=>{
    try{
        // const userid=req.user.user_id;
        const resid=req.body.Resid | req.query.Resid;

        // const resid=req.params;
        console.log(req.data);
       
        // var sql='Select * from ? where Resid=?';
        // const resumeid=req.resumeid;
        if(!resid )
        {
            res.status(400).send("Resume id Required");
            return;
        }
        console.log("loadin g for",resid);
        
       
        (async()=>{
            const edu=await gettableinfousingResid("EducationD",resid);
            const exp=await gettableinfousingResid("ExperienceD",resid);
            const personal=await gettableinfousingResid("PersonalD",resid);
            const skills=await gettableinfousingResid("SkillsD",resid);
            
            res.status(200).send({edu,exp,personal,skills});
        })();

        
    }
    catch(error){
        console.log(error);
        res.status(400).send("error");

    }
});


// * SKILL 
// add skill to database
app.post("/api/addskill", auth, async (req, res) => {
    try {

        // const {token}=req.auth;
        // const {title,user,resumeid}=req.body;\
        const value = req.body.Name;
        const resid = req.body.Resid;
        var sql2 = 'INSERT  INTO   SkillsD (Name,Resid)  VALUES (?,?);';
        db.all(sql2, [value, resid], function (err, rows) {
            console.log(err, rows);
        })
        // console.log(req.user);
        console.log("addd skill calleds");
        // console.log(req);

        return res.status(200).send("hello");
    }
    catch (err) {
        console.log(err);
    }

});

// get skills 
// for a user and a resume
app.get('/api/getskills', auth, async (req, res) => {
    try {
        var skills = [];

        const resid = req.body.Resid;
        var sql2 = 'SELECT Name From   SkillsD Where Resid=?;';
        db.all(sql2, [resid], function (err, rows) {
            console.log(err, rows);
            if (err) {
                return res.status(400);
            }
            rows.forEach(function (row) {
                skills.push(row.Name);
            })
            console.log(skills);
            return res.status(200).send(skills);

        })

    }
    catch (err) {
        console.log(err);
        return res.status(400);
    }
});

// Personal Details
// add details to Database
app.post("/api/addpersonald", auth, async (req, res) => {
    try {

        // const {token}=req.auth;
        // const {title,user,resumeid}=req.body;\
        const Name = req.body.Name;
        const Profession = req.body.Profession;
        const Email = req.body.Email;
        const Weburl = req.body.Weburl;
        const PhoneNo = req.body.PhoneNo;
        const Resid = req.body.Resid;
        const params = [Name, Profession, Email, Weburl, PhoneNo, Resid];
        var sql3='Select * From PersonalD Where Resid=?';
        var present=false;
        db.all(sql3,[Resid],function(err,rows){

            console.log("checking for resid",Resid);
            console.log(rows);
             var present=false;
            if(rows.length)
            {
                var present=true;
                console.log("inside rowslength");

            }

            if(!present)

            {
                console.log("inseritng new entry");
                var sql2 = 'INSERT  INTO   PersonalD (Name,Profession,Email,Weburl,PhoneNo,Resid)  VALUES (?,?,?,?,?,?);';
            db.all(sql2, params, function (err, rows) {
                console.log(err, rows);
                if (err) {
                    return res.status(400);
                }
            })
        }
        else{
            console.log("udpating previous entry");
            var sql2 = 'UPDATE   PersonalD SET Name=?,Profession=?,Email=?,Weburl=?,PhoneNo=? Where Resid=?;';
            db.all(sql2, params, function (err, rows) {
                console.log(err, rows);
                if (err) {
                    return res.status(400);
                }
            })
    
    
        }

        })
       
        // console.log(req.user);
        console.log("addd  personal skills called calleds");
        // console.log(req);

        return res.status(200).send("hello");
    }
    catch (err) {
        console.log(err);
    }

});

// get personal details 
app.get("/api/getpersonald", auth, async (req, res) => {
    try {
        // const {token}=req.auth;
        // const {title,user,resumeid}=req.body;\

        const Resid = req.body.Resid;
        const params = [Resid];
        var sql2 = 'SELECT Name,Profession,Email,Weburl,PhoneNo FROM PersonalD WHERE Resid=?;';
        db.all(sql2, params, function (err, rows) {
            console.log(err, rows);
            if (err) {
                return res.status(400);
            }
            else {
                console.log(rows);
                return res.status(200).send(rows[0]);
            }
        })
        // console.log(req.user);
        console.log("addd  personal skills called calleds");
        // console.log(req);


    }
    catch (err) {
        console.log(err);
    }

});


// Education Details
// post details to database
app.post("/api/addeducationd", auth, async (req, res) => {
    try {

        // const {token}=req.auth;
        // const {title,user,resumeid}=req.body;\
        const UniName = req.body.UniName;
        const Course = req.body.Course;
        const StartYear = req.body.StartYear;
        const EndYear = req.body.EndYear;
        const Location = req.body.Location;
        const Resid = req.body.Resid;
        const params = [UniName, Course, StartYear, EndYear, Location, Resid];
        // Validate all the params for the api
        // validation check here :::
        // all the params are present of not should be checked here 
        console.log(req.body);
        var rowid;
        var sql2 = 'INSERT  INTO   EducationD (UniName,Course,StartYear,EndYear,Location,Resid)  VALUES (?,?,?,?,?,?);';
        db.run(sql2, params, function (err, rows) {
            console.log(err, rows);
            console.log(this.lastID,"hello");
            rowid=this.lastID;
           

            if (err) {
                return res.status(400);
            }
            else{

        return res.status(200).send(String(rowid));
            }
           

        })

        // console.log(req.user);
        // console.log("addd  Education Details calleds");
        // // console.log(req);

    }
    catch (err) {
        console.log(err);
    }

});

// get education Details
app.get("/api/geteducationd", auth, async (req, res) => {
    try {
        // const {token}=req.auth;
        // const {title,user,resumeid}=req.body;\

        const Resid = req.body.Resid;
        const params = [Resid];
        var sql2 = 'SELECT * FROM EducationD WHERE Resid=?;';
        db.all(sql2, params, function (err, rows) {
            console.log(err, rows);
            if (err) {

                return res.status(400);
            }
            else {
                console.log(rows);
                console.log(rows.length);
                // res.status(200).send(rows);
                // return;
                if (rows.length)
                    return res.status(200).send(rows);
                else {
                    return res.status(200).send("No Data Found");
                }
            }
        })
        // console.log(req.user);
        console.log("addd  personal skills called calleds");
        // console.log(req);


    }
    catch (err) {
        console.log(err);
    }

});
// Experience Details
// Add exp details to database
app.post("/api/addexperienced", auth, async (req, res) => {
    try {

        // const {token}=req.auth;
        // const {title,user,resumeid}=req.body;\
        const Company = req.body.Company;
        const Jobtitle = req.body.Jobtitle;
        const Duration = req.body.Duration;
        const Desc1 = req.body.Desc1;
        const Desc2 = req.body.Desc2;
        const Resid = req.body.Resid;
        console.log(req.body);
        const params = [Company, Jobtitle, Duration, Desc1, Desc2, Resid];
        var rowid;
        var sql2 = 'INSERT  INTO   ExperienceD (Company,Jobtitle,Duration,Desc1,Desc2,Resid)  VALUES (?,?,?,?,?,?);';
        console.log(sql2);
        db.run(sql2, params, function (err, rows) {
            console.log(err, rows);
            if (err) {
                return res.status(400);
            }
            rowid=this.lastID;
            return res.status(200).send(String(rowid));

        })
        // console.log(req.user);
        console.log("addd  personal skills called calleds");
        // console.log(req);

        
    }
    catch (err) {
        console.log(err);
    }

});

//remove education degree entry from backend server database

app.post("/api/removeEducationEntry", auth, async (req, res) => {
    try {

        // const {token}=req.auth;
        // const {title,user,resumeid}=req.body;\
       const Id=req.body.Id;
        const Resid = req.body.Resid;
        console.log(req.body);
        const params = [Resid,Id];
        var sql2 = 'Delete From EducationD  Where (Resid=? and Id=? );';
        console.log(sql2);
        db.all(sql2, params, function (err, rows) {
            console.log(err, rows);
            if (err) {
                return res.status(400);
            }
        })
        // console.log(req.user);
        console.log("Removed the Data from backend table");
        // console.log(req);

        return res.status(200).send("Success fully removed the data from backend");
    }
    catch (err) {
        console.log(err);
    }

});

// remove experience entry okayy
app.post("/api/removeExp", auth, async (req, res) => {
    try {

        // const {token}=req.auth;
        // const {title,user,resumeid}=req.body;\
       const Id=req.body.Id;
        const Resid = req.body.Resid;
        console.log(req.body);
        const params = [Resid,Id];
        var sql2 = 'Delete From ExperienceD  Where (Resid=? and Id=? );';
        console.log(sql2);
        db.all(sql2, params, function (err, rows) {
            console.log(err, rows);
            if (err) {
                return res.status(400);
            }
        })
        // console.log(req.user);
        console.log("Removed the Data from backend table");
        // console.log(req);
        return res.status(200).send("Success fully removed the data from backend");
    }
    catch (err) {
        console.log(err);
    }

});


// Get experience Details 

app.get("/api/getexperienced", auth, async (req, res) => {
    try {
        // const {token}=req.auth;
        // const {title,user,resumeid}=req.body;\
        const Resid = req.body.Resid;
        const params = [Resid];
        var sql2 = 'SELECT * FROM ExperienceD WHERE Resid=?;';
        db.all(sql2, params, function (err, rows) {
            console.log(err, rows);
            if (err) {
                return res.status(400);
            }
            else {
                console.log(rows);
                return res.status(200).send(rows);
            }
        })
        // console.log(req.user);
        console.log("addd  personal skills called calleds");
        // console.log(req);


    }
    catch (err) {
        console.log(err);
    }

});

app.listen(port, () => console.log(`API listening on port ${port}!`));