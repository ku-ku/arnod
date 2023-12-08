<template>
    <teleport to="#ar-tb__prepend">
        <v-btn prepend-icon="mdi-plus"
               variant="tonal"
               color="primary"
               class="ml-auto mr-3"
               v-on:click="onuser(null)">новый</v-btn>
    </teleport>
    <v-data-table-server density="compact"
                  class="ar-users"
                  :loading="pending"
                  :headers="hdrs"
                  :items-length="pages.total"
                  :items="users"
                  fixed-header
                  hover
                  item-key="id"
                  select-strategy="single"
                  :model-value="selected"
                  v-on:click:row="onclickrow"
                  :items-per-page="25"
                  v-on:update:options="onoptions"
                  height="calc(100vh - 178px)">
        <template v-slot:item.full_name="{ item }">
            <a href="#" v-on:click.stop.prevent="onuser(item)">{{ item.full_name }}</a>
        </template>    
        <template v-slot:item.actions="{ item }">
            <v-btn size="x-small" flat icon="mdi-pencil"
                   v-on:click="onuser(item)"></v-btn>
            <v-btn size="x-small" flat icon="mdi-close"
                   v-on:click="del(item)"></v-btn>
        </template>
    </v-data-table-server>
    <teleport to="body">
        <ar-user-dlg ref="dlg" 
                     v-on:success="onusermodify" />
    </teleport>
</template>
<script setup>
    import { ref, toRef } from "vue";
    import { empty } from "app-ext/utils";
    import ArUserDlg from "./ArUserDlg";
    
    const props = defineProps({search: String});
    
    const hdrs = [
        {title: 'Имя',          key: 'full_name',       sortable: false},
        {title: 'Организация',  key: 'organization.title', sortable: false},
        {title: 'e-mail',       key: 'email', sortable: false},
        {title: 'Тел.',         key: 'phone', sortable: false},
        {title: '...',          key: 'actions', sortable: false, align: "center"}
    ];
    const pages = ref({
                            page: 1,
                            perPage: 25,
                            total: 0,
                            sort: []
                    }),
          s = toRef(props, 'search');
    
    const users = ref([]),
          selected = ref([]),
          dlg = ref(null);
    
    const { pending, error } = useAsyncData('users-users', async ()=>{
        try {
            const opts = {
                url: '/rbac/users',
                method: 'GET',
                params: {
                    page: pages.value.page,
                    perPage: pages.value.perPage,
                    include: 'organization'
                }
            };
            if ( !empty(s.value) ){
                opts.params.filters = `full_name:${s.value}`;
            }
            
            const res = await $jet.api(opts);
            if (res.success){
                users.value = res.result.items;
                pages.value.total = res.result.total;
            } else {
                throw {message: res.error};
            }
        } catch(e){
            console.log('ERR (carriers)', e);
            $jet.msg({
                        text:`Ошибка получения данных о пользователях.<br /><small>Информация для техподдержки: ${e.message} ${$jet.api.$errm}`,
                        type: 'warning'
                    });
        }
    }, { 
        watch: [s]
    });
    
    function onoptions(opts){
        pages.value.page = opts.page;
        pages.value.perPage = opts.itemsPerPage;
        pages.value.sort = opts.sortBy;
        if ( 0 === pages.value.total ){
            return;
        }
        refreshNuxtData('users-users');
    };  //onoptions
    
    function onclickrow(e, { item }){
        selected.value = [ item ];
        $('.ar-users table tr.v-data-table__selected').removeClass('v-data-table__selected');
        $(e.target).closest('tr').addClass('v-data-table__selected');
    };
    
    function onuser(item){
        dlg.value.open(item);
        return false;
    }   //onuser
    
    function onusermodify(id){
        try {
            const user = unref(useState("users-user"));
            let n = users.value.findIndex( u => u.id === user.id );
            if ( n > -1 ){
                users.value.splice(n, 1, user);
            } else {
                users.value.push(user);
            }
        } catch(e){
            console.log('ERR onuser', e);
        }
    };  //onusermodify
        
    function del(user){
        $jet.msg({
            text: `Подтвердите удаление записи пользователя "${ user.full_name }"`,
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
    }   //del
</script>