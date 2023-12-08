<template>
    <v-dialog max-width="720"
              min-height="640"
              scrollable
              v-model="show"
              content-class="ar-user">
        <v-toolbar color="primary"
                   density="compact">
            <v-toolbar-title>
                <v-icon size="small">mdi-account-outline</v-icon>&nbsp;
                {{ (user?.id > 0) ? `Пользователь #${ user.id }` : 'Новый пользователь' }}
            </v-toolbar-title>
            <v-spacer />
            <v-btn icon="mdi-close"
                   flat
                   v-on:click="show = false"></v-btn>
        </v-toolbar>
        <v-form ref="form"
                v-on:submit.stop.prevent="save">
            <v-card rounded="0"
                    :loading="pending">
                <v-card-text class="pb-5">
                    <v-row dense>
                        <v-col cols="12">
                            <v-autocomplete v-model="user.organization"
                                            :items="carriers"
                                            item-title="title"
                                            item-value="id"
                                            label="Организация"
                                            return-object>
                            </v-autocomplete>
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col cols="12" sm="6">
                            <jet-input-string label="Имя"
                                              v-model="user.full_name"
                                              type="text"
                                              name="full_name"
                                              required>
                            </jet-input-string>
                        </v-col>
                        <v-col cols="12" sm="3">
                            <jet-input-string label="e-mail"
                                              v-model="user.email"
                                              type="text"
                                              name="email">
                            </jet-input-string>
                        </v-col>
                        <v-col cols="12" sm="3">
                            <jet-input-string label="Телефон"
                                              v-model="user.phone"
                                              type="text"
                                              name="phone"
                                              required>
                            </jet-input-string>
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col cols="12">
                            <v-autocomplete v-model="user.roles"
                                            :items="roles"
                                            chips
                                            closable-chips
                                            item-title="title"
                                            item-value="id"
                                            label="Роли пользователя"
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
          user   = ref(null),
          form   = ref(null);
  
    const roles   = ref([]),
          carriers= ref([]);

    useState("users-user", ()=>user);
    
    const open = u => {
        user.value = {...u};
        show.value = true;
        refreshNuxtData('users-user');
    };
    
    defineExpose({ open });
    
    try {
        roles.value = await getrefs("roles");
    } catch(e) {
        console.log('ERR (roles)', e);
    }

    try {
        carriers.value = await getrefs("carriers");
    } catch(e) {
        console.log('ERR (carriers)', e);
    }
  
  
    const { error } = useAsyncData('users-user', async ()=>{
        if (
                ( !show.value )
            || !( user.value?.id > 0)
           )
        {
            return false;
        }
        pending.value = true;
        try {
            const opts = {
                url: `/rbac/users/${ user.value.id }`,
                method: 'GET',
                params: {
                    include: 'roles'
                }
            };
            let res = await $jet.api(opts);
            console.log('user', res);
            if (res.success){
                user.value = res.result;
            }
        } catch(e){
            console.log('ERR (user)', e);
            $jet.msg({
                        text: `Ошибка получения данных пользователя.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                        color: 'warning'
            });
        } finally {
            pending.value = false;
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
            const body = unref(user);
            
            let res = await $jet.api({
                url: (body.id > 0) ? `/rbac/users/${ body.id }` : '/rbac/users/',
                method: (body.id > 0) ? 'PUT' : 'POST',
                body
            });
            console.log('save', res);
            if ( res.success ){
                user.value.id = res.result.id;
                refreshNuxtData("users-user");
                show.value = false;
                $emit("success", res.result.id);
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
