import { get as getProfile } from "app-ext/composables/profile";

export default defineNuxtRouteMiddleware((to, from) => {
    if ( !/^(auth)+/.test(to.name) ){
        if ( !getProfile("has-subject") ){
            return navigateTo('/auth');
        }
    }
});