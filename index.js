const express = require("express")
const mongoose = require("mongoose")
const _ = require("lodash")

const app = express(); 

mongoose.connect("mongodb://127.0.0.1:27017/ToDoList")

.then(() => console.log("Connected"))

let itemSchema = new mongoose.Schema({
    name : String
})

let listSchema = new mongoose.Schema({
    listName : String,
    items : [itemSchema]
})

let Item = mongoose.model("Item",itemSchema)
let List = mongoose.model("List",listSchema)

let item1 = new Item({
    name : "Welcome to your ToDoList"
})
let item2 = new Item({
    name : "Hit the + button to add new item"
})
let item3= new Item({
    name : "Click <-- to delete item"
})

let defaultItems = [item1,item2,item3]

app.set('view engine','ejs')   

app.use(express.urlencoded({extended:true})) 
app.use(express.static("public"))  


let today = new Date()
let dayNum = today.getDay()
let daysInWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
let day = daysInWeek[dayNum]

app.get("/", (req,res) => { 
    Item.find({})
    .then((foundItems) => {
        if(foundItems.length === 0){
            Item.insertMany(defaultItems).catch((err) => console.log(err))
            .then(() => res.redirect("/"))
        }else{
            res.render('index',{title : day, list : foundItems});
        }
    })
})


app.get("/:customListName", (req,res) => {
    let customListName = _.capitalize(req.params.customListName);
    List.findOne({listName : customListName})
    .then((foundList) => {
        if(!foundList){
            let newList = new List({
                listName  : customListName,
                items : defaultItems
            })
            newList.save()
            .then(() => res.redirect("/"+customListName))
            
        }else{
            res.render('index',{title : foundList.listName, list : foundList.items})
        }
    })
    .catch((err) => console.log(err))
})

app.post("/", (req,res) => {   
    if(req.body.title == day){
        let item = new Item({
            name : req.body.newItem
        })
        item.save()
        res.redirect("/")
    }else{
        let currListName = req.body.title
        List.updateOne({listName : currListName}, {$push : {items : {name : req.body.newItem}}}).then(() => console.log("updated!"))
        .then(() => res.redirect("/"+req.body.title))
        
    }
})

app.post("/delete", (req,res) => {
    if(req.body.title == day){
        Item.findByIdAndRemove(req.body.itemId)
        .catch((err) => console.log(err))
        res.redirect("/")
    }else{
        console.log(req.body)
        let currListName = req.body.title
        List.updateOne({listName : currListName}, {$pull : {items : {_id : req.body.itemId}}}).then(() => console.log("deleted!"))
        .then(() => res.redirect("/"+req.body.title))
    }
})

app.listen(3000)