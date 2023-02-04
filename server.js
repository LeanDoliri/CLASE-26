import express from "express";
import session from "express-session";
import exphbs from 'express-handlebars';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
import passport from "passport";
import { Strategy } from "passport-local";
const LocalStrategy = Strategy;

const app = express();

/*============================[Middlewares]============================*/


passport.use(new LocalStrategy(
    async function (username, password, done) {
        const existeUsuario = await usuariosDB.find(usuario => usuario.nombre == username);

        if (!existeUsuario) {
            return done(null, false);
        } else {
            return done(null, existeUsuario);
        }
    }
));

passport.serializeUser((usuario, done) => {
    done(null, usuario.nombre);
});

passport.deserializeUser((nombre, done) => {
    const existeUsuario = usuariosDB.find(usuario => usuario.nombre == nombre);
    done(null, existeUsuario);
});

/*----------- Session -----------*/
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 20000 //20 seg
    }
}));

app.use(passport.initialize());
app.use(passport.session());

/*----------- Motor de plantillas -----------*/
app.set('views', 'src/views');
app.engine('.hbs', exphbs.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    extname: '.hbs'
}));
app.set('view engine', '.hbs');

app.use(express.urlencoded({extended: true}));
app.use(express.json());

function isAuth(req, res, next) {
    if (req.isAuthenticated()) {
        next()
    } else {
        res.redirect('/login')
    }
}

/*============================[Base de Datos]============================*/
const usuariosDB = [];

/*============================[Rutas]============================*/
app.get('/', (req, res) => {
    res.redirect('login');
});

app.get('/login', (req, res) => {
    res.render('login.hbs');
});

app.get('/register', (req, res) => {
    res.render('register.hbs');
});

// app.post('/login', (req, res) => {
//     const {nombre, password} = req.body;

//     const usuario = usuariosDB.find(usr => usr.nombre == nombre && usr.password == password);

//     if(!usuario){
//         res.render('login-error.hbs')
//     }else{
//         req.session.nombre = nombre;
//         req.session.contador = 0

//         res.redirect('/data')
//     }
// });

app.post('/login', passport.authenticate('local', { successRedirect: '/data', failureRedirect: '/login-error' }));

// app.get('/data', (req, res) => {
//     if (req.session.nombre) {
//         req.session.contador ++;

//         const userData = usuariosDB.find(usr =>{
//             return usr.nombre == req.session.nombre
//         });

//         res.render('data', {
//             datos: userData,
//             contador: req.session.contador
//         })
//     }else{
//         res.render('login')
//     }
// });

app.get('/data', isAuth, (req, res) => {
    if (!req.user.contador) {
        req.user.contador = 1
    } else {
        req.user.contador++
    }
    const datosUsuario = {
        nombre: req.user.nombre,
        direccion: req.user.direccion
    }
    res.render('data', { contador: req.user.contador, datos: datosUsuario });
})
    
// app.post('/register', (req, res) => {
//     const {nombre, password, direccion} = req.body;
//     const user = usuariosDB.find(usr => usr.nombre == nombre)

//     if (user) {
//         res.render('register-error.hbs')
//     }else{
//         usuariosDB.push({nombre, password, direccion});
//         res.render('login.hbs')
//     }
// });

app.post('/register', (req, res) => {
    const { nombre, password, direccion } = req.body;

    const newUsuario = usuariosDB.find(usuario => usuario.nombre == nombre);
    if (newUsuario) {
        res.render('register-error')
    } else {
        usuariosDB.push({ nombre, password: password, direccion });
        res.redirect('/login')
    }
})

app.get('/logout', (req, res) => {
    req.session.destroy(err =>{
        if (err) {
            throw err
        } else {
            res.redirect('/login')
        }
    });
});

app.get('/login-error', (req, res) => {
    res.render('login-error');
});
/*============================[Servidor]============================*/

const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
})
server.on('error', error => {
    console.error(`Error en el servidor ${error}`);
});