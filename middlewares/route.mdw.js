import accountRoute from '../routes/account.route.js';
import auctionRoute from '../routes/auction.route.js';

export default function(app){
    app.get('/', (req,res)=>{
        res.render('home');
    });
    
    app.use('/account',accountRoute);
    
    app.use('/auction',auctionRoute);
    
    app.get('/err',(req,res)=>{
        throw new Error('Error');
    });

    app.use((req,res,next)=>{
        res.render('vwError/404');
    });

    app.use((err,req,res,next)=>{
        res.status(500).render('vwError/500');
    });
}