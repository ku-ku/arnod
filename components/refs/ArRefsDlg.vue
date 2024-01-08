<template>
    <v-dialog max-width="640"
              min-height="320"
              scrollable
              v-model="show"
              content-class="ar-settings">
        <v-toolbar color="primary"
                   density="compact">
            <v-toolbar-title>
                <v-icon size="small">mdi-file-table-outline</v-icon>&nbsp;
                {{ item.attrs.title }}
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
                    <v-row dense v-for="(col, i) in item.cols.filter( c => !/(\_at)+$/.test(c.key) )" :key="i">
                        <v-col cols="12">
                            <jet-input-date v-if="col.type=='date'" :label="col.title"
                                v-model="item[col.key]"
                                type="date"
                                :name="col.key"
                                required />
                            <jet-input-string v-else-if="col.type=='string'" :label="col.title"
                                v-model="item[col.key]"
                                :name="col.key"
                                type="text"
                                required />
                            <jet-input-number v-else-if="col.type=='integer'" :label="col.title"
                                v-model="item[col.key]"
                                :name="col.key"
                                required />
                            <v-checkbox v-else-if="col.type=='boolean'" color="primary" :label="col.title"
                                v-model="item[col.key]"
                                hide-details
                                :name="col.key" />
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
import { phpdate2m } from "app-ext/utils";

import JetInputDate from "app-ext/components/editors/JetInputDate";
import JetInputNumber from "app-ext/components/editors/JetInputNumber";
import JetInputString from "app-ext/components/editors/JetInputString";

export default {
    name: 'ArRefsDlg',
    components: {
        JetInputDate,
        JetInputNumber,
        JetInputString
    },
    emits: ['success'],
    async setup(){
        const { pending, error } = useAsyncData('company-settings-item', async ()=>{
            //TODO:
        });
        return {
            pending
        };
    },
    data(){
        return {
            show: false,
            item: {id: -1},
        };
    },
    methods: {
        open(item){
            console.log('opening', item);
            this.item = {...item};
            this.show = true;
            refreshNuxtData('company-settings-item');
        },
        save(){
            
        }
    }
};
    /*
    const { pending, error } = useAsyncData('company-settings-item', async ()=>{
        if ( !show.value ){
            return false;
        }
        if ( item.value.id < 1 ){
            item.value.start = new Date();
            item.value.end   = null;
            item.value.value = null;
            return false;
        }
        
        try {
            let res = await $jet.api({
                url: `${ item.value.attrs.url }/${ item.value.id }`
            });
            if ( res.success ){
                item.value.start = phpdate2m(res.result.start_date).toDate();
                item.value.end   = (res.result.end_date) ? phpdate2m(res.result.end_date).toDate() : null;
                item.value.value = res.result[item.value.attrs.val];
            }
        } catch(e){
            console.log('ERR (carriers)', e);
            $jet.msg({
                        text:`Ошибка получения данных.<br /><small>Информация для техподдержки: ${e.message} ${$jet.api.$errm}`,
                        type: 'warning'
                    });
        }
    });
    
    async function save(){
        let ok = await form.value.validate();
        if (!ok){
            return false;
        }
        
        pending.value = true;
        console.log('saving', item);
        try {
            const body = {
                start_date: $moment(item.value.start).format('YYYY-MM-DD')
            };
            if (item.value.end){
                body.end_date = $moment(item.value.end).format('YYYY-MM-DD');
            } else {
                body.end_date = null;
            }
            if (item.value.id > 0){
                body.id = item.value.id;
            }
            body[item.value.attrs.val] = item.value.value;
            console.log('saving-2', body);
            
            
            let res = await $jet.api({
                url:    (item.value.id > 0) ? `${item.value.attrs.url}/${ item.value.id }` : item.value.attrs.url,
                method: (item.value.id > 0) ? 'PUT' : 'POST',
                body
            });
            console.log('save', res);
            if ( res.success ){
                show.value = false;
                item.value.id = res.id;
                $emit("success");
            }
        } catch(e){
            ok = false;
            $jet.msg({
                        text: `Ошибка сохранения изменений.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                        color: "warning",
                        timeout: 20000
                    });
        } finally {
            pending.value = false;
        }
    }; */  //save
</script>
