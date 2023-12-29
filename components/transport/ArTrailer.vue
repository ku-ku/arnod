<template>
    <v-dialog max-width="800"
              min-height="640"
              scrollable
              v-model="show"
              content-class="ar-trailer">
        <v-toolbar color="primary"
                   density="compact">
            <v-toolbar-title>
                <v-icon size="small">mdi-truck-trailer</v-icon>&nbsp;
                {{ trailer?.id > 0 ? `Прицеп #${trailer.id}` : 'Новая запись'}}
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
                        <v-col cols="6">
                            <v-autocomplete v-model="trailer.vehicle_type"
                                            :items="types"
                                            item-title="title"
                                            item-value="id"
                                            label="Тип ТС"
                                            return-object>
                            </v-autocomplete>
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col cols="12" sm="3">
                            <jet-input-string label="Гос.знак"
                                              v-model="trailer.reg_number"
                                              type="text"
                                              name="reg_number"
                                              required>
                            </jet-input-string>
                        </v-col>
                        <v-col cols="12" sm="3">
                            <jet-input-string label="Марка/модель"
                                              v-model="trailer.name"
                                              type="text"
                                              name="name"
                                              required>
                            </jet-input-string>
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col cols="12" sm="3">
                            <jet-input-number label="К-во осей"
                                              v-model="trailer.axes"
                                              type="integer"
                                              name="axes"
                                              required>
                            </jet-input-number>
                        </v-col>
                        <v-col cols="12" sm="3">
                            <jet-input-number label="Вес"
                                              v-model="trailer.weight"
                                              type="integer"
                                              name="weight"
                                              required>
                            </jet-input-number>
                        </v-col>
                        <v-col cols="12" sm="3">
                            <jet-input-number label="Год выпуска"
                                              v-model="trailer.release_year"
                                              type="integer"
                                              name="release_year"
                                              required>
                            </jet-input-number>
                        </v-col>
                        <v-col cols="12" sm="3">
                            <jet-input-number label="Объем"
                                              v-model="trailer.volume"
                                              type="integer"
                                              name="volume"
                                              required>
                            </jet-input-number>
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col cols="12" sm="6">
                            <v-autocomplete v-model="trailer.vehicles_loading_types"
                                            :items="loads"
                                            chips
                                            closable-chips
                                            item-title="title"
                                            item-value="id"
                                            label="Типы загрузки"
                                            multiple
                                            return-object>
                                <template v-slot:chip="{ props, item }">
                                    <v-chip v-bind="props"
                                        :text="item.raw.name">
                                    </v-chip>
                                </template>
                            </v-autocomplete>
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-autocomplete v-model="trailer.vehicles_unloading_types"
                                            :items="unloads"
                                            chips
                                            closable-chips
                                            item-title="title"
                                            item-value="id"
                                            label="Типы выгрузки"
                                            multiple
                                            return-object>
                                <template v-slot:chip="{ props, item }">
                                    <v-chip v-bind="props"
                                        :text="item.raw.name">
                                    </v-chip>
                                </template>
                            </v-autocomplete>
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col cols="12">
                            <jet-input-string label="Описание"
                                              v-model="trailer.description"
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
          trailer= ref(null),
          form   = ref(null),
          loads  = ref([]),
          unloads= ref([]),
          types  = ref([]);
  
    try {
        loads.value = await refs("vehiloading");
        unloads.value = await refs("vehiunloading");
        types.value   = await refs("vehitypes");
    } catch(e){
        console.log('ERR (refs)', e);
    }
    
    const { error } = useAsyncData('transport-trailer', async ()=>{
        if (
                ( !show.value )
            || !( trailer.value?.id > 0)
           )
        {
            return false;
        }
        pending.value = true;
        try {
            const opts = {
                url: `/trailers/${ trailer.value.id }?include=*`,
                method: 'GET'
            };
            let res = await $jet.api(opts);
            if (res.success){
                trailer.value = res.result;
            }
        } catch(e){
            console.log('ERR (trailer)', e);
            $jet.msg({
                        text: `Ошибка получения данных прицепа.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                        color: 'warning'
            });
        } finally {
            pending.value = false;
        }
    });
    
  
    defineExpose({
        open: t => {
            trailer.value = {id: t?.id || 0};
            show.value = true;
            refreshNuxtData('transport-trailer');
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
            const body = unref(trailer);
            
            let res = await $jet.api({
                url: (body.id > 0) ? `/trailers/${ body.id }` : '/trailers',
                method: (body.id > 0) ? 'PUT' : 'POST',
                body
            });
            if ( res.success ){
                trailer.value.id = res.result.id;
                await refreshNuxtData("transport-trailer");
                show.value = false;
                $emit("success", unref(trailer));
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


