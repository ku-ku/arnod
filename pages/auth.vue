<template>
    <app-auth-form v-on:auth="success" 
                   v-on:back="gohome"/>
</template>
<script>
import AppAuthForm from "app-ext/components/AppAuthForm";
import { settings } from "app-ext/composables/settings";
import { profile, preauth } from "app-ext/composables/profile";

export default {
    components: {
        AppAuthForm
    },
    setup(){
        definePageMeta({
            name: 'auth-page',
            layout: 'empty'            
        });
        useHead({
            title: `Авторизация`
        });
        
        preauth().then( resp => {
            if (resp.id > 0){
                useRouter().replace({name: 'index'});
            }
        });
    },
    computed: {
        names(){
            return settings.names;
        }
    },
    methods: {
        success(){
            console.log('subject', profile.subject);
            setTimeout(()=>{
                useRouter().replace({name: 'index'});
            }, 666);
        },
        gohome(){
            useRouter().replace({name: 'home'});
        }
    }
}
</script>
