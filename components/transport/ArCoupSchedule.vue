<template>
    <v-progress-linear v-if="pending" 
                       indeterminate 
                       absolute />
    <v-table class="ar-schedule">
        <template v-slot:top>
            <div class="d-flex justify-end">
                <v-menu content-class="bg-white elevation-3">
                    <template v-slot:activator="{ props }">
                        <v-btn v-bind="props"
                               rounded="0"
                               variant="text">{{ period }}</v-btn>
                    </template>
                    <v-date-picker-months v-model="month"
                                          v-on:update:modelValue="set('month', $event)" />
                </v-menu>
                <v-menu content-class="bg-white elevation-3">
                    <template v-slot:activator="{ props }">
                        <v-btn v-bind="props"
                               rounded="0"
                               variant="text">
                            <v-icon>mdi-chevron-down</v-icon>
                        </v-btn>
                    </template>
                    <v-date-picker-years v-model="year"
                                         v-on:update:modelValue="set('year', $event)" />
                </v-menu>
                <v-btn rounded="0"
                       variant="text"
                       v-on:click="set('prev')">
                    <v-icon>mdi-chevron-left</v-icon>
                </v-btn>
                <v-btn rounded="0"
                       variant="text"
                       v-on:click="set('next')">
                    <v-icon>mdi-chevron-right</v-icon>
                </v-btn>
            </div>
        </template>
        <tbody>
            <tr v-for="(w, n) in weeks"
                :key="'week-' + n">
                <td v-for="(d, m) in weeks[n]"
                    :key="`day-${ n }-${ m }`"
                    v-bind:class="{ontrip: (d.orders?.id > 0)}">
                    <template v-if="d.s">
                        <div class="day">
                            {{ d.s }}
                        </div>
                        <div class="trailer">
                            <a href="#" v-on:click.stop.prevent="ontrailer(d)">
                                {{ (d.trailers?.id > 0) ? d.trailers.reg_number : '+&nbsp;прицеп'}}
                            </a>
                            <v-tooltip text="удалить" v-if="(d.trailers?.id > 0)">
                                <template v-slot:activator="{ props }">
                                    <v-btn size="x-small" 
                                           icon="mdi-close" 
                                           v-bind="props" 
                                           flat
                                           v-on:click="deltrailer(d)"></v-btn>
                                </template>
                            </v-tooltip>    
                        </div>
                        <div class="driver">
                            <a href="#" v-on:click.stop.prevent="ondriver(d)">
                                {{ (d.drivers?.id > 0) ? d.drivers.user?.full_name : '+&nbsp;водитель'}}
                                &nbsp;<v-icon v-if="(d.drivers?.id > 0)" 
                                              size="x-small">mdi-pencil</v-icon>
                            </a>
                        </div>
                        <div class="status">
                            <a href="#" v-on:click.stop.prevent="onstatus(d)">
                                {{ (d.status?.id > 0) ? d.status.title : '+&nbsp;статус' }}
                            </a>    
                            <v-tooltip text="удалить" v-if="d.status?.id > 0">
                                <template v-slot:activator="{ props }">
                                    <v-btn size="x-small" 
                                           icon="mdi-close" 
                                           v-bind="props" 
                                           flat
                                           v-on:click="delstatus(d)"></v-btn>
                                </template>
                            </v-tooltip>    
                        </div>
                    </template>    
                </td>
            </tr>
        </tbody> 
    </v-table>
    <ar-coup-trailer ref="trailerDlg" 
                     v-on:success="ontrailer($event, true)" />
    <ar-coup-driver ref="driverDlg"
                    v-on:success="ondriver($event, true)" />
    <ar-coup-status ref="statusDlg"
                    v-on:success="onstatus($event, true)" />
