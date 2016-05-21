var express = require('express');
var auth_model = require('../models/auth');
var sha1 = require('sha1');
var router = express.Router();

router.post('/:token', function(req, res, next){
    auth_model.authenticate(req.body.username, sha1(req.body.password), function(error, doc){
        if(error){ cb(error);
        }else{
            if(doc){
                res.json({
                    success:true,
                    message:'',
                    data:{
                        token:'==='
                    }
                });
            }else{
                res.status(401).json({
                    success:false,
                    message:'Con los datos proporcionados no ha sido posible identificarte, por favor verifica e intenta de nuevo',
                    data:{}
                })
            }
        }
    })
});

module.exports = router;
