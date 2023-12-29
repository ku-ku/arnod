<template>
    <v-dialog max-width="640"
              min-height="320"
              scrollable
              v-model="show"
              eager
              content-class="ar-driver">
        <v-toolbar color="primary"
                   density="compact">
            <v-toolbar-title>
                <v-icon size="small">mdi-account</v-icon>&nbsp;
                {{ driver?.id > 0 ? `Водитель #${driver.id}` : 'Новая запись'}}
            </v-toolbar-title>
            <v-spacer />
            <v-btn icon="mdi-close"
                   flat
                   v-on:click="show = false"></v-btn>
        </v-toolbar>
        <v-form ref="form"
                v-on:submit.stop.prevent="save">
            <v-card rounded="0"
                    :loading="pending"
                    class="ar-rq">
                <v-card-text class="pb-5">
                    <v-row dense>
                        <v-col cols="12">
                            <jet-input-string label="Имя"
                                              v-model="user.full_name"
                                              type="text"
                                              name="full_name"
                                              required>
                            </jet-input-string>
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col cols="12" sm="6">
                            <jet-input-string label="Телефон"
                                              v-model="user.phone"
                                              type="text"
                                              name="phone"
                                              required>
                            </jet-input-string>
                        </v-col>
                        <v-col cols="12" sm="6">
                            <jet-input-string label="e-mail"
                                              v-model="user.email"
                                              type="text"
                                              name="email">
                            </jet-input-string>
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col cols="6">
                            <jet-input-string label="Код доступа"
                                              v-model="user.confirmation_code"
                                              type="text"
                                              name="confirmation_code">
                            </jet-input-string>
                        </v-col>
                    </v-row>
                </v-card-text>
                <v-card-actions class="justify-end">
                    <v-btn size="small"
                           prepend-icon="mdi-close"
                           variant="tonal"
                           v-on:click="show = false">закрыть</v-btn>
                    <v-btn type="submit"
                           size="small"
                           variant="elevated"
                           :loading="pending"
                           color="primary">сохранить</v-btn>
                </v-card-actions>
            </v-card>
        </v-form>
    </v-dialog>
</template>
<script>
import {ref, defineExpose, defineEmits} from "vue";
import JetInputString from "app-ext/components/editors/JetInputString";
import { refs } from "~/services/other";

const _DEFS = {
        id: 0,
        full_name: null,
        phone: null,
        email: null,
        confirmation_code: null
};
    
export default {
    name: 'ArDriver',
    components: {
        JetInputString
    },
    async setup(){
        const show   = ref(false),
              pending= ref(false),
              driver = ref(null),
              orgs   = ref([]),
              user   = ref(null);
  
        try {
            orgs.value = await refs("legals");
        } catch(e){
            console.log('ERR (orgs)', e);
        }
  
        const { error } = useAsyncData('transport-driver', async ()=>{
            if (
                    ( !show.value )
                || !( driver.value?.id > 0)
               ){
                user.value = {..._DEFS};
                return false;
            }
            pending.value = true;
            try {
                const opts = {
                    url: `/drivers/${ driver.value.id }?include=*`,
                    method: 'GET'
                };
                let res = await $jet.api(opts);
                if (res.success){
                    driver.value = res.result;
                    user.value = res.result.user;
                }
            } catch(e){
                console.log('ERR (driver)', e);
                $jet.msg({
                            text: `Ошибка получения данных водителя.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                            color: 'warning'
                });
            } finally {
                pending.value = false;
            }
        });
        
        return {
            pending,
            orgs,
            show,
            driver,
            user
        };
    },   //setup
    methods: {
        open(d){
            this.driver = {id: d?.id || 0};
            this.show = true;
            refreshNuxtData('transport-driver');
        },
        async save(){
            let ok = await this.$refs["form"].validate();
            if (!ok){
                return false;
            }
        
            this.pending = true;
            try {
                let res, id = this.driver?.id || 0;
                const body = {...unref(this.user)};
            
                /** 1. Adding driver when no */
                if ( 0 === id ){
                    res = await $jet.api({
                        url: `/drivers`,
                        method: 'POST',
                        body: {
                            confirmation_code: this.user.confirmation_code,
                            user_name: this.user.full_name,
                            user_phone: this.user.phone
                        }
                    });
                    this.driver = {id: res.result.id};
                    await refreshNuxtData("transport-driver");
                    id = res.result.user_id;
                } else {
                    id = body.id;
                }
            
                /** 2. Saving user info */
                res = await $jet.api({
                    url: `/rbac/users/${ id }`,
                    method: 'PUT',
                    body
                });
            
                if ( res.success ){
                    await refreshNuxtData("transport-driver");
                    this.show = false;
                    this.$emit("success", unref(this.driver));
                }
            } catch(e){
                ok = false;
                $jet.msg({
                            text: `Ошибка сохранения изменений.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                            color: "warning",
                            timeout: 20000
                        });
            } finally {
                this.pending = false;
            }
        }   //save
    }
}    
</script>
