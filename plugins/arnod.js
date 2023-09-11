import { watch, computed } from "vue";
import arnodApp from "app-ext";
import { profile, preauth } from "app-ext/composables/profile";
import { settings } from "app-ext/composables/settings";
import { geo } from "app-ext/composables/geo";
import { all } from "~/composables/data";

export default defineNuxtPlugin(nuxtApp => {
    window["$jet"] = nuxtApp;
        
    arnodApp(nuxtApp);

    nuxtApp.subject = computed(()=>{
        return profile.subject;
    });
    
    nuxtApp.onsettings = async ()=>{
        if (!settings.local){
            return;
        }
        if ( !(profile.subject?.roles?.length > 0) ){
            console.log('profile', profile);
            try {
                let u = await preauth();
                navigateTo('/');
            } catch(e){
                console.log('ERR (preauth)', e);
            }
        }
    };
        
    nuxtApp.onuser = ()=>{
        if ( profile.hasrole("водитель") ){
            geo.watch( coords => {
                console.log('coords', coords);
                if (coords.error){
                    return;
                }
                const params = {
                        method: "telemetry.points.create",
                        jsonrpc: "2.0",
                        params: {
                            lat: coords.latitude, 
                            lng: coords.longitude, 
                            heading: coords.heading || 0,
                            speed: coords.speed || 0, 
                            telemetry_created_at: coords.timestamp,
                            extra: {
                                payload: {},
                                position: coords,
                                user_id: all.user?.id,
                                user: all.user,
                                vehicle: all.vehicle
                            }
                        }
                };
                $jet.api(params);
            });
        }
    };  //onuser
    
    const {public: config} = useRuntimeConfig();
    
    if (
            !/^(local)+/.test(window.location.host)
          &&( config.YM_ID )
       ){
        nuxtApp.YM_ID = config.YM_ID;
        //Yandex.Metrika counter
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
        (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

        ym(config.YM_ID, "init", {
             clickmap:false,
             trackLinks:false,
             accurateTrackBounce:false
        });
        ym(config.YM_ID, 'notBounce');
         //Yandex.Metrika counter 
    }
    
    nuxtApp.refresh = q => {
        refreshNuxtData(q);
    }
});