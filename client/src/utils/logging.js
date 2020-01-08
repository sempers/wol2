var t0 = (new Date()).getTime();
LOG("(logging.js)", "START LOADING SCRIPTS");

export function FIX_TIME(msg) {
    console.log((((new Date()).getTime() - t0) / 1000).toFixed(3) + "s ->  " + msg);
}
    
export function LOG(fname, msg) {
    console.log((((new Date()).getTime() - t0) / 1000).toFixed(3) + "s ->  " + `%c[${fname}]%c ${msg}`, 'background-color:green;color:white', 'background-color:white;color:black');
}
    
export function ERROR(fname, msg) {
    console.log((((new Date()).getTime() - t0) / 1000).toFixed(3) + "s ->  " + `%c[${fname}]%c ${msg}`, "background-color:red;color:white;", 'background-color:white;color:black');
}