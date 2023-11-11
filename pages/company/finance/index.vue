<template>
    <teleport to="#ar-title">
        <ar-searcher v-on:select="by=$event" />
    </teleport>
    <teleport to="#ar-tb__prepend"> 
        {{ title }}
        <v-btn prepend-icon="mdi-plus"
               color="primary"
               class="mx-3"
               variant="tonal"
               v-on:click="expence(null)">добавить</v-btn>
    </teleport>
    <v-data-table density="compact"
                  ref="table"
                  class="ar-expences"
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
        <template v-slot:item.name="{ item }">
            <span class="ar-expences__total" v-if="/^(итог)+/i.test(item.name)">
                {{ item.name }}
            </span>
            <template v-else>
                <a href="#" v-on:click.stop.prevent="('group'==by.type) ? void(0) : expence(item)"
                   :data-item-id="item.id"
                   class="ar-expence__link">
                    {{ item.name }}
                </a>
            </template>
        </template>
        <template v-slot:item.date="{ item }">
            {{ item.date.format('DD.MM.YYYY') }}
        </template>
        <template v-slot:item.expenses_type="{ item }">
            <template v-if="('DRIVER_TYPE'==item.expenses_type.expenses_type)">
                {{ item.drivers?.map( d => d.user.full_name).join(', ') }}
            </template>
            <template v-if="('VEHICLE_TYPE'==item.expenses_type.expenses_type)">
                {{ (!!item.vehicles) ? item.vehicles.map( d => d.reg_number).join(', ') : '' }}
            </template>
        </template>
        <template v-slot:item.cost="{ item }">
            {{ currformat(item.cost) }}
        </template>    
        <template v-slot:item.cost_vat="{ item }">
            {{ currformat(item.cost_vat) }}
        </template>    
        <template v-slot:item.cost_original="{ item }">
            {{ currformat(item.cost_original) }}
        </template>    
        <template v-slot:item.actions="{ item }">
            <v-btn size="x-small" 
                   class="mr-2"
                   flat 
                   icon="mdi-pencil"
                   v-on:click="expence(item)"></v-btn>
            <v-btn size="x-small" 
                   flat 
                   icon="mdi-close"
                   v-on:click="delexp(item)"></v-btn>
        </template>    
    </v-data-table>
    <teleport to="body">
        <ar-expence-dlg ref="expdlg" 
                        v-on:success="onexp" />
    </teleport>
</template>
<script setup>
    import { ref, unref, computed, nextTick } from "vue";
    import { profile } from "app-ext/composables/profile";
    import { currformat } from "app-ext/utils";
    import { all } from "~/composables/data";
    import { getexpences } from "~/services/company";
    import ArExpenceDlg from "~/components/ArExpenceDlg";
    
    
    const _HDRS = [
        {title: 'Статья расхода', key: 'name'},
        {title: 'Описание',       key: 'description'},
        {title: 'Дата',           key: 'date'},
        {title: 'Юр.лицо',        key: 'legal_entity.title'},
        {title: 'Объект расхода', key: 'expenses_type'},
        {title: 'Сумма без НДС',  key: 'cost', align: 'end'},
        {title: 'Сумма НДС',      key: 'cost_vat', align: 'end'},
        {title: 'Сумма',          key: 'cost_original', align: 'end'},
        {title: '',               key: 'actions', align: 'end'}
    ];
    
    const headers = ref(_HDRS),
          expdlg  = ref(null);
    
    const by = ref({type: 'all'}),
          items = ref([]),
          selected = ref([]);
    
    const title = computed(()=>{
        switch (by.value.type){
            case 'driver':
                return by.value.item.user.full_name;
            case 'vehicle':
                return by.value.item.reg_number;
        }
        return '';
    });

    const {data, pending, error} = useAsyncData('co-finance', async ()=>{
        let res;
        
        //table-headers 
        if ('group' === by.value.type){
            let _hdrs = [..._HDRS];
            _hdrs.splice(1, 4);
            _hdrs.splice(4, 1); //actions
            headers.value = _hdrs;
        } else {
            headers.value = _HDRS;
        }
        
        const _totals = items => {
            let n, total = {
                     name: 'ИТОГО',
                     expenses_type: {title: 'ИТОГО'},
                     date: $moment(all.period.end),
                     cost: 0,
                     cost_vat: 0,
                     cost_original: 0
                 };
            while ( (n = items.findIndex( i => 'ИТОГО'==i.name )) > -1 ){
                items.splice(n, 1);
            }
            items.forEach( r => {
                total.cost += r.cost;
                total.cost_vat += r.cost_vat;
                total.cost_original += r.cost_original;
            });
            //items = items.sort( (i1, i2) => i1.name.localeCompare(i2.name) );
            items.splice(0, 0, total);
            items.push(total);
        };
        
        if ('group' === by.value.type){
            res = $jet.payload.data["co-finance"];
            if (res){
                res = {
                    by: unref(by),
                    items: getexpences.grouping(res.items)
                };
                _totals(res.items);
                items.value = res.items;
            } else {
                items.value = [];
            }
            return res;
        }
        
        res = await getexpences( 
                                    all.period.start, 
                                    all.period.end, 
                                    ('group' === by.value.type) ? null : unref(by)
                               );
        _totals(res);
        
        items.value = res;
        
        return {
            by: unref(by),
            items: res
        };
    }, {
        watch: [ by, all ]
    });
    
    const expence = item => {
        expdlg.value.open(item);
    };
    
    const onexp = async id =>{
        let item = await getexpences( all.period.start, 
                                      all.period.end, 
                                      {id}
                                    );
        item = item.at(0);
        
        let n = items.value.findIndex( i => i.id === item.id );
        if ( n < 0 ){
            items.value.splice(0, 0, item);
        } else {
            items.value.splice(n, 1, item);
        }
        
        nextTick(()=>{
            $(`.ar-expence__link[data-item-id=${items.id}]`).parent().trigger('click');
        });
        
    };
    
    const delexp = item => {
        $jet.msg({
            text: `<b>Подтвердите удаление записи</b><br />"${ item.name }" на сумму ${ item.cost }&nbsp;руб.`,
            color: 'indigo',
            click: ok => {
                if ( !ok ){
                    return;
                }
                $jet.api({url: `/expenses/${item.id}`, method: "DELETE"})
                        .then(res =>{
                            if (res.success){
                                let n = items.value.findIndex( _item => _item.id === item.id );
                                if ( n > -1 ){
                                    items.value.splice(n, 1);
                                }
                            } else {
                                throw {message: res.error};
                            }
                        })
                        .catch( e=> {
                            $jet.msg({text: `Ошибка удаления записи:<br />${ e.message }<br />${ $jet.api.$errm }`});
                        });
            }
        });
    };  //delexp
    
    const onclickrow = (e, {item})=> {
        selected.value = [item];
        $('.ar-expences table tr.v-data-table__selected').removeClass('v-data-table__selected');
        $(e.target).closest('tr').addClass('v-data-table__selected');
    };


</script>
<style lang="scss">
    .ar-expences{
        & table {
            & tr {
                & td {
                    &:nth-child(6),
                    &:nth-child(7), 
                    &:nth-child(8){
                        text-align: right;
                    }
                }
                &:has(td .ar-expences__total){
                    background-color: #eee;
                    font-weight: 600;
                }
            }
        }
    }
    .ar-expence{
        &__link{
            color: unset;
        }
    }
</style>