</template>
<script setup>
    import { ref, computed } from "vue";
    import { phpdate2m } from "app-ext/utils";
    import ArCoupTrailer from "./ArCoupTrailer";
    import ArCoupDriver from "./ArCoupDriver";
    import ArCoupStatus from "./ArCoupStatus";
    
    const _MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    
    const props = defineProps(
        {coupling: Object}
    );
    
    const coupling  = toRef(props, 'coupling'),
          schedule  = ref(null),
          pending   = ref(false),
          trailerDlg= ref(null),
          driverDlg = ref(null),
          statusDlg = ref(null);
    
    let $m = $moment().startOf('month');
    let month = ref( $m.month() ),
        year  = ref( $m.year() ),
        weeks = ref([]),
        period= computed(()=>{
            return `${ _MONTHS[month.value] }, ${ year.value }`;
        });
    
    defineExpose({
        refresh: ()=>{
            refreshNuxtData('scheldule');
        }
    });
    
    
    useAsyncData('scheldule', async ()=>{
        pending.value = true;
        
        month.value = $m.month();
        year.value  = $m.year();
        weeks.value = [];
        schedule.value = null;
        let m = $moment([year.value, month.value, 1]);
        
        console.log('scheldule at',  m.year()*100 + m.month(), coupling);
        
        for (let w = 0; w < 5; w++ ){
            let days = [];
            for (let d = 1; d < 8; d++){
                let s = false, 
                  day = null;
                if (
                        ( ( 0 === w ) && ( m.day() > d ) )
                      ||( month.value !== m.month() )
                    ){
                } else {
                    day = $moment(m);
                    s = m.format('DD');
                    m = m.add(1, 'days');
                }
                days.push({s, day});
            }
            weeks.value.push(days);
        }
        
        try {
            let end_month = $moment($m).add(1, 'month').add(-1, 'second');
            let res = await $jet.api({
                url: `/vehicles/${coupling.value.id}/schedule`,
                params: {
                    include: "*",
                    start_date: $m.startOf('month').format('YYYY-MM-DD 00:00:00'),
                    end_date:   end_month.format('YYYY-MM-DD 23:59:59')
                }
            });
            if ( res.success ){
                res = res.result;
                
                //normalize dates for using
                ['trailers', 'drivers', 'orders', 'status'].forEach( k => {
                    if ( !res[k] ){
                        console.log('no key: ' + k);
                        return;
                    }
                    
                    res[k].forEach( r => {
                        let tmp = (r.pivot) ? r.pivot : r;
                        if ( !tmp || !tmp.start_date ){
                            return;
                        }
                        r.start = phpdate2m(tmp.start_date).startOf('day');
                        r.end   = null;
                        if (tmp.end_date){
                            if (tmp.end_date===tmp.start_date){
                                return;
                            }
                            r.end = phpdate2m(tmp.end_date);
                        } else if ('status'===k) {
                            r.end = $moment(r.start).add(1, 'day').add(-1, 'second');
                        }
                        
                        weeks.value.forEach(w =>{
                            w.forEach( d => {
                                if ( !d.day ){
                                    return;
                                }
                                if (
                                        r.start.isSameOrBefore(d.day, 'day')
                                     && (
                                            !r.end
                                          || r.end.isSameOrAfter(d.day, 'day')
                                        )
                                ){
                                    d.vehicle_id = coupling.value.id;
                                    d[k] = r;
                                    if (
                                            ("status"===k)
                                         && r.end
                                         && (r.start.isSame(r.end, 'second'))
                                       ){
                                            d[k] = null;
                                    }
                                }
                            });
                        });
                    });
                });
                schedule.value = res;
                
                console.log('schedule', weeks);
            }
            
        } catch(e){
            console.log('ERR (schedule)', e);
            $jet.msg({
                        text: `Ошибка получения данных сцепки.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                        color: 'warning'
            });
        } finally {
            pending.value = false;
        }
        
        return $m.toDate();
    });
    
    function set(q, val){
        console.log('set', q, val);
        switch(q){
            case 'month':
                $m = $m.month(val).startOf('month');
                break;
            case 'year':
                $m = $m.year(val).startOf('year');
                break;
            case 'next':
                let m1 = $m.month() + 1;
                $m = ( m1 > 11 ) ? $m.year($m.year() + 1).month(0).startOf('month') : $m.month(m1).startOf('month');
                break;
            case 'prev':
                let m2 = $m.month() - 1;
                $m = ( m2 < 0 ) ? $m.year($m.year() - 1).month(11).startOf('month') : $m.month(m2).startOf('month');
                break;
        }
        refreshNuxtData('scheldule');
    }   //set
    
    
    function deltrailer(day){
        $jet.msg({
                text: `Подтвердите удаление ${ day.trailers.reg_number } на ${ day.day.format('DD.MM.YYYY') }`,
                color: 'indigo',
                location: 'top',
                click_title: 'удалить',
                click: ok =>{
                    if (!ok){
                        return;
                    }
                    $jet.api({
                        url: `/vehicles/${coupling.value.id}/detach/trailer`,
                        method: 'POST',
                        body: {
                            end_date: day.day.format('YYYY-MM-DD 23:59:00'),
                            trailer_id: day.trailers.id
                        }
                    }).then( res => {
                        if ( res.success ){
                            refreshNuxtData('scheldule');
                        }
                    }).catch(e =>{
                        console.log('ERR(trailer)', e);
                        $jet.msg({
                                    text: `Ошибка удаления.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                                    color: 'warning'
                        });
                    });
                }
        });
    };
            
    function ontrailer(day, reload = false){
        if (reload){
            refreshNuxtData('scheldule');
        } else {
            trailerDlg.value.open(day);
        }
    };
    
    function ondriver(day, reload = false){
        if (reload){
            refreshNuxtData('scheldule');
        } else {
            driverDlg.value.open(day);
        }
    };
    
    function onstatus(day, reload = false){
        if (reload){
            refreshNuxtData('scheldule');
        } else {
            statusDlg.value.open(day);
        }
    };
    
    function delstatus(day){
        $jet.msg({
                text: `Подтвердите отмену статуса ${ day.status.title } на ${ day.day.format('DD.MM.YYYY') }`,
                color: 'indigo',
                location: 'top',
                click_title: 'подтвердить',
                click: ok =>{
                    if (!ok){
                        return;
                    }
                    $jet.api({
                        url: `/vehicles/${coupling.value.id}/detach/status`,
                        method: 'POST',
                        body: {
                            end_date: day.day.format('YYYY-MM-DD 00:00:00'),
                            status_journal_id: day.status.pivot.id
                        }
                    }).then( res => {
                        if ( res.success ){
                            refreshNuxtData('scheldule');
                        }
                    }).catch(e =>{
                        console.log('ERR(status)', e);
                        $jet.msg({
                                    text: `Ошибка отмены статуса.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                                    color: 'warning'
                        });
                    });
                }
        });
    }
    
</script>
<style lang='scss'>
    .ar-schedule {
        & table {
            border: 1px solid #ccc;
            border-left: 0 none;
            font-size: 0.9rem;
            & tr{
                &:first-child{
                    border-top: 1px solid #ccc;
                }
                & td{
                    border-left: 1px solid #ccc;
                    &.ontrip{
                        background-color: #FFFDE7;
                    }
                    & .v-btn{
                        background-color: transparent;
                    }
                    & .day{
                        font-weight: 600;
                        text-align: right;
                    }
                    & > div{
                        font-size: 0.75rem;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        margin-bottom: 4px;
                    }
                    & a {
                        color: unset;
                        padding-bottom: 4px;
                        border-bottom: 1px dotted transparent;
                        transition: all 0.33s ease;
                        &:link{
                            text-decoration: none;
                        }
                        &:hover{
                            border-bottom-color: #000;
                        }
                    }
                }
            }
        }
    }
</style>