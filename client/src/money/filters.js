import $store from './store.js'
import moment from 'moment'

export default {
    fmtAmount(amount, options) {
        options = options || {};

        if (isNaN(amount))
            return "NaN";
        if (amount === "")
            return amount;
        if (amount % 1 === 0) { //Integer
            options.places = 0;
        }
        let n = amount;
        let places = options.places || 0;
        let t_sep = options.no_thousand ? '' : $store.THOUSAND;
        let d_sep = $store.DECIMAL;
        let sign = n < 0 ? "-" : (options.delta ? "+" : "");
        if (Math.abs(n) == Infinity) {
            return (options.prefix || "") + sign + "∞" + (options.suffix || "");
        }
        if (options.max_n && n > options.max_n) {
            return (options.prefix || "") + ">" + options.max_n + (options.suffix || "");
        }
        let intPart = parseInt(n = Math.abs(+n || 0).toFixed(places)).toString();
        let fracPart = (places ? d_sep + Math.abs(n - intPart).toFixed(places).slice(2) : "");
        if (fracPart.length > 0) {
            while (fracPart[fracPart.length - 1] == "0" && fracPart != d_sep + "0")
                fracPart = fracPart.substr(0, fracPart.length - 1);
        }
        let firstThousandSep = intPart.length > 3 ? intPart.length % 3 : 0;
        let result = (options.prefix || "") + sign +
            (firstThousandSep ? intPart.substr(0, firstThousandSep) + t_sep : "") +
            intPart.substr(firstThousandSep).replace(/(\d{3})(?=\d)/g, "$1" + t_sep) + fracPart + (options.suffix || "");
        return result;
    },

    date(d) {
        if (!(d instanceof Date))
            return "n/a";
        return moment(d).format("DD.MM.YYYY");
    }
}