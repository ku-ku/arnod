<template>
    <v-dialog max-width="800"
              min-height="640"
              scrollable
              v-model="show">
        <v-toolbar color="primary"
                   density="compact">
            <v-toolbar-title>
                <v-icon size="small">mdi-account-plus-outline</v-icon>&nbsp;
                Заявка на регистрацию #{{ request?.id }}
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
                        <v-col cols="12" sm="4">
                            <jet-input-string label="ИНН"
                                              v-model="request.tin"
                                              type="text"
                                              name="tin"
                                              required>
                            </jet-input-string>
                        </v-col>
                        <v-col cols="12" sm="8">
                            <jet-input-string label="Организация"
                                              v-model="request.title"
                                              type="text"
                                              name="org"
                                              required>
                            </jet-input-string>
                            <div class="text-right">
                                <v-btn variant="tonal"
                                       color="default"
                                       size="small"
                                       prepend-icon="mdi-archive-search-outline"
                                       v-on:click="checkinn()">
                                    проверить ИНН       
                                </v-btn>
                            </div>    
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col cols="12" sm="4">
                            <jet-input-string label="Имя"
                                              v-model="request.name"
                                              type="text"
                                              name="name"
                                              required>
                            </jet-input-string>
                        </v-col>
                        <v-col cols="12" sm="4">
                            <jet-input-string label="e-mail"
                                              v-model="request.email"
                                              type="text"
                                              name="email">
                            </jet-input-string>
                        </v-col>
                        <v-col cols="12" sm="4">
                            <jet-input-string label="Телефон"
                                              v-model="request.phone"
                                              type="tel"
                                              name="phone">
                            </jet-input-string>
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col cols="12" sm="4">
                            <v-checkbox class="mt-5"
                                        label="перевозчик"
                                        hide-details
                                        density="compact"
                                        v-model="request.isTransportation"></v-checkbox>
                        </v-col>
                        <v-col cols="12" sm="8">
                            <v-autocomplete v-model="request.vehicle_types"
                                            :items="vehicle_types"
                                            chips
                                            closable-chips
                                            item-title="title"
                                            item-value="id"
                                            label="типы ТС"
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
                            <v-textarea label="примечания"
                                        rows="1"
                                        v-model="request.comment"></v-textarea>
                        </v-col>
                    </v-row>
                    <v-row dense v-if="request.files?.length > 0">
                        <v-col cols="12" class="ar-rq__attachments">
                            <h4>Документы</h4>
                            <v-btn v-for="f in request.files"
                                   size="small"
                                   variant="tonal"
                                   v-on:click="download(f)">
                                {{ filename(f) }}
                            </v-btn>
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
    import { refs as getrefs } from "~/services/other";
    import { empty } from "app-ext/utils";
    
    
    const show   = ref(false),
          pending= ref(false),
          request= ref(null),
          form   = ref(null),
          vehicle_types = ref([]);
  
    try {
        vehicle_types.value = await getrefs("vehitypes");
    } catch(e) {
        console.log('ERR (vehicle_types)', e);
    }
  
    const { error } = useAsyncData('users-request', async ()=>{
        if (
                ( !show.value )
             || ( !request.value?.id)
           )
        {
            return false;
        }
        pending.value = true;
        try {
            let res = await $jet.api({
                url: `/rbac/user_registrations/${ request.value.id }`
            });
            console.log('rq', res);
            if (res.success){
                request.value = res.result;
                if (res.result.attrs){
                    request.value.title = res.result.attrs.org;
                    request.value.name  = res.result.attrs.name;
                    if (res.result.attrs.vehicle_types?.length > 0){
                        request.value.vehicle_types = [];
                        res.result.attrs.vehicle_types.forEach( id => {
                            let n = vehicle_types.value.findIndex( vt => vt.id === id );
                            if ( n > -1 ){
                                request.value.vehicle_types.push(vehicle_types.value[n]);
                            }
                        });
                    }
                }
            } else {
                throw {message: res.error};
            }
        } catch(e){
            console.log('ERR (request)', e);
        } finally {
            pending.value = false;
        }
    });
    
    function filename(file){
        return /(passport-1)+/.test(file) 
                ? "Паспорт стр.1"
                : /(passport-5)+/.test(file) 
                ? "Паспорт стр.5"
                : /(license)+/.test(file) 
                ? "Вод.удостоверение"
                : /(vehicle)+/.test(file) 
                ? "СТС"
                : "неизвестно";
    };  //filename
    
    function download(file){
        var file = encodeURIComponent(file);
        let opts  = {
            url: `/rbac/user_registrations/${ request.value.id }/attachments`,
            params: {
                file
            }
        };
        $jet.api(opts).then( res => {
            if (res.success){
                let img = new Image();
                img.src = res.result;
                img.style="width:640px;height:auto;margin: 0 auto;"
                let handle = window.open("", "_blank", `toolbar=false,location=false,directories=false,status=false,menubar=false,scrollbars=yes,resizable=yes,width=672,height=480,left=${ Math.trunc((screen.width-640)/2) },top=${ Math.trunc((screen.height-480)/2) }`);
                if (handle){
                    handle.document.title = filename(file);
                    handle.document.body.appendChild(img);
                    handle.focus();
                }
            }
        }).catch(e => {
            console.log('ERR (download)', e);
        });
    };
    
    defineExpose({
        open: rq => {
            request.value = {id: rq.id};
            show.value = true;
            refreshNuxtData('users-request');
        }
    });
    
    const $emit = defineEmits(["success"]);
    
    async function checkinn(){
        if ( empty(request.value.tin) ){
            return false;
        }
        pending.value = true;
        try {
            const token = '552b15ee51ba61b10624d3009bf6bac764842df2'; //TODO: to conf
            let res = await $.ajax({
                url: `https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party?query=${request.value.tin}`,
                crossDomain: true,
                headers: {
                    Accept: 'application/json',
                    Authorization: 'Token ' + token
                }
            });
            let suggestion = null;
            if (res.suggestions?.length){
                suggestion = res.suggestions.filter(s => {
                    if (s.data?.state?.status){
                        return ('ACTIVE'===s.data.state.status);
                    }
                    return true;
                }).at(0);
            }
            if ( suggestion ){
                request.value.title = suggestion.value;
            } else {
                $jet.msg({
                    text: `ВНИМАНИЕ! Указанный ИНН "${ request.value.tin }" не обнаружен, или организация недействующая`,
                    color: 'warning'
                });
            }
        } catch(e) {
            console.log('ERR (inn)', e);
            $jet.msg({
                text: `Не удается проверить организацию по ИНН: ${ e.message }`,
                color: 'warning'
            });
        } finally {
            pending.value = false;
        }
    };  //checkinn
    
    async function save(){
        let ok = await form.value.validate();
        if (!ok){
            return false;
        }
        if ( !/^\+?\d{11}/.test(request.value.phone) ){
            $("input[name=phone]").focus();
            $jet.msg({text:`Неверный формат телефона ${request.value.phone || ''}`, color: "warning"});
            return false;
        }
        
        pending.value = true;
        try {
            const body = {...request.value};
            delete body.files;
            
            body.registration = {id: request.value.id};
            body.user_name = request.value.name;
            body.user_phone= request.value.phone;
            
            let res = await $jet.api({
                url: '/carriers/from/bid',
                method: 'POST',
                body
            });
            if ( res.success ){
                show.value = false;
                $emit("success", body.registration);
                $jet.msg({
                            text: `Учетная запись пользователя ${body.user_name} создана успешно`, 
                            color: "primary",
                            timeout: 10000
                        });
            }
        } catch(e){
            console.log('ERR (save)', e);
            ok = false;
            $jet.msg({
                        text: `Ошибка сохранения изменений.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                        color: "warning",
                        timeout: 20000
                    });
        } finally {
            pending.value = false;
        }
        
        return false;
    }
</script>
<style lang="scss" scoped>
    .ar-rq{
        &__attachments{
            & h4 {
                font-weight: normal;
                margin: 1.5rem 0 1rem 0;
            }
            & .v-btn:not(:last-child){
                margin-right: 0.5rem;
            }
        }
    }
</style>