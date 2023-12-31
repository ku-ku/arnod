<template>
    <v-app>
        <NuxtLoadingIndicator />
        <v-app-bar elevation="1"
                   density="compact"
                   color="white">
            <template v-slot:prepend>
                <v-btn v-if="has('back')"
                       icon="mdi-chevron-left"
                       v-on:click='$router.go(-1)'>
                </v-btn>    
                <v-app-bar-nav-icon v-else
                                    v-on:click.stop="drawer = !drawer">
                </v-app-bar-nav-icon>
                <div class="ar-title" id="ar-title" v-html="title"></div>
            </template>
            <div id="ar-tb__prepend"></div>
            <template v-if="has('subject')">
                <template v-if="has('driver')">
                    <ar-income />
                    <v-btn icon="mdi-reload"
                           flat
                           v-on:click="reload">
                    </v-btn>
                </template>
                <template v-if="has('chief')">
                    <template v-if="has('page-index')">
                    </template>
                    <template v-else>
                        <ar-period v-on:period="setperiod" />
                        <v-btn icon="mdi-reload"
                               flat
                               v-on:click="reload">
                        </v-btn>
                    </template>
                </template>
            </template>
            <div id="ar-tb__append"></div>
        </v-app-bar>
        <v-main>
            <v-container :class="{'pa-0': has('page-order')}"
                         :fluid="has('fluid')">
                <slot />
            </v-container>
            <app-msg />
        </v-main>
        <v-footer app
                  border>
            <div class="jet-hint"></div>
            <v-spacer />
            <v-tooltip text="обработка персональных данных">
                <template v-slot:activator="{ props }">
                    <v-btn size="x-small" 
                           v-bind="props"
                           style="margin: -8px 0;"
                           flat
                           icon="mdi-information-outline"
                           href="https://web.arnod.ru/privacy/" target="_blank">
                    </v-btn>
                </template>
            </v-tooltip>    
        </v-footer>
        <v-navigation-drawer v-model="drawer"
                             temporary
                             width="25rem"
                             v-if="has('subject')">
            <v-list color="primary">
                <v-list-item class="ar-title">
                    <h1>{{ tenant.title }}</h1>
                    <h3>{{ subject.name }}</h3>
                </v-list-item>
                <v-list-item prepend-icon="mdi-account-outline"
                             title="профиль" />
                <v-list-item prepend-icon="mdi-shield-account-outline"
                             title="обработка персональных данных"
                             href="https://web.arnod.ru/privacy/" target="_blank" />
                <v-list-item prepend-icon="mdi-logout"
                             title="выйти" 
                             v-on:click="logout" />
            </v-list>
      </v-navigation-drawer>
    </v-app>
</template>
<script>
import { default as AppMsg } from "app-ext/components/AppMsg";
import { profile, logout, get as getProfile } from "app-ext/composables/profile";
import { getorders } from "~/services/orders";
import { all } from "~/composables/data";
import ArIncome from "~/components/ArIncome";
import ArPeriod from "~/components/ArPeriod";

export default {
    name: 'DefLayout',
    components: {
        AppMsg,
        ArIncome,
        ArPeriod
    },
    data(){
        return {
            drawer: false
        };
    },
    computed: {
        subject(){
            return profile.subject;
        },
        tenant(){
            return profile.tenant;
        },
        title(){
            if (this.has('page-salary')){
                return this.subject?.name || '';
            } else {
                if (all.vehicle){
                    let s = `${ all.vehicle.reg_number }<div class="text-muted text-truncate">${ all.vehicle.name }`;
                    if ( all.vehicle.trailer ) {
                        s += `, пр.:&nbsp${ all.vehicle.trailer.reg_number }`;
                    }
                    s +='</div>';
                    return s;
                }
            }
        },
        ui(){
            return all.ui;
        }
    },
    methods: {
        has(q){
            let page = useRoute().name;
            switch(q){
                case "fluid":
                    return /^(company-trips)+/.test(page)
                        || /^(company-orders)+/.test(page)
                        || /^(company-logistician)+/.test(page)
                        || /^(company-finance)+/.test(page);
                case "page-index":
                    return ("index"===page);
                case "page-order":
                    return /(orders)+/.test(page) || /(logistician)+/.test(page);
                case "page-salary":
                    return /^(salary)+/.test(page);
                case "page-company-trips":
                    return /^(company-trips)+/.test(page);
                case "back":
                    return !(/^(index)+/.test(page));
                case "subject":
                    return getProfile("has-subject");
                case "driver":
                    return profile.hasrole("водитель");
                case "chief":
                    return profile.hasrole("руководитель");
            }
            return false;
        },
        reload(){
            $jet.isHydrating = false;   //TODO: (?)
            all.set({at: (new Date()).getTime()});
            if ( this.has("page-salary") ){
                refreshNuxtData('salary');
            } else {
                if ( this.has("driver") ){
                    refreshNuxtData('orders');
                }
                if ( this.has("chief") ){
                    refreshNuxtData('company');
                }
            }
        },
        setperiod(period){
            all.set({ period });
            refreshNuxtData('company');
        },
        logout(){
            logout();
            reloadNuxtApp();
        }
    }
}
</script>
<style lang="scss">
    .v-footer {
        font-size: 0.75rem;
    }
    .v-toolbar {
        & .ar-title{
            line-height: 1.125;
        }
    }
    .v-navigation-drawer {
        & .v-list{
            padding-top: 0;
            & .ar-title{
                background: rgb(var(--v-theme-primary));
                & h1, & h3{
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    text-align: left;
                    font-size: 1rem;
                    font-weight: 400;
                    color: #fff;
                }
                & h3{
                    font-size: 0.85rem;
                    margin-top: 3rem;
                }
            }
        }
    }
</style>