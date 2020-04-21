var express = require("express");
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var saml = require('passport-saml');
var SamlStrategy = require('passport-saml').Strategy;
var fs = require('fs');

var app = express();

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(session
    (
        {   secret: 'secret', 
            resave: false, 
            saveUninitialized: true
        }
    )
);

app.get('/',
    function(req, res) {
        // var p = fs.readFileSync(__dirname + '/certs/key.pem', 'utf8');
        // console.log(p);
        res.send('Test Home Page');
    }
);

passport.serializeUser(function(user, done) {
    console.log('-----------------------------');
    console.log('serialize user');
    console.log(user);
    console.log('-----------------------------');
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    console.log('-----------------------------');
    console.log('deserialize user');
    console.log(user);
    console.log('-----------------------------');
    done(null, user);
});

// var samlStrategy = new saml.Strategy({
//     // config options here
//     callbackUrl: 'http://localhost:4300/login/callback',
//     entryPoint: 'http://idp.centralus.cloudapp.azure.com:8080/simplesaml/saml2/idp/SSOService.php',
//     issuer: 'saml-poc',
//     identifierFormat: null,
//     decryptionPvk: fs.readFileSync(__dirname + '/certs/key.pem', 'utf8'),
//     privateCert: fs.readFileSync(__dirname + '/certs/idp_key.pem', 'utf8'),
//     validateInResponseTo: false,
//     disableRequestedAuthnContext: true
// }, function(profile, done) {
//     return done(null, profile);
// });

// passport.use('samlStrategy', samlStrategy);
passport.use('samlStrategy',new SamlStrategy(
    {
      path: '/login/callback',
      entryPoint: 'http://idp.centralus.cloudapp.azure.com:8080/simplesaml/saml2/idp/SSOService.php',
      issuer: 'saml-poc',
      //--- Identity Provider's Public Key
      cert: fs.readFileSync(__dirname + '/certs/idp_key.pem', 'utf8'),
      //--- Service Provider private key
      decryptionPvk: fs.readFileSync(__dirname + '/certs/key.pem', 'utf8'),
      //--- Service Provider Certificate
      //   privateCert: {
      //     key : fs.readFileSync(__dirname + '/certs_platform/cert.pem', 'utf8'),
      //     // passphrase : '1234'
      //   }, 
      privateCert: fs.readFileSync(__dirname + '/certs/cert.pem', 'utf8'),
      identifierFormat: null,
      validateInResponseTo: false,
      disableRequestedAuthnContext: true
    },
    function(profile, done) {
        console.log(profile);
        return done(null, profile);
    //   findByEmail(profile.email, function(err, user) {
    //     if (err) {
    //       return done(err);
    //     }
    //     return done(null, user);
    //   });
    })
  );

app.use(passport.initialize({}));
app.use(passport.session({}));

app.get('/login',
    function (req, res, next) {
        console.log('-----------------------------');
        console.log('/Start login handler');
        next();
    },
    passport.authenticate('samlStrategy'),
);

app.post('/login/callback',
    function (req, res, next) {
        console.log('-----------------------------');
        console.log('/Start login callback ');
        next();
    },
    passport.authenticate('samlStrategy'),
    function (req, res) {
        console.log('-----------------------------');
        console.log('login call back dumps');
        console.log(req.user);
        console.log('-----------------------------');
        res.send('Log in Callback Success');
    }
);

app.get('/metadata',
    function(req, res) {
        res.type('application/xml'); 
        res.status(200).send(
          samlStrategy.generateServiceProviderMetadata(
             fs.readFileSync(__dirname + '/certs/cert.pem', 'utf8'), 
             fs.readFileSync(__dirname + '/certs/cert.pem', 'utf8')
          )
        );
    }
);

var server = app.listen(4300, function () {
    console.log('Listening on port %d', server.address().port)
});