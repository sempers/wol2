var vm = new Vue({
    el: "#vwol",

    template: "#template",

    store: $store,

    created() {
        this.$store.dispatch('getChats');
        this.$store.dispatch('getRules');
    },

    methods: {
        changeSex(chat) {
            if (!chat.stats) {
                this.$store.commit('initChatStats', {name: chat._id});
            }
            this.$store.dispatch('changeSex', {name: chat._id});
        },

        addRule() {
            if (!(this.$store.getters.canAddRule))
                return;
            this.$store.dispatch('addRule');
        },

        removeRule(rule) {
            if (!rule)
                return;
            this.$store.dispatch('removeRule', rule);
        },

        selectMatch(chat) {
            this.$store.dispatch('selectMatch', chat);
        },

        correct() {
            this.$store.dispatch('correct');
        },

        deleteMessage(msg) {
            this.$store.dispatch('deleteMessage', msg);
        }
    },
    filters: {
        fmtDate(date) {
            return moment(date).local().format('DD.MM.YYYY HH:mm:ss');
        }
    }
});