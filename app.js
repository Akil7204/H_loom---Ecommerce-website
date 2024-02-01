const express=require('express')
const session = require('express-session')
const connectDb=require('./config/dbConnect')
const userRouter=require('./routers/userRouter')
const adminRouter=require('./routers/adminRouter')

require('dotenv').config();

const app=express()

connectDb()

app.use(session({
    secret:'secret',
    saveUninitialized:true,  
    resave:false
}))
app.use((req,res,next)=>{
    res.header('Cache-Control','private, no-cache,no-store,must-revalidate')
    next()
})

app.set('view engine','ejs')

app.use(express.static(__dirname + '/public'));
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use('/',userRouter)
app.use(adminRouter)

app.use("/*", (req, res) => {
    res.render("User/404");
  });


app.listen(process.env.PORT,()=>{console.log('http://localhost:3500')})