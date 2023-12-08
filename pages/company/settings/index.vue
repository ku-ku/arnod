<template>
    <teleport v-if="isMounted" to="#ar-title">
        <div class="d-flex align-center">
            <v-menu>
                <template v-slot:activator="{ props }">
                    <v-btn v-bind="props"
                           variant="tonal"
                           color="primary"
                           :prepend-icon="_NAVS.items[_NAVS.active.value]?.icon"
                           append-icon="mdi-chevron-down">
                        {{ _NAVS.items[_NAVS.active.value]?.title }}
                    </v-btn>
                </template>
                <v-list density="compact" nav>
                    <v-list-item v-for="i in _NAVS.items"
                                 :key="'usr-nav-' + i.id"
                                 :title="i.title"
                                 :prepend-icon="i.icon"
                                 :value="i.id"
                                 v-on:click="_NAVS.set(i.id)">
                    </v-list-item>
                </v-list>
            </v-menu>
        </div>
    </teleport>
    <teleport to="#ar-tb__prepend">
        <v-btn prepend-icon="mdi-plus"
               variant="tonal"
               color="primary"
               class="ml-auto mr-3"
               v-on:click="onitem(null)">новый</v-btn>
    </teleport>
    <v-data-table density="compact"
                  ref="table"
                  class="ar-settings"
                  fixed-header
                  disable-sort
                  no-filter
                  hover
                  :headers="headers"
                  :items="items"
                  :items-per-page="25"
                  :loading="pending"
                  single-select
                  no-data-text="..."
                  height="calc(100vh - 178px)"
                  v-on:click:row="onclickrow"
                  return-object>
        <template v-slot:item.current="{ item }">
            <v-icon v-if="item.current" 
                    class="ar-settings__current"
                    color="primary">mdi-checkbox-marked</v-icon>
        </template>    
        <template v-slot:item.actions="{ item }">
            <v-btn size="x-small" 
                   flat 
                   icon="mdi-pencil"
                   v-on:click="onitem(item)"></v-btn>
            <v-btn size="x-small" 
                   flat 
                   icon="mdi-close"
                   v-on:click="del(item)"></v-btn>
        </template>
    </v-data-table>
    <teleport to="body">
        <ar-settings-dlg ref="dlg" 
                         v-on:success="reload" />
    </teleport>
</template>
<script setup>
    import { ref, computed, onMounted, watch} from "vue";
    import { phpdate2m } from "app-ext/utils";
    import ArSettingsDlg from "~/components/settings/ArSettingsDlg";
    
    const _NAVS = {
        items: [
            {id: 0, title: "Оплата за тонно-км",     icon: "mdi-truck-delivery-outline", url: '/settings/cost_tonne_per_km', val: 'cost'},
            {id: 1, title: "Оплата за простой",      icon: "mdi-truck-flatbed",          url: '/settings/cost_immobility',   val: 'cost'},
            {id: 2, title: "Ежедневная оплата",      icon: "mdi-calendar-outline",       url: '/settings/daily_payment',     val: 'cost'},
            {id: 3, title: "Оплата за загрузку",     icon: "mdi-weight-lifter",          url: '/settings/on_load_payment',   val: 'cost'},
            {id: 4, title: "Коэффициент начислений", icon: "mdi-circle-multiple-outline",url: '/settings/coefficient_income',val: 'coefficient'},
            {id: 5, title: "Средний расход ГСМ",     icon: "mdi-truck-fast-outline",     url: '/settings/fuel_consumption',  val: 'value'},
            {id: 6, title: "Средняя стоимость ГСМ",  icon: "mdi-gas-station-outline",    url: '/settings/fuel_cost',         val: 'value'}
        ],
        active: ref(0),
        set: n => {
                _NAVS.active.value = n;
                refreshNuxtData('company-settings');
            }
    };
    _NAVS.set(0);
    
    const isMounted = ref(false);
    
    onMounted(()=>{
        isMounted.value = true;
    });
    
    const headers = computed(()=>{
        const _hdrs = [
            {title: ' ', key: 'current', sortable: false, align: 'center', width: "1.25rem"},
            {title: 'Сумма', key: 'cost', sortable: false, align: 'end'},
            {title: 'Дата начала', key: 'start', sortable: false},
            {title: 'Дата окончания', key: 'end', sortable: false},
            {title: '...', key: 'actions', sortable: false, align: 'center', width: "5rem"}
        ];
        if ( 4 === _NAVS.active.value ){
            _hdrs[1] = {title: 'Коэффициент', key: 'coefficient', sortable: false, align: 'end'};
        } else if ( ( 5 === _NAVS.active.value ) || ( 6 === _NAVS.active.value ) ){
            _hdrs[1].key = 'value';
        }
        return _hdrs;
    });
    
    const items = ref([]),
          selected = ref([]),
          dlg   = ref(null);

    function onclickrow(e, { item }){
        selected.value = [ item ];
        $('.ar-settings table tr.v-data-table__selected').removeClass('v-data-table__selected');
        $(e.target).closest('tr').addClass('v-data-table__selected');
    };  //onclickrow
    
    function onitem(item){
        var item = Object.assign( item||{id: -1}, {attrs: _NAVS.items.at(_NAVS.active.value)});
        dlg.value.open( item );
    };  //onitem
    
    function del(item){
        $jet.msg({
            text: `Подтвердите удаление записи от ${ item.start }`,
            color: 'indigo',
            click: ok => {
                    if ( !ok ){
                        return;
                    }
                    const opts = {
                        url: `${ _NAVS.items.at(_NAVS.active.value).url }/${ item.id }`,
                        method: 'DELETE'
                    };
                    $jet.api(opts).then(res =>{
                        if (res.success){
                            let n = items.value.findIndex( i => (i.id === item.id) );
                            if ( n > -1 ){
                                items.value.splice(n, 1);
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
    };   //del
    
    const { pending, error } = useAsyncData('company-settings', async ()=>{
        items.value = [];
        selected.value = [];
        if ( !_NAVS.items.at(_NAVS.active.value)?.url ){
            return;
        }
        try {
            let res = await $jet.api({
                url: _NAVS.items.at(_NAVS.active.value).url,
                params: {
                    page: 1,
                    perPage: -1
                }
            });
            if (res.success){
                const now = $moment();
                res.result.items.forEach( item => {
                    item.start = phpdate2m(item.start_date);
                    item.end   = item.end_date ? phpdate2m(item.end_date) : null;
                    item.current = now.isAfter(item.start) && ( !item.end || now.isSameOrBefore(item.end) );
                    item.start = item.start.format("DD.MM.YYYY");
                    item.end   = item.end?.format("DD.MM.YYYY");
                } );
                items.value = res.result.items;
                let n = items.value.findIndex( i => i.current );
                if ( n < 0 ){
                    $jet.msg({text: 'ВНИМАНИЕ! Выбранный норматив не имеет текущего значения, необходимо добавить новое значение или изменить даты.', color: 'warning'});
                }
            }
        } catch(e){
            console.log('ERR (carriers)', e);
            $jet.msg({
                        text:`Ошибка получения данных.<br /><small>Информация для техподдержки: ${e.message} ${$jet.api.$errm}`,
                        type: 'warning'
                    });
        }
    });
    
    
    function reload(){
        refreshNuxtData('company-settings');
    }
</script>
<style lang="scss">
    .ar-settings{
        & table{
            & tr:has(.ar-settings__current){
                font-weight: bold;
            }
        }
    }
</style>