import Vue from 'vue'
import router from './router'
import VueMaterial from 'vue-material'
import VueRouter from 'vue-router'
import WolApp from './modules/wol/WolApp.vue'

const router = new VueRouter({ routes: [
    {path: "/", component: WolApp},
    {path: "/money", component: MoneyApp}
]});

Vue.use(VueMaterial.default);

new Vue({
    el: "#app",
    router
});
