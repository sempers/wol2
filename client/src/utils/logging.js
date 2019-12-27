export default {
    FIX_TIME(msg) {
        console.log((((new Date()).getTime() - t0) / 1000).toFixed(3) + "s ->  " + msg);
    },
    
    LOG(fname, msg) {
        console.log((((new Date()).getTime() - t0) / 1000).toFixed(3) + "s ->  " + `%c[${fname}]%c ${msg}`, 'background-color:green;color:white', 'background-color:white;color:black');
    },
    
    ERROR(fname, msg) {
        console.log((((new Date()).getTime() - t0) / 1000).toFixed(3) + "s ->  " + `%c[${fname}]%c ${msg}`, "background-color:red;color:white;", 'background-color:white;color:black');
    }
}