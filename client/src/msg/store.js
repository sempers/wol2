import { weekNumToYear } from './week_year.js'
import Vue from 'vue'
import Vuex from 'vuex'
import { LOG, ERROR } from '../utils/logging.js'

Vue.use(Vuex);

let $store = new Vuex.Store({
    state: {
        chats: [],
        rules: [],
        nRule: {
            match: "",
            target: ""
        },
        currentSortOrder: "asc",
        currentSort: "_id",
        messages: [],
        cache: {},
        loading: true
    },

    getters: {
        canAddRule(state) {
            return state.nRule.match && state.nRule.target
        }
    },

    mutations: {
        finishLoading(state) {
            state.loading = false;
        },

        updateChats(state, chats) {
            state.chats = chats;
        },

        updateChatsStats(state, stats) {
            stats.forEach(data => {
                for (let i = 0; i < state.chats.length; i++) {
                    if (state.chats[i]._id == data.name) {
                        Vue.set(state.chats[i], "stats", data);
                    }
                }
            });
        },

        initChatStats(state, { name }) {
            state.chats.forEach((chat) => {
                if (chat._id == name) {
                    Vue.set(chat, "stats", {
                        name: chat._id,
                        sex: 'unknown',
                        years: `${weekNumToYear(chat.min)}-${weekNumToYear(chat.max)}`,
                        num: chat.cnt
                    });
                }
            });
        },

        updateRules(state, rules) {
            state.rules = rules;
        },

        ruleAdded(state, ret) {
            state.nRule._id = ret._id;
            state.rules.push(state.nRule);
            state.nRule = {
                match: "",
                target: ""
            }
        },

        ruleRemoved(state, rule) {
            state.rules = _.reject(state.rules, (r) => r._id == rule._id);
        },

        messageDeleted(state, msg) {
            state.messages = _.reject(state.messages, (m) => m._id == msg._id);
        },

        nRuleName(state, name) {
            state.nRule.match = name;
        },

        setMessages(state, {
            name,
            messages
        }) {
            state.messages = messages;
            if (messages.length > 0 && !state.cache[name]) {
                state.cache[name] = state.messages;
                LOG('selectChat', `messages for ${name} downloaded and cached`);
            }
        },

        setMessagesFromCache(state, name) {
            state.messages = state.cache[name];
        }
    },

    actions: {
        async getChats({ commit }) {
            try {
                const response = await axios.get(`${window.$server.BASE_URL}/api/msg/chats`);
                commit('updateChats', response.data);
                commit('finishLoading');
                const response1 = await axios.get(`${window.$server.BASE_URL}/api/msg/chats_stats`);
                commit('updateChatsStats', response1.data);
            } catch (e) {
                ERROR('MAIN', '/api/msg/chats failed');
            }
        },

        async getRules({ commit }) {
            try {
                const response = await axios.get(`${window.$server.BASE_URL}/api/msg/rules`)
                commit('updateRules', response.data);
            } catch (e) {
                ERROR('MAIN', '/api/msg/rules failed');
            }
        },

        async selectMatch({ state, commit }, chat) {
            let name = chat._id;
            commit('nRuleName', name);
            if (state.cache[name]) {
                commit('setMessagesFromCache', name);
            } else {
                const response = await axios.get(`${window.$server.BASE_URL}/api/msg/chat/${encodeURIComponent(name)}`);
                commit('setMessages', {
                    name,
                    messages: response.data
                });
            }
        },

        async removeRule({ commit }, rule) {
            try {
                await axios.post(`${window.$server.BASE_URL}/api/msg/removeRule`, { _id: rule._id });
                LOG('removeRule', 'rule removed');
                commit('ruleRemoved', rule);
            } catch (e) {
                ERROR('removeRule', 'error');
            }
        },

        async deleteMessage({ commit }, msg) {
            try {
                await axios.post(`${window.$server.BASE_URL}/api/msg/deleteMessage`, { _id: msg._id });
                LOG('deleteMessage', `message ${msg._id} deleted`);
                commit('messageDeleted', msg);
            } catch (e) {
                ERROR('deleteMessage', msg);
            }
        },

        async addRule({ state, commit }) {
            const response = await axios.post(`${window.$server.BASE_URL}/api/msg/addRule`, state.nRule);
            LOG('addRule', 'rule added');
            commit('ruleAdded', response.data);
        },

        async changeSex({ state }, { name }) {
            for (let i = 0; i < state.chats.length; i++) {
                if (state.chats[i] && state.chats[i].stats && state.chats[i].stats.name == name) {
                    const stats = state.chats[i].stats;
                    let sex = 'unknown';
                    if (!stats.sex || stats.sex == 'unknown') {
                        sex = 'man';
                    } else if (stats.sex == 'man') {
                        sex = 'woman';
                    } else if (stats.sex == 'woman') {
                        sex = 'unknown';
                    }
                    Vue.set(stats, "sex", sex);
                    try {
                        await axios.post(`${window.$server.BASE_URL}/api/msg/saveSex/${encodeURIComponent(name)}`, { sex });
                        console.log(`${name}'s sex is ${sex}`);
                    } catch (e) {
                        ERROR('changeSex', e);
                    }
                    return;
                }
            }
        },

        async correct({ state }) {
            try {
                await axios.get(`${window.$server.BASE_URL}/api/msg/correct`);
                toastr.success("Messages corrected, reloading");
                const response1 = await axios.get(`${window.$server.BASE_URL}/api/msg/chats?t=${(new Date()).getTime()}`);
                state.chats = response1.data;
                toastr.success("Reloaded");
            } catch (e) {
                toastr.error("/api/msg/correct error");
            }
        }
    }
});

export default $store;