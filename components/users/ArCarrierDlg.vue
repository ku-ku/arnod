<template>
    <v-dialog max-width="800"
              min-height="640"
              scrollable
              v-model="show"
              content-class="ar-carrier">
        <v-toolbar color="primary"
                   density="compact">
            <v-toolbar-title>
                <v-icon size="small">mdi-account-cowboy-hat-outline</v-icon>&nbsp;
                {{ carrier?.id > 0 ? `Перевозчик #${carrier.id}` : 'Новый перевозчик'}}
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
                                              v-model="carrier.tin"
                                              type="text"
                                              name="tin"
                                              required>
                            </jet-input-string>
                        </v-col>
                        <v-col cols="12" sm="8">
                            <jet-input-string label="Наименование"
                                              v-model="carrier.title"
                                              type="text"
                                              name="org"
                                              required>
                            </jet-input-string>
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col cols="12" sm="4">
                            <v-checkbox class="mt-5"
                                        label="перевозчик"
                                        hide-details
                                        density="compact"
                                        v-model="carrier.isTransportation"></v-checkbox>
                        </v-col>
                        <v-col cols="12" sm="8">
                            <v-autocomplete v-model="carrier.vehicle_types"
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
                            <v-data-table density="compact"
                                          class="ar-carrier__users no-footer"
                                          :loading="pending"
                                          :headers="hdrs"
                                          :items="users"
                                          fixed-header
                                          hover
                                          item-key="id"
                                          :items-per-page="-1"
                                          select-strategy="single"
                                          disable-pagination
                                          hide-default-footer>
                                <template v-slot:top>
                                    <div class="d-flex justify-end mb-2">
                                        <v-btn size="small"
                                               variant="tonal"
                                               color="primary"
                                               :disabled="!(carrier.id > 0)"
                                               v-on:click="onuser(null)">
                                               новый пользователь...
                                        </v-btn>
                                    </div>
                                </template>
                                <template v-slot:item.actions="{ item }">
                                    <v-btn size="x-small" 
                                           flat 
                                           icon="mdi-pencil"
                                           v-on:click="onuser(item)"></v-btn>
                                    <v-btn size="x-small" 
                                           flat 
                                           icon="mdi-close"
                                           v-on:click="deluser(item)"></v-btn>
                                </template>
                            </v-data-table>
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
        <ar-user-dlg ref="userDlg" 
                     v-on:success="onusermodify" />
    </v-dialog>
</template>    
<script setup>
    import { ref, unref } from "vue";
    import JetInputString from "app-ext/components/editors/JetInputString";
    import { refs as getrefs } from "~/services/other";
    import { empty } from "app-ext/utils";
    import ArUserDlg from "./ArUserDlg";
    
    
    const hdrs = [
        {title: 'Имя',          key: 'full_name',       sortable: false},
        {title: 'e-mail',       key: 'email', sortable: false},
        {title: 'Тел.',         key: 'phone', sortable: false},
        {title: '...',          key: 'actions', sortable: false, align: "center"}
    ];
    
    const show   = ref(false),
          pending= ref(false),
          carrier= ref(null),
          form   = ref(null),
          vehicle_types = ref([]),
          users  = ref([]),
          userDlg= ref(null);
  
    try {
        vehicle_types.value = await getrefs("vehitypes");
    } catch(e) {
        console.log('ERR (vehicle_types)', e);
    }

    const { error } = useAsyncData('users-carrier', async ()=>{
        if (
                ( !show.value )
             || ( !carrier.value?.id)
           )
        {
            return false;
        }
        pending.value = true;
        users.value = [];
        try {
            let res = await $jet.api({
                url: `/carriers/${ carrier.value.id }`,
                method: 'GET',
                params: {
                    include: 'vehicle_types'
                }
            });
            if (res.success){
                carrier.value = res.result;
                res = await $jet.api({
                    url: `/rbac/users/own`,
                    params: {
                        page: 1,
                        perPage: -1,
                        filters: `organization_id:${ carrier.value.id }`
                    }
                });
                if (res.success){
                    users.value = res.result.items;
                }
            } else {
                throw {message: res.error};
            }
        } catch(e){
            console.log('ERR (carrier)', e);
            $jet.msg({
                        text: `Ошибка получения данных перевозчика.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                        color: 'warning'
            });
        } finally {
            pending.value = false;
        }
    });
    
    
    defineExpose({
        open: crr => {
            carrier.value = {id: crr?.id || 0};
            show.value = true;
            refreshNuxtData('users-carrier');
        }
    });
    
    const $emit = defineEmits(["success"]);
    
    function onuser(user){
        var user = user || {id: -1, organization: {id: carrier.value.id, title:carrier.value.title}};
        if (typeof userDlg.value?.open !== "undefined"){
            userDlg.value.open(user);
        } else {
            console.log('no dialog ref', userDlg);
        }
    };   //onuser
    
    function onusermodify(id){
        try {
            const user = unref(useState("users-user"));
            console.log('onusermodify', user);
            let n = users.value.findIndex( u => (u.id === user.id) );
            if ( n > -1 ){
                users.value.splice(n, 1, user);
            } else {
                users.value.push(user);
            }
        } catch(e){
            console.log('ERR onuser', e);
        }
    };
    
    function deluser(user){
        $jet.msg({
            text: `Подтвердите удаление записи  "${ user.full_name }"`,
            color: 'indigo',
            click: ok => {
                    if ( !ok ){
                        return;
                    }
                    const opts = {
                        url: `/rbac/users/${ user.id }`,
                        method: 'DELETE'
                    };
                    $jet.api(opts).then(res =>{
                        if (res.success){
                            let n = users.value.findIndex( u => (u.id ===user.id) );
                            if ( n > -1 ){
                                users.value.splice(n, 1);
                            }
                        }
                    }).catch(e => {
                        console.log('ERR (del)', e);
                        $jet.msg({
                            text: `Ошибка удаления<br />${ $jet.api.$errm || e.message }`, 
                            color: 'warning'
                        });
                    });
            },
            click_title: 'подтвердить',
            timeout: 60000
        });
    }   //deluser
    
    async function save(){
        let ok = await form.value.validate();
        if (!ok){
            return false;
        }
        
        pending.value = true;
        try {
            const body = unref(carrier);
            let res = await $jet.api({
                url: `/carriers/${ body.id }`,
                method: 'PUT',
                body
            });
            console.log('save', res);
            if ( res.success ){
                show.value = false;
                $emit("success", body.id);
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
    }   //save
    
    
</script>