const port = 4000;
const express = require("express")
const app = express();
const mongoose= require("mongoose")
const jwt = require("jsonwebtoken")
const multer = require("multer")
const path = require("path")
const cors = require("cors");
const { log } = require("console");

app.use(express.json());

app.use(cors());



app.get('/',(req,res) => {
    app.use(express.static(path.resolve(__dirname, "frontend", "build")));
    res.sendFile(path.resolve(__dirname,"frontend", "build" ,"index.html"))
})






app.get('/admin',(req,res) => {
    app.use(express.static(path.resolve(__dirname, "admin", "dist")));
    res.sendFile(path.resolve(__dirname,"admin", "dist" ,"index.html"))
})

/// Database connection with mongoDb

mongoose.connect("mongodb+srv://bharatecom:bharat123@cluster0.5xttb1d.mongodb.net/e-commerce")


/// API Creation

 app.get("/",(req,res)=>{
    res.send("Express App is Running ")

 })


 ///Schema for Creating Products
 const Product = mongoose.model("Product",{
    id:{
        type:Number,
        require:true,

    },

    name:{
        type:String,
        required:true,
    },

    image:{
     type:String,
     required:true,
    },

    category:{
        type:String,
        required:true,
    },

    new_price:{
        type:Number,
        required:true,
    },

    old_price:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now, 
    },

    avilable:{
     type:Boolean,
     default:true
    },



 })

 app.post('/addproduct', async(req,res)=>{
    let products = await Product.find({});
    let id;
    if(products.length>0)
    {
      let last_product_array = products.slice(-1);
      let last_product = last_product_array[0];
      id = last_product.id+1;
    }
    else{
        id=1;
    }
    const product = new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,

    });

    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success:true,
        name:req.body.name,
    })
 })

// Creating API for deleting product


app.post('/removeproduct', async(req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("removed");
    res.json({
        success:true,
        name:req.body.name
    })
})

//Creating API for getting all product

app.get('/allproduct', async(req,res)=>{
    let products = await Product.find({});
    console.log("all products fetched");
    res.send(products)
})


//// creating endpoint for newcollection data
app.get('/newcollections',async (req,res)=>{
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("NewCollection Fetched");
    res.send(newcollection)

})

// creating endpoint  for popular in women section
app.get('/popularinwomen',async(req,res)=>{
    let products = await Product.find({category:"women"});
    let popular_in_women = products.slice(0,4);
    console.log("Popular in women fetched");
    res.send(popular_in_women)
})


/// creating middileware to fetch user


const fetchUser = async(req,res,next)=>{
   
    const token =  req.header('auth-token');
    if(!token){
        res.status(401).send({errors:"Please authenticate using valid token"})
    }

    else{
        try{
   const data = jwt.verify(token,'secret_ecom');
      req.user = data.user;
      next();
        }
        catch(error){
         res.status(401).send({errors:"please authenticate using valid token"})
        }
    }


}




// creating end point for adding products in cartdata
app.post('/addtocart', fetchUser, async (req, res) => {
    console.log("Added", req.body.itemId);
    
    try {
        // Find the user data
        let userData = await Users.findOne({ _id: req.user._id });

        // If user data not found, return an error
        if (!userData) {
            return res.status(404).send("User not found");
        }

        // Update the cart data
        if (userData.cartData[req.body.itemId]) {
            // If the item already exists in the cart, increment its count
            userData.cartData[req.body.itemId] += 1;
        } else {
            // If the item does not exist in the cart, add it with count 1
            userData.cartData[req.body.itemId] = 1;
        }

        // Update the user's document in the database
        await Users.findOneAndUpdate({ _id: req.user._id }, { cartData: userData.cartData });

        // Send response
        res.send("Added");
    } catch (error) {
        // If an error occurs, send an error response
        console.error("Error adding item to cart:", error);
        res.status(500).send("Internal Server Error");
    }
});


/// creating endpoint to remove product form cartData
app.post('/removefromcart', fetchUser, async (req, res) => {
    console.log("Removed", req.body.itemId);

    try {
        // Find the user data
        let userData = await Users.findOne({ _id: req.user._id });

        // If user data not found, return an error
        if (!userData) {
            return res.status(404).send("User not found");
        }

        // Check if the item exists in the cart
        if (userData.cartData[req.body.itemId] > 0) {
            // If the item count is greater than 0, decrement its count
            userData.cartData[req.body.itemId] -= 1;
        } else {
            // If the item count is already 0 or the item doesn't exist, send an error response
            return res.status(400).send("Item not found in cart");
        }

        // Update the user's document in the database
        await Users.findOneAndUpdate({ _id: req.user._id }, { cartData: userData.cartData });

        // Send success response
        res.send("Removed");
    } catch (error) {
        // If an error occurs, send an error response
        console.error("Error removing item from cart:", error);
        res.status(500).send("Internal Server Error");
    }
});


//// creating endpoint to get cartdata

app.post('/getcart',fetchUser,async(req,res)=>{
    console.log("GetCart");
    let userData = await Users.findOne({_id:req.user.id});
    res.json(userData.cartData);
})

app.listen(port,(error)=>{
    if (!error) {
        console.log("server is running on port" +port);
        
    }

    else{
        console.log("error" +error);
    }
})

//// Image Storage Engine

const storage =multer.diskStorage({
    destination:'./upload/images',
    filename:(req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

 //// Schema creating for user model

 const Users = mongoose.model('Users',{
    name:{
        type:String,
    },

    email:{
        type:String,
        unique:true,
    },

    password:{
        type:String,

    },
    cartData:{
        type:Object,
        
    },
    date:{
        type:Date,
        default:Date.now,
    }
    

 })

 //// Creating end Point for registering user


 app.post('/signup',async (req,res)=>{


    let check = await Users.findOne({email:req.body.email});
    if(check){
       return res.status(400).json({success:false,error : "existing user found with same  email id"})
    }
    let cart = {} ;
    for (let i = 0; i < 300; i++) {
        cart[i]=0;

        
    }

    const user = new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })

    await user.save();

    const data = {
        user:{
            id:user.id
        }
    }



    const token = jwt.sign(data, 'secret_ecom');
    res.json({success:true,token})
 })



 //// creating end point for user login


 app.post('/login', async(req,res)=>{
        let user = await Users.findOne({email:req.body.email});
        if(user){
             const passCompare = req.body.password === user.password;
             if(passCompare){
                const data = {
                    user:{
                        id:user.id
                    }
                }

                const token  = jwt.sign(data,'secret_ecom');
                res.json({success:true,token});

             }
             else{
                res.json({success:false,error:"Wrong Password"})
             }
        }
        else{
            res.json({success:false,error:""})
        }
 })


const upload = multer({storage:storage})

/// Creating upload Endpoint for images 

app.use('/images',express.static('upload/images'))

app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:${port}/images/${req.file.filename}`
    })

})


