import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import bcryptjs from 'bcryptjs'

//connexion base de donnée mongoose
mongoose.connect('mongodb://localhost/api-example', {
    useCreateIndex: true,
    useNewUrlParser: true
});

const db = mongoose.connection;
db.on('error', console.log)
db.once('open', () => {
    console.log ('We are connected')
  // we're connected!
})

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        unique: true,
        type: String,
    },
    password: String
  });

const user = mongoose.model('user', userSchema);




//initialise express
const app = express()

//on autorise tout le monde à se connecter
app.use(cors({    
    origin: '*'
}))

//autorise un certain type de données
app.use(bodyParser.json())



app.post ('/user', async (req, res) => {
    const email = req.body.email //recupere les valeurs depuis POSTMAN
    const password = req.body.password //les valeurs sont à controler
    const name = req.body.name 
    //hasher mot de pass
    const hash = bcryptjs.hashSync(password, 8)

    //prépare insertion en BDD

    const response = new user ({ 
        email,
        password: hash,
        name,
    }) 
    
    //essaie de sauvegarder l'utilisateur en base: si ca marche envoie reponse et au cas où ca ne marche on fait un catch pour envoyer une réponse
    try { 
        res.json(await response.save())
        
   
    }   catch (e) {
        res.status(401)
        res.json({
            error: e.errmsg
        })
    }


    console.log(hash)

})

//method http
app.get('*', (req,res) => {
    res.status(404)
    res.send("The request URL was not found on the server.")
})

app.listen(3000, () => {
    console.log('Server run at http://localhost:3000')
})

