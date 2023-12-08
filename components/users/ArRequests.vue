<template>
    <v-data-table-server density="compact"
                  class="ar-requests"
                  :loading="pending"
                  :headers="hdrs"
                  :items-length="pages.total"
                  :items="rqs"
                  fixed-header
                  hover
                  item-key="id"
                  select-strategy="single"
                  :model-value="selected"
                  v-on:click:row="onclickrow"
                  :items-per-page="25"
                  v-on:update:options="onoptions"
                  height="calc(100vh - 178px)">
        <template v-slot:item.phone="{ item }">
            <a href="#" 
               v-on:click.stop.prevent="open(item)">
                {{ item.phone }}
            </a>
        </template>
        <template v-slot:item.actions="{ item }">
            <v-btn size="x-small" flat icon="mdi-pencil"
                   v-on:click="$refs.dlg.open(item)"></v-btn>
            <v-btn size="x-small" flat icon="mdi-close"
                   v-on:click="del(item)"></v-btn>
        </template>
    </v-data-table-server>
    <teleport to="body">
        <ar-request-dlg ref="dlg" 
                        v-on:success="onregister" />
    </teleport>
</template>
<script setup>
    import { ref, toRef } from "vue";
    import { phpdate2m, empty } from "app-ext/utils";
    import ArRequestDlg from "./ArRequestDlg";
    
    const props = defineProps({search: String});
    
    const hdrs = [
        {title: 'Дата',         key: 'at',      sortable: false},
        {title: 'Телефон',      key: 'phone',   sortable: false},
        {title: 'ИНН',          key: 'tin',     sortable: false},
        {title: 'Примечание',   key: 'comment', sortable: false},
        {title: '...',          key: 'actions', sortable: false, align: "center"}
    ];
    const pages = ref({
                            page: 1,
                            perPage: 25,
                            total: 0,
                            sort: []
                    });
    
    const rqs = ref([]),
          dlg = ref(null),
          selected = ref([]);
    
    const { pending, error } = useAsyncData('users-requests', async ()=>{
        try {
            const opts = {
                url: '/rbac/user_registrations',
                method: 'GET',
                params: {
                    page: pages.value.page,
                    perPage: pages.value.perPage
                }
            };
            const res = await $jet.api(opts);
            if (res.success){
                res.result.items.forEach( rq => {
                    rq.at = phpdate2m(rq.created_at).format('DD.MM.YYYY HH:mm');
                });
                rqs.value = res.result.items;
                pages.value.total = res.result.total;
            } else {
                throw {message: res.error};
            }
        } catch(e){
            console.log('ERR (carriers)', e);
            $jet.msg({
                        text:`Ошибка получения данных о заявках на регистрацию.<br /><small>Информация для техподдержки: ${e.message} ${$jet.api.$errm}`,
                        type: 'warning'
                    });
        }
    });
    
    function onoptions(opts){
        pages.value.page = opts.page;
        pages.value.perPage = opts.itemsPerPage;
        pages.value.sort = opts.sortBy;
        if ( 0 === pages.value.total ){
            return;
        }
        refreshNuxtData('users-requests');
    };  //onoptions
    
    function onclickrow(e, { item }){
        selected.value = [ item ];
        $('.ar-requests table tr.v-data-table__selected').removeClass('v-data-table__selected');
        $(e.target).closest('tr').addClass('v-data-table__selected');
    };
    
    
    function open(rq){
        selected.value = [ rq ];
        if (typeof dlg.value?.open !== "undefined"){
            dlg.value?.open(rq);
        }
    };
    
    function onregister(rq){
        console.log('rq', rq);
        let n = rqs.value.findIndex( _rq => _rq.id === rq.id );
        if ( n > -1 ){
            rqs.value.splice(n, 1);
        }
    };
    
    function del(item){
        $jet.msg({
            text: `Подтвердите отклонение заявки ${ item.phone }`,
            color: 'indigo',
            click: ok => {
                    if ( !ok ){
                        return;
                    }
                    const opts = {
                        url: `/rbac/user_registrations/${ item.id }`,
                        method: 'PUT',
                        body: {
                            status: "CLOSED"
                        }
                    };
                    $jet.api(opts).then(res =>{
                        if (res.success){
                            let n = rqs.value.findIndex( r => r.id === item.id );
                            if ( n > -1 ){
                                rqs.value.splice(n, 1);
                            }
                        }
                    }).catch(e => {
                        console.log('ERR (del)', e);
                        $jet.msg({
                            text: `Ошибка отмены заявки на регистрацию<br />${ $jet.api.$errm || e.message }`, 
                            color: 'warning'
                        });
                    });
            },
            click_title: 'подтвердить',
            timeout: 60000
        });
    }   //del
    
</script>