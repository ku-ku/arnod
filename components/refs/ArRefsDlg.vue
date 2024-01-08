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
            //console.log('opening', item);
            this.item = {...item};
            this.show = true;
            refreshNuxtData('company-settings-item');
        },
        async save() {
            const form = this.$refs.form;
            var ok = await form.validate();
            if ( !ok ) {
                return false;
            }
            this.pending = true;
            //console.log('saving', this.item);
            try {
                const v = this.item,
                    cols = v.cols.filter( c => !/(\_at)+$/.test(c.key) ),
                    body = {};
                cols.map((c) => {
                    if ( c.type == 'date' ) {
                        body[c.key] = phpdate2m(v[c.key]).toDate();
                    } else {
                        body[c.key] = v[c.key];
                    }
                });
                let res = await $jet.api({
                    url:    (v.id > 0) ? `${v.attrs.url}/${ v.id }` : v.attrs.url,
                    method: (v.id > 0) ? 'PUT' : 'POST',
                    body
                });
                //console.log('save', res);
                if ( res.success ){
                    this.show = false;
                    this.item.id = res.id;
                    this.$emit("success");
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
        }
    }
};
</script>
