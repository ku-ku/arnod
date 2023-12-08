<template>
    <v-dialog max-width="640"
              min-height="320"
              scrollable
              v-model="show"
              content-class="ar-settings">
        <v-toolbar color="primary"
                   density="compact">
            <v-toolbar-title>
                <v-icon size="small">{{ item.attrs.icon }}</v-icon>&nbsp;
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
                    <v-row dense>
                        <v-col cols="12" sm="6">
                            <jet-input-date label="Дата начала действия"
                                            v-model="item.start"
                                            type="date"
                                            name="start"
                                            required />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <jet-input-date label="Дата окончания действия"
                                            type="date"
                                            name="end"
                                            v-model="item.end" />
                        </v-col>
                        <v-col cols="12" sm="4">
                            <jet-input-number label="Значение"
                                              v-model="item.value"
                                              autofocus
                                              type="currency"
                                              name="val"
                                              required />
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
<script setup>
    import { phpdate2m } from "app-ext/utils";
    
    import JetInputDate from "app-ext/components/editors/JetInputDate";
    import JetInputNumber from "app-ext/components/editors/JetInputNumber";
    
    const $emit = defineEmits(['success']);
    const show = ref(false);
    const item = ref({id: -1});
    const form = ref(null);
    
    defineExpose({
        open: _item => {
            console.log('opening', _item);
            item.value = {..._item};
            show.value = true;
            refreshNuxtData('company-settings-item');
        }
    });
    
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
    };   //save
</script>
