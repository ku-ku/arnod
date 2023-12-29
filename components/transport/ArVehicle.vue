<template>
    <v-dialog max-width="800"
              min-height="640"
              scrollable
              v-model="show"
              content-class="ar-vehicle">
        <v-toolbar color="primary"
                   density="compact">
            <v-toolbar-title>
                <v-icon size="small">mdi-truck-flatbed</v-icon>&nbsp;
                {{ vehicle?.id > 0 ? `Транспорт #${vehicle.id}` : 'Новая запись'}}
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
                            <v-autocomplete v-model="vehicle.legal_entity"
                                            :items="orgs"
                                            item-title="title"
                                            item-value="id"
                                            label="Организация"
                                            return-object>
                            </v-autocomplete>
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col cols="12" sm="3">
                            <jet-input-string label="Гос.знак"
                                              v-model="vehicle.reg_number"
                                              type="text"
                                              name="reg_number"
                                              required>
                            </jet-input-string>
                        </v-col>
                        <v-col cols="12" sm="3">
                            <jet-input-string label="Марка/модель"
                                              v-model="vehicle.name"
                                              type="text"
                                              name="name"
                                              required>
                            </jet-input-string>
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col cols="12" sm="3">
                            <jet-input-number label="К-во осей"
                                              v-model="vehicle.axes"
                                              type="integer"
                                              name="axes"
                                              required>
                            </jet-input-number>
                        </v-col>
                        <v-col cols="12" sm="3">
                            <jet-input-number label="Вес"
                                              v-model="vehicle.weight"
                                              type="integer"
                                              name="weight"
                                              required>
                            </jet-input-number>
                        </v-col>
                        <v-col cols="12" sm="3">
                            <jet-input-number label="Год выпуска"
                                              v-model="vehicle.release_year"
                                              type="integer"
                                              name="release_year"
                                              required>
                            </jet-input-number>
                        </v-col>
                        <v-col cols="12" sm="3">
                            <jet-input-number label="Объем бака (л)"
                                              v-model="vehicle.fuel_capacity"
                                              type="integer"
                                              name="fuel_capacity"
                                              required>
                            </jet-input-number>
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col cols="12">
                            <jet-input-string label="Описание"
                                              v-model="vehicle.description"
                                              type="text"
                                              name="description">
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
<script setup>
    import JetInputString from "app-ext/components/editors/JetInputString";
    import JetInputNumber from "app-ext/components/editors/JetInputNumber";
    import { refs } from "~/services/other";
    
    const show   = ref(false),
          pending= ref(false),
          vehicle= ref(null),
          form   = ref(null),
          orgs    = ref([]);
  
    try {
        orgs.value = await refs("legals");
    } catch(e){
        console.log('ERR (orgs)', e);
    }
    
    const { error } = useAsyncData('transport-vehicle', async ()=>{
        if (
                ( !show.value )
            || !( vehicle.value?.id > 0)
           )
        {
            return false;
        }
        pending.value = true;
        try {
            const opts = {
                url: `/vehicles/${ vehicle.value.id }`,
                method: 'GET'
            };
            let res = await $jet.api(opts);
            if (res.success){
                vehicle.value = res.result;
            }
        } catch(e){
            console.log('ERR (vehicle)', e);
            $jet.msg({
                        text: `Ошибка получения данных ТС.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                        color: 'warning'
            });
        } finally {
            pending.value = false;
        }
    });
    
  
    defineExpose({
        open: vc => {
            vehicle.value = {id: vc?.id || 0};
            show.value = true;
            refreshNuxtData('transport-vehicle');
        }
    });
    
    const $emit = defineEmits(["success"]);
  
    async function save(){
        let ok = await form.value.validate();
        if (!ok){
            return false;
        }
        
        pending.value = true;
        try {
            const body = unref(vehicle);
            
            let res = await $jet.api({
                url: (body.id > 0) ? `/vehicles/${ body.id }` : '/vehicles',
                method: (body.id > 0) ? 'PUT' : 'POST',
                body
            });
            console.log('save', res);
            if ( res.success ){
                vehicle.value.id = res.result.id;
                await refreshNuxtData("transport-vehicle");
                show.value = false;
                $emit("success", unref(vehicle));
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
        
    }
    
</script>

