import express from "express";
import {user} from "../model/model.js";

const router = express.Router();

router.get('/', async (req,res)=>{
    if (req.query.username!==undefined){
        try{
        let info = await user.getUser(req.query.username);
        info.username=req.query.username;
        if(info.type==='seller'){
            info.isSeller=true;
        }
        else{
            info.isSeller=false;
        }

        if(req.session.auth){
            if(req.session.authUser.username===req.query.username){
                info.isSelf=true;
            }else{
                info.isSelf=false;
            }
        }
        else{
            info.isSelf=false;
        }

        info.downvoteCount=+info.totalVote-+info.upvoteCount;

        res.render('vwAccount/Profile_Infor',{info: info});
        }
        catch{
            res.render('vwError/404');
        }
    }
    else{
        res.render('vwError/404');
    }
})

router.post('/edit', async (req,res)=>{
    console.log(req.body);
    const username=req.session.authUser.username
    try{
    await user.updateInfo(username,{
        name: req.body.name,
        dob: req.body.dob,
    });
        req.session.authUser = await user.getUser(username);
        req.session.authUser.username = username;
        req.session.authUser.minName=req.session.authUser.name.split(' ')[0];
        if(req.session.authUser.type==='seller')
            req.session.authUser.isSeller = true;
        else{
            req.session.authUser.isSeller = false;
        }
    }catch(err){
        console.log(err);
    }
    res.redirect('/account?username='+username);
})

router.get('/change-pwd',async(req,res)=>{
    if (req.query.username!==undefined){
        try{
            let info = await user.getUser(req.query.username);
            info.username=req.query.username;
            if(req.session.auth){
                if(req.session.authUser.username===req.query.username){
                    info.isSelf=true;
                    if(info.type==='seller'){
                        info.isSeller=true;
                    }
                    else{
                        info.isSeller=false;
                    }
                    info.downvoteCount=+info.totalVote-+info.upvoteCount;
                    res.render('vwAccount/Profile_ChangePassword',{info: info});
                }else{
                    info.isSelf=false;
                    res.render('vwError/404');
                }
            }
            else{
                info.isSelf=false;
                res.render('vwError/404');
            }
        }catch{
            res.render('vwError/404');
        }
    }
    else{
        res.render('vwError/404');
    }
})

router.post('/change-pwd',async(req,res)=>{
    if (req.query.username!==undefined){
        const username=req.session.authUser.username
        if(user.checkPassword(username,req.body.password)){
            await user.updateInfo(username,{
                password: req.body.newPassword,
            });
            res.redirect('/account?username='+username);
        }
        else res.redirect('/change-pwd?username='+username,{alertMessage: 'Wrong password'});
    }
    else{
        res.render('vwError/404');
    }
})

router.get('/fav',async(req,res)=>{
    if (req.query.username!==undefined){
        try{
            let info = await user.getUser(req.query.username);
            info.username=req.query.username;
            if(req.session.auth){
                if(req.session.authUser.username===req.query.username){
                    info.isSelf=true;
                }else{
                    info.isSelf=false;
                }
            }
            else{
                info.isSelf=false;
            }
            if(info.type==='seller'){
                info.isSeller=true;
            }
            else{
                info.isSeller=false;
            }
            info.downvoteCount=+info.totalVote-+info.upvoteCount;
            res.render('vwAccount/Profile_FavourAndWon',{info: info});
        }catch{
            res.render('vwError/404');
        }
    }
    else{
        res.render('vwError/404');
    }
})

router.get('/point',async(req,res)=>{
    if (req.query.username!==undefined){
        try{
        let info = await user.getUser(req.query.username);
        info.username=req.query.username;
        if(req.session.auth){
            if(req.session.authUser.username===req.query.username){
                info.isSelf=true;
            }else{
                info.isSelf=false;
            }
        }
        else{
            info.isSelf=false;
        }
            if(info.type==='seller'){
                info.isSeller=true;
            }
            else{
                info.isSeller=false;
            }
            info.downvoteCount=+info.totalVote-+info.upvoteCount;
            if(info.totalCount===0)
                info.percentVote=0;
            else
                info.percentVote=Math.round((+info.upvoteCount/+info.totalVote)*100);
            res.render('vwAccount/Profile_Point',{info: info});
        }catch{
            res.render('vwError/404');
        }
    }
    else{
        res.render('vwError/404');
    }
})

router.get('/sell',async(req,res)=>{
    if (req.query.username!==undefined){
        try{
            let info = await user.getUser(req.query.username);
            info.username=req.query.username;
            if(req.session.auth){
                if(req.session.authUser.username===req.query.username){
                    info.isSelf=true;
                }else{
                    info.isSelf=false;
                }
            }
            else{
                info.isSelf=false;
            }
            if(info.type==='seller'){
                info.isSeller=true;
            }
            else{
                info.isSeller=false;
            }
            info.downvoteCount=+info.totalVote-+info.upvoteCount;
            res.render('vwAccount/Profile_Sell',{info: info});
        }catch{
            res.render('vwError/404');
        }
    }
    else{
        res.render('vwError/404');
    }
})

router.get('/login', (req, res) => {
    if(req.session.auth){
        res.redirect('/account/info');
    }
    else{
        res.render('vwAccount/login');
    }
});

router.post('/login', async (req, res) => {
    try{
        if(await user.checkPassword(req.body.username, req.body.password)){
            req.session.auth = true;
            req.session.authUser = await user.getUser(req.body.username);
            req.session.authUser.username = req.body.username;
            req.session.authUser.minName=req.session.authUser.name.split(' ')[0];
            if(req.session.authUser.type==='seller')
                req.session.authUser.isSeller = true;
            else{
                req.session.authUser.isSeller = false;
            }
            res.redirect('/');
        }
        else
        {
            res.render('vwAccount/Login',{
                err_message: "Invalid username or password"})
            }
        }
    catch{
        res.render('vwAccount/Login',{
            err_message: "Invalid username or password"})
    }
});

router.get('/logout', (req, res) => {
    req.session.auth = false;
    req.session.authUser = null;
    res.redirect('/');
});

router.get('/signup', (req, res) => {
    if(req.session.auth){
        res.redirect('/account/info');
    }
    else{
        res.render('vwAccount/signup');
    }
});

router.get('/is-available', async (req, res) => {
    const name  = req.query.user;
    try{
        const username = await user.getUser(name);
        res.json(false);
    }
    catch{
        return res.json(true)
    }
})

router.post('/signup', async (req, res) => {
    await user.newUser(req.body.username, req.body.password,  req.body.name, req.body.dob ,req.body.email, "bidder");
    res.redirect('/account/login');
});

export default router;