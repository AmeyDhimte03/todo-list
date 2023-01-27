const express = require("express");
const app = express();
//
const date = require(__dirname + "/date.js");
const day = date.getDateWitoutYearFrom_datejs_module();
//
const mongoose = require("mongoose");
const _=require('lodash');



app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.set("strictQuery", false);
const dbName = "todolistDb";
// mongoose.connect("mongodb://127.0.0.1:27017/" + dbName, {
// mongoose.connect("mongodb+srv://ameydhimte:<mongodbdatabasepassword>@cluster0.0obmid3.mongodb.net/" + dbName, {
mongoose.connect("mongodb+srv://ameydhimte:mongodbdatabasepassword@cluster0.0obmid3.mongodb.net/" + dbName, {
  useNewUrlParser: true,
});

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

//
const item1 = new Item({
  name: "Welcome to to-do list",
});
const item2 = new Item({
  name: "Click on ➕ to add new item to the list",
});
const item3 = new Item({
  name: "⬅️Click here to delete an item",
});

const defaultItems = [item1, item2, item3];
//

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
  Item.find({}, { name: 1, _id: 0 }).then(
    (def_info) => {
      if (def_info.length === 0) {
        Item.insertMany(defaultItems)
          .catch((err) => {
            console.log("errors : " + err);
          })
          .then((success) => {
            console.log(success);
          });
        res.redirect("/");
      } else {
        res.render("list", {
          listTitle: day,
          newListItems: def_info,
          day:day
        });
      }
    },
    (err) => {
      console.log("errors are: " + err);
    }
  );
});
//
app.post("/", (req, res) => {
  // console.log(req.body.newItem);
  const item_name = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: item_name,
  });

  if (listName === day) {
    item
      .save()
      .then((msg) => {
        console.log("successful insertion of " + msg);
      })
      .catch((err) => {
        console.log("errors while inserting " + item + " : " + err);
      });

    res.redirect("/");
  } else {
    //💥something new:- to insert something into an embedded document 1st find parent document by findOne
    // then push the new document into the arrayed documents( (or)document with some schema array as their element)
    // by simply push since it's
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(item);
        foundList
          .save()
          .then(() => {
            res.redirect("/" + listName);
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((error) => {
        console.log(
          "Couldn't perform insertion of the new item dur to:\n" + error
        );
      });
  }
});

app.post("/delete_items/:list_name", (req, res) => {
  const item_name = req.body.delete_list_item;
  const list_name = req.params.list_name;

  if (list_name === day) {
    Item.deleteOne({ name: item_name })
      .then((delete_info) => {
        console.log(delete_info);
        res.redirect("/");
      })
      .catch((err) => {
        console.log("Error while deleting the item : " + err);
      });
  } 
  else {
    List.findOneAndUpdate(
      { name: list_name },
      { $pull: { items: { name: item_name } } },(err,foundList)=>{
        if(err){ console.log(
            "Deletion of " +
              item_name +
              " from " +
              list_name +
              " is Unsuccessful due to:\n" +
              err
          );
        }
        else {console.log(
            "Deletion of " +
              item_name +
              " from " +
              list_name +
              " is successful:\n" +
              foundList);
          res.redirect("/" + list_name);
        }   
    })
  }
})

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize( req.params.customListName);
  
  List.findOne({ name: customListName })
    .then((info) => {
      if (info) {//already exists
        res.render("list", {
          listTitle: info.name,
          newListItems: info.items,
          day:day
        });
      } else {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list
          .save()
          .then((msg) => {
            console.log(
              "new list with name : " + customListName + " is created"
            );
            res.redirect("/" + customListName); //This is imp. o/w the user is left hanging! This redirects to same page but this time the if condition is executed
          })
          .catch((error) => {
            console.log("New list couldn't be created bcoz of: " + error);
          });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/create-goto",(req,res)=>{
  res.redirect("/"+req.body.listname)
});

app.post("/home",(req,res)=>{
  res.redirect("/");
})

app.listen(4000, () => console.log("Example app listening on port 4000!"));
