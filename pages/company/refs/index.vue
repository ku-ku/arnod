<template>
    <teleport v-if="isMounted" to="#ar-title">
        <div class="d-flex align-center">
            <v-menu>
                <template v-slot:activator="{ props }">
                    <v-btn v-bind="props"
                           variant="tonal"
                           color="primary"
                           append-icon="mdi-chevron-down">
                        {{ _REFS.items[_REFS.active.value]?.title }}
                    </v-btn>
                </template>
                <v-list density="compact" nav>
                    <v-list-item v-for="i in _REFS.items"
                                 :key="'usr-nav-' + i.id"
                                 :title="i.title"
                                 :prepend-icon="i.icon"
                                 :value="i.id"
                                 v-on:click="_REFS.set(i.id)">
                    </v-list-item>
                </v-list>
            </v-menu>
            <app-search-input v-on:search="s = $event" 
                              hide-details
                              label="поиск" />
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
                  hover
                  :headers="headers"
                  :items="items"
                  :items-per-page="25"
                  :loading="pending"
                  :search="s"
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
        <ar-refs-dlg ref="dlg" 
                     v-on:success="reload" />
        <ar-map-point ref="dlgPoint" 
                      v-on:success="reload" />
        <ar-route ref="dlgRoute"
                  v-on:success="reload" />
    </teleport>
</template>

