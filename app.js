const express = require('express');
const bodyParser = require('body-parser');
const date = require(__dirname + '/date.js');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));


//connecting to mongodb
mongoose.connect(process.env.mongodb_url,  {useNewUrlParser:true});


// creating a schema
const itemsSchema = {
    name: String
}

//creating a model
const Item = mongoose.model('Item', itemsSchema);


// creating default items
const item1 = new Item({ 
    name: 'Welcome to your todolist!' 
});

const item2 = new Item({ 
    name: 'Tap + button to add item to your todo list' 
});

const item3 = new Item({ 
    name: '<--- Hit this to delete an item' 
});


//putting items into an array
const defaultItems = [item1, item2, item3];

// creating schema on dynamic list
const listSchema = {
    name: String,
    items: [itemsSchema]
};

// creating model on dynamic list
const List = mongoose.model('List', listSchema);

// index route
app.get('/', async(req, res) => {

    const todayIs = date.getDate();
    const listCategories = await List.find({});

    Item.find({})
    .then((lists) => {

        if(lists.length === 0){
            Item.insertMany(defaultItems)
            .then (() => {
            console.log('Succesfully inserted default items');
            })
            .catch((err) => {
            console.log(err);
            })

            res.redirect('/');

        }else{

            res.render('list', {listTitle: todayIs, lists: lists, categories: listCategories});
        }
    })
    .catch((err) => {
        console.log(err);
    })
})


// adding dynamic route
app.get('/:customListName', async (req,res) => {

    const customListName = req.params.customListName;
    const listCategories = await List.find({});

    List.findOne({name: customListName})
     .then((result) => {
        if (!result){

            //create a new list
            const list = new List ({
                name: customListName,
                items: defaultItems
            });
            
            list.save();

            res.redirect(`/${customListName}`)

        }else{
                // display the existing list
                res.render('list', {listTitle: result.name, lists: result.items, categories: listCategories});
            }
     })
     .catch((error)=>{
        console.log(error)
    })

});



// adding new item in todolist
app.post('/', (req, res) => {

    const newItem = req.body.addList;
    const listTitle = req.body.listTitle;
    const item = new Item({
        name: newItem
    });

    if(listTitle === date.getDate()){
        item.save();
        res.redirect('/');
    }else{
        List.findOne({name: listTitle})
        .then((result) => {
            result.items.push(item);
            result.save();
            res.redirect(`/${listTitle}`)
        })
    }
});


// deleting items in todolist
app.post('/delete', (req,res) => {
    const deleteItem = req.body.checkbox;
    const listTitlehidden = req.body.listTitleHidden;

    if(listTitlehidden === date.getDate()) {
    Item.findByIdAndRemove(deleteItem)
    .then(() => {
        console.log('Item successfully deleted.');
        res.redirect('/');
    })
    .catch((err) => {
        console.log(err);
    })
    }else{
        List.findOneAndUpdate({name: listTitlehidden}, {$pull: {items: {_id: deleteItem}}})
        .then(() => {
            res.redirect(`/${listTitlehidden}`)
        })
        .catch((err) => {
            console.log(err);
        })
    }
    
})



app.listen(process.env.PORT || 3000, () => {
    console.log('server running on port 3000');
})