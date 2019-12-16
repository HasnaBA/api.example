import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

//active les variables d'environnement dotenv
dotenv.config()


//connexion base de donnée mongoose
mongoose.connect('mongodb://localhost/api-example', {
    useCreateIndex: true,
    useNewUrlParser: true
});

const db = mongoose.connection;
db.on('error', console.log)
db.once('open', () => {
    console.log('We are connected')
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

function verifyToken (req, res, next) {
    let token = req.headers.authorization
    if (typeof token === 'string' &&
        token.startsWith('Bearer ')) {
        token = token.substring(7)
        try {
            jwt.verify(token, process.env.SECRET)
            //method qui permet de vérifier que le token est valid (method middleware)
            return next ()
        } catch (e) {
            res.status(401)
            res.json({
                error: "Invalid access Token !"
            })
        }
        
    } else {
        res.status(401)
        res.json({
                error: "Access Token is required !"
        })
    }
}

app.get('/me', verifyToken, (req, res) => {
    res.send('prend moi!')
})

app.post('/user', async (req, res) => {
    const email = req.body.email //recupere les valeurs depuis POSTMAN
    const password = req.body.password //les valeurs sont à controler
    const name = req.body.name
    //hasher mot de pass
    const hash = bcryptjs.hashSync(password, 8)

    //prépare insertion en BDD

    const newUser = new user({
        email,
        password: hash,
        name,
    })

    //essaie de sauvegarder l'utilisateur en base: si ca marche envoie reponse et au cas où ca ne marche on fait un catch pour envoyer une réponse
    try {
        
        const data =(await newUser.save()).toObject()
        delete data.password
        res.json(data)

    } catch (e) {
        res.status(401)
        res.json({
            error: e.errmsg
        })
    }


  

})

app.post('/login', async (req, res) => {
    const email = req.body.email
    const password = req.body.password
    const data = await user.findOne({
        email
    })
    if (bcryptjs.compareSync(password, data.password)) {
        const token = jwt.sign({
            id: data._id,
            name: data.name,
            email: data.email,
        }, process.env.SECRET, {
            expiresIn: 86400 //expire dans 60*60*24h secondes
        })
        res.json({
            token
        })
    } else {

    }
    console.log(data)
})

//method http
app.get('*', (req, res) => {
    res.status(404)
    res.send("The request URL was not found on the server.")
})

app.listen(3000, () => {
    console.log('Server run at http://localhost:3000')
})