<script setup>
    import moment from "moment";
    import { ref, computed, onMounted, watch} from "vue";
    import { phpdate2m, empty } from "app-ext/utils";
    import ArRefsDlg from "~/components/refs/ArRefsDlg";
    import ArMapPoint from "~/components/refs/ArMapPoint";
    import ArRoute from "~/components/ArRoute";
    import AppSearchInput from "app-ext/components/AppSearchInput";
    import { all } from "~/composables/data";

    const isMounted = ref(false);
    
    onMounted(()=>{
        isMounted.value = true;
    });

    const items    = ref([]),
          selected = ref([]),
          headers  = ref([]),
          dlg      = ref(null),
          dlgPoint = ref(null),
          dlgRoute = ref(null),
          s        = ref(null),
          at       = computed(()=>{ return all.at; });

    const _KNOWN_COLUMNS = [
        {key: 'title',                   title: 'Наименование',            align: 'start',  type: 'string'},
        {key: 'weight',                  title: 'Грузоподъемность',        align: 'end',    type: 'integer'},
        {key: 'vehicle_axes',            title: 'Количество осей',         align: 'end',    type: 'integer'},
        {key: 'trailer_axes',            title: 'Количество осей прицепа', align: 'end',    type: 'integer'},
        {key: 'is_init',                 title: 'Первый статус',           align: 'center', type: 'boolean', value: item => (item.is_init) ? 'Да' : 'Нет'},
        {key: 'is_for_order',            title: 'Для заказа',              align: 'center', type: 'boolean', value: item => (item.is_for_order) ? 'Да' : 'Нет'},
        {key: 'is_for_vehicle',          title: 'Для ТС',                  align: 'center', type: 'boolean', value: item => (item.is_for_vehicle) ? 'Да' : 'Нет'},
        {key: 'can_changed_by_driver',   title: 'Меняет водитель',         align: 'center', type: 'boolean', value: item => (item.can_changed_by_driver) ? 'Да' : 'Нет'},
        {key: 'can_changed_by_mechanic', title: 'Меняет механик',          align: 'center', type: 'boolean', value: item => (item.can_changed_by_mechanic) ? 'Да' : 'Нет'},
        {key: 'is_vehicle_active',       title: 'Блокирует ТС',            align: 'center', type: 'boolean', value: item => (item.is_vehicle_active) ? 'Да' : 'Нет'},
        {key: 'comment',                 title: 'Примечание',     align: 'start',type: 'string'},
        {key: 'distance',                title: 'Расстояние,км',  align: 'end',type: 'integer'},
        {key: 'created_at', title: 'Дата создания',  align: 'end', type: 'date', value: item => moment(item.created_at).format('DD.MM.YYYY')},
        {key: 'updated_at', title: 'Дата изменения', align: 'end', type: 'date', value: item => moment(item.updated_at).format('DD.MM.YYYY')}
        //{key: 'deleted_at', title: 'Дата удаления',  align: 'end',   type: 'date'},
    ];

    const _REFS = {
        items: [
            {id: 0, title: "Тип транспорта",          url: '/refs/vehicle_type',           val: 'cost'},
            {id: 1, title: "Тип груза",               url: '/refs/cargo_type',             val: 'cost'},
            {id: 2, title: "Единицы измерения груза", url: '/refs/cargo_unit',             val: 'cost'},
            {id: 3, title: "Тип загрузки транспорта", url: '/refs/vehicle_loading_type',   val: 'cost'},
            {id: 4, title: "Тип выгрузки транспорта", url: '/refs/vehicle_unloading_type', val: 'coefficient'},
            {id: 5, title: "Формы оплаты заказа",     url: '/refs/orders_payments_type',   val: 'value'},
            {id: 6, title: "Наименования груза",      url: '/refs/cargo_names',            val: 'value'},
            {id: 7, title: "Метод погрузки",          url: '/refs/method_of_loading',      val: 'value'},
            {id: 8, title: "Грузоподъемность ТС",     url: '/refs/vehicle_load_capacity',  val: 'value'},
            {id: 9, title: "Статусы ТС",              url: '/refs/vehicle_order_statuses', val: 'value'},
            {id: 10,title: "Пункты погрузки",         url: '/loading_points', onitem: item => {
                    dlgPoint.value.open(item.id, true);
            }},
            {id: 11,title: "Пункты выгрузки",         url: '/unloading_points', onitem: item => {
                    dlgPoint.value.open(item.id, false);
            }},
            {id: 12, title: "Маршруты",               url: '/refs/move_directions', val: 'distance', onitem: item => {
                    dlgRoute.value.open(item);
            }}
        ],
        active: ref(0),
        set: n => {
                _REFS.active.value = n;
                useSeoMeta({
                    title: `${ _REFS.items[n].title } | справочники`
                });
                refreshNuxtData('company-refs');
            }
    };
    _REFS.set(0);

    function onclickrow(e, { item }){
        selected.value = [ item ];
        $('.ar-settings table tr.v-data-table__selected').removeClass('v-data-table__selected');
        $(e.target).closest('tr').addClass('v-data-table__selected');
    };  //onclickrow

    function onitem(item){
        var item = Object.assign( item||{id: -1}, {cols: headers.value, attrs: _REFS.items.at(_REFS.active.value)});
        if (item.attrs.onitem){
            return item.attrs.onitem(item);
        }
        dlg.value.open( item );
    };  //onitem
    
    function del(item){
        $jet.msg({
            text: `Подтвердите удаление записи ${ item.title }`,
            color: 'indigo',
            click: ok => {
                    if ( !ok ){
                        return;
                    }
                    const opts = {
                        url: `${ _REFS.items.at(_REFS.active.value).url }/${ item.id }`,
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
    const { pending, error } = useAsyncData('company-refs', async ()=>{
        items.value = [];
        selected.value = [];
        if ( !_REFS.items.at(_REFS.active.value)?.url ){
            return;
        }
        try {
            let res = await $jet.api({
                url: _REFS.items.at(_REFS.active.value).url,
                params: {
                    page: 1,
                    perPage: -1
                }
            });
            if (res.success){
                const now = $moment();
                items.value = res.result.items;
                let item = res.result.items.at(0),
                  _headers = [];
                if (item){
                    _headers = _KNOWN_COLUMNS.filter( c => Object.keys(item).indexOf(c.key) > 0);
                }
                _headers.push({title: '...', key: 'actions', sortable: false, align: 'center', width: "5rem"});
                headers.value = _headers;
            }
        } catch(e){
            console.log('ERR (refs)', e);
            $jet.msg({
                        text:`Ошибка получения данных.<br /><small>Информация для техподдержки: ${e.message} ${$jet.api.$errm}`,
                        color: 'warning'
                    });
        }
    }, {
        watch: [at]
    });
    
    function reload(){
        refreshNuxtData('company-refs');
    };
</script